import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/services/billing-service';
import { isYooKassaConfigured } from '@/lib/yookassa-client';
import crypto from 'crypto';

// Интерфейс для уведомления от YooKassa
interface YooKassaWebhookEvent {
  type: 'notification';
  event: 'payment.succeeded' | 'payment.canceled' | 'payment.waiting_for_capture';
  object: {
    id: string;
    status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
    amount: {
      value: string;
      currency: 'RUB';
    };
    description: string;
    recipient: {
      account_id: string;
      gateway_id: string;
    };
    payment_method: {
      type: string;
      id: string;
      saved: boolean;
    };
    captured_at?: string;
    created_at: string;
    test: boolean;
    refunded_amount?: {
      value: string;
      currency: 'RUB';
    };
    paid: boolean;
    refundable: boolean;
    metadata?: Record<string, any>;
  };
}

// Функция для проверки подписи вебхука
function verifyWebhookSignature(body: string, signature: string, secretKey: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Обработчик вебхука от YooKassa
export async function POST(request: NextRequest) {
  try {
    // Проверяем настройку YooKassa
    if (!isYooKassaConfigured()) {
      console.error('YooKassa не настроена');
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    // Получаем тело запроса как строку для проверки подписи
    const body = await request.text();
    
    // Получаем заголовки
    const signature = request.headers.get('HTTP_YOOKASSA_SIGNATURE');
    const contentType = request.headers.get('content-type');

    // Проверяем content-type
    if (contentType !== 'application/json') {
      console.error('Invalid content-type:', contentType);
      return NextResponse.json(
        { error: 'Invalid content-type' },
        { status: 400 }
      );
    }

    // Проверяем наличие подписи
    if (!signature) {
      console.error('Missing signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Проверяем подпись (в production окружении)
    if (process.env.NODE_ENV === 'production') {
      const isValidSignature = verifyWebhookSignature(
        body,
        signature,
        process.env.YOOKASSA_SECRET_KEY!
      );

      if (!isValidSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 403 }
        );
      }
    }

    // Парсим JSON
    let webhookEvent: YooKassaWebhookEvent;
    try {
      webhookEvent = JSON.parse(body);
    } catch (error) {
      console.error('Invalid JSON in webhook body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    // Проверяем тип уведомления
    if (webhookEvent.type !== 'notification') {
      console.log('Ignoring non-notification webhook event:', webhookEvent.type);
      return NextResponse.json({ status: 'ignored' });
    }

    const payment = webhookEvent.object;
    console.log('Processing webhook for payment:', {
      paymentId: payment.id,
      status: payment.status,
      event: webhookEvent.event,
      amount: payment.amount.value,
      test: payment.test
    });

    // Находим платеж в нашей базе данных по external_payment_id
    const paymentResult = await BillingService.findPaymentByExternalId(payment.id);

    if (!paymentResult.success || !paymentResult.data) {
      console.error('Payment not found in database:', payment.id);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const dbPayment = paymentResult.data;

    // Определяем новый статус на основе события
    let newStatus: 'pending' | 'completed' | 'failed' | 'refunded' = dbPayment.status;
    let completedAt: Date | undefined;
    let failedAt: Date | undefined;
    let failureReason: string | undefined;

    switch (webhookEvent.event) {
      case 'payment.succeeded':
        newStatus = 'completed';
        completedAt = new Date();
        break;
        
      case 'payment.canceled':
        newStatus = 'failed';
        failedAt = new Date();
        failureReason = 'Платеж отменен';
        break;
        
      case 'payment.waiting_for_capture':
        // Платеж ожидает подтверждения (автоматически подтверждаем)
        newStatus = 'pending';
        break;
        
      default:
        console.log('Unhandled webhook event:', webhookEvent.event);
        return NextResponse.json({ status: 'ignored' });
    }

    // Обновляем статус платежа в базе данных только если статус изменился
    if (newStatus !== dbPayment.status) {
      const updateResult = await BillingService.updatePayment(dbPayment.id, {
        status: newStatus,
        completed_at: completedAt,
        failed_at: failedAt,
        failure_reason: failureReason,
        metadata: {
          ...dbPayment.metadata,
          webhookReceived: new Date().toISOString(),
          yookassaEvent: webhookEvent.event,
          yookassaStatus: payment.status
        }
      });

      if (!updateResult.success) {
        console.error('Failed to update payment status:', updateResult.error);
        return NextResponse.json(
          { error: 'Failed to update payment' },
          { status: 500 }
        );
      }

      console.log('Payment status updated:', {
        paymentId: dbPayment.id,
        oldStatus: dbPayment.status,
        newStatus: newStatus
      });

      // Если платеж успешно завершен, создаем или обновляем подписку пользователя
      if (newStatus === 'completed' && dbPayment.metadata?.planId) {
        try {
          await BillingService.createUserSubscription({
            user_id: dbPayment.user_id,
            plan_id: dbPayment.metadata.planId,
            payment_method: 'sbp',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
            auto_renew: true
          });

          console.log('User subscription created for payment:', dbPayment.id);
        } catch (error) {
          console.error('Failed to create user subscription:', error);
          // Не возвращаем ошибку, так как платеж уже обработан
        }
      }
    } else {
      console.log('Payment status unchanged, skipping update');
    }

    // Возвращаем успешный ответ
    return NextResponse.json({
      status: 'processed',
      paymentId: payment.id,
      newStatus: newStatus
    });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// GET метод для проверки работоспособности вебхука
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'YooKassa webhook endpoint is ready',
    timestamp: new Date().toISOString(),
    configured: isYooKassaConfigured()
  });
} 