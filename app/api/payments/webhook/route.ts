import { NextRequest, NextResponse } from 'next/server';
import { TributeService } from '@/lib/services/tribute-service';
import { BillingService } from '@/lib/services/billing-service';

// Функция для определения периода подписки по имени плана
function getSubscriptionPeriod(planName: string): { amount: number; unit: 'days' | 'months' } {
  const planNameLower = planName?.toLowerCase();
  
  if (planNameLower?.includes('week') || planNameLower?.includes('недел')) {
    return { amount: 7, unit: 'days' };
  } else if (planNameLower?.includes('quarter') || planNameLower?.includes('квартал') || planNameLower?.includes('3')) {
    return { amount: 3, unit: 'months' };
  } else {
    // По умолчанию - месяц
    return { amount: 1, unit: 'months' };
  }
}

// Функция для добавления периода к дате
function addPeriodToDate(date: Date, period: { amount: number; unit: 'days' | 'months' }): Date {
  const newDate = new Date(date);
  
  if (period.unit === 'days') {
    newDate.setDate(newDate.getDate() + period.amount);
  } else if (period.unit === 'months') {
    newDate.setMonth(newDate.getMonth() + period.amount);
  }
  
  return newDate;
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-tribute-signature') || 
                     request.headers.get('x-signature') || 
                     request.headers.get('signature') || '';
    const contentType = request.headers.get('content-type') || '';
    console.log('Webhook received:', { 
      signature: signature ? '[PRESENT]' : '[MISSING]', 
      contentType,
      bodyLength: body.length 
    });
    if (signature && !TributeService.validateWebhookSignature(body, signature)) {
      console.error('Invalid Tribute webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    let payload;
    if (contentType.includes('application/json')) {
      payload = JSON.parse(body);
    } else {
      const searchParams = new URLSearchParams(body);
      payload = Object.fromEntries(searchParams.entries());
    }
    const processed = await processTributeWebhook(payload);
    if (processed) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
    }
  } catch (error) {
    console.error('Tribute webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
async function processTributeWebhook(payload: any): Promise<boolean> {
  try {
    const { event, orderId, orderNumber, status, amount, currency, paymentId } = payload;
    console.log('Processing Tribute webhook:', {
      event,
      orderId,
      orderNumber,
      status,
      amount,
      currency,
      paymentId
    });
    const extractedPaymentId = paymentId || extractPaymentIdFromOrderNumber(orderNumber);
    if (!extractedPaymentId) {
      console.error('Could not extract payment ID from webhook data');
      return false;
    }
    switch (event || status) {
      case 'payment.completed':
      case 'order.success':
      case 'success':
      case 'completed':
        return await handlePaymentSuccess(extractedPaymentId, {
          orderId,
          amount: parseFloat(amount) || 0,
          currency: currency || 'RUB'
        });
      case 'payment.failed':
      case 'order.failed':
      case 'failed':
        return await handlePaymentFailed(extractedPaymentId);
      case 'payment.expired':
      case 'order.expired':
      case 'expired':
        return await handlePaymentExpired(extractedPaymentId);
      case 'subscription.created':
        return await handleSubscriptionCreated(extractedPaymentId, payload);
      case 'subscription.cancelled':
        return await handleSubscriptionCancelled(extractedPaymentId);
      default:
        console.log('Unknown Tribute webhook event:', event || status);
        return true; 
    }
  } catch (error) {
    console.error('Error processing Tribute webhook:', error);
    return false;
  }
}
function extractPaymentIdFromOrderNumber(orderNumber: string): string | null {
  if (!orderNumber) return null;
  const match = orderNumber.match(/^tribute_([^_]+)_\d+$/);
  return match ? match[1] : null;
}
async function handlePaymentSuccess(paymentId: string, paymentData: any): Promise<boolean> {
  try {
    const updateResult = await BillingService.updatePayment(paymentId, {
      status: 'completed',
      external_payment_id: paymentData.orderId,
      metadata: {
        paid_amount: paymentData.amount,
        paid_currency: paymentData.currency,
        paid_at: new Date().toISOString()
      }
    });
    if (!updateResult.success) {
      console.error('Failed to update payment status:', updateResult.error);
      return false;
    }
    const payment = updateResult.data;
    if (payment?.metadata?.plan_id) {
      // Получаем информацию о плане для определения периода
      const planResult = await BillingService.getSubscriptionPlan(payment.metadata.plan_id);
      const planName = planResult.success ? planResult.data?.name : payment.metadata.plan_name;
      const subscriptionPeriod = getSubscriptionPeriod(planName || '');
      
      console.log('Plan name:', planName, 'Subscription period:', subscriptionPeriod);
      
      // Проверим, есть ли у пользователя активная подписка
      const existingSubscriptionResult = await BillingService.getUserSubscription(payment.user_id);
      
      if (existingSubscriptionResult.success) {
        // У пользователя есть активная подписка - продлеваем её
        console.log('Found existing active subscription, extending period');
        const currentSubscription = existingSubscriptionResult.data;
        const currentEndDate = new Date(currentSubscription.current_period_end);
        const newEndDate = addPeriodToDate(currentEndDate, subscriptionPeriod);
        
        const extensionResult = await BillingService.updateUserSubscription(
          currentSubscription.id,
          {
            current_period_end: newEndDate,
            metadata: {
              ...currentSubscription.metadata,
              last_extension_payment_id: paymentId,
              last_extension_period: subscriptionPeriod,
              extended_via: 'tribute_payment',
              extended_at: new Date().toISOString()
            }
          }
        );
        
        if (!extensionResult.success) {
          console.error('Failed to extend subscription:', extensionResult.error);
          return false;
        }
        console.log(`Subscription extended successfully until: ${newEndDate.toISOString()} (added ${subscriptionPeriod.amount} ${subscriptionPeriod.unit})`);
      } else {
        // У пользователя нет активной подписки - создаем новую
        console.log('No active subscription found, creating new one');
        const startDate = new Date();
        const endDate = addPeriodToDate(startDate, subscriptionPeriod);
        
        const subscriptionResult = await BillingService.createUserSubscription({
          user_id: payment.user_id,
          plan_id: payment.metadata.plan_id,
          status: 'active',
          current_period_start: startDate,
          current_period_end: endDate,
          metadata: {
            payment_id: paymentId,
            subscription_period: subscriptionPeriod,
            activated_via: 'tribute_payment'
          }
        });
        
        if (!subscriptionResult.success) {
          console.error('Failed to create subscription:', subscriptionResult.error);
          return false;
        }
        console.log(`New subscription created successfully until: ${endDate.toISOString()} (${subscriptionPeriod.amount} ${subscriptionPeriod.unit})`);
      }
    }
    console.log('Payment processed successfully:', paymentId);
    return true;
  } catch (error) {
    console.error('Error handling payment success:', error);
    return false;
  }
}
async function handlePaymentFailed(paymentId: string): Promise<boolean> {
  try {
    const updateResult = await BillingService.updatePayment(paymentId, {
      status: 'failed'
    });
    return updateResult.success;
  } catch (error) {
    console.error('Error handling payment failure:', error);
    return false;
  }
}
async function handlePaymentExpired(paymentId: string): Promise<boolean> {
  try {
    const updateResult = await BillingService.updatePayment(paymentId, {
      status: 'cancelled'
    });
    return updateResult.success;
  } catch (error) {
    console.error('Error handling payment expiration:', error);
    return false;
  }
}
async function handleSubscriptionCreated(paymentId: string, payload: any): Promise<boolean> {
  try {
    console.log('Subscription created for payment:', paymentId, payload);
    const updateResult = await BillingService.updatePayment(paymentId, {
      status: 'completed',
      metadata: {
        subscription_id: payload.subscriptionId || payload.subscription_id,
        subscription_status: 'active'
      }
    });
    return updateResult.success;
  } catch (error) {
    console.error('Error handling subscription creation:', error);
    return false;
  }
}
async function handleSubscriptionCancelled(paymentId: string): Promise<boolean> {
  try {
    console.log('Subscription cancelled for payment:', paymentId);
    return true;
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    return false;
  }
}
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
