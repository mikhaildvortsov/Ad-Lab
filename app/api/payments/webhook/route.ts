import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/services/billing-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the webhook for debugging
    console.log('Payment webhook received:', JSON.stringify(body, null, 2));
    
    // Basic webhook validation (you should implement proper signature validation in production)
    if (!body.object || !body.event) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    const { event, object: paymentObject } = body;

    // Handle different payment events
    switch (event) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(paymentObject);
        break;
        
      case 'payment.canceled':
        await handlePaymentCanceled(paymentObject);
        break;
        
      case 'payment.waiting_for_capture':
        await handlePaymentWaitingForCapture(paymentObject);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing payment webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentObject: any) {
  try {
    console.log('Payment succeeded:', paymentObject.id);
    
    // Update payment status in database
    if (paymentObject.metadata?.internal_payment_id) {
      await BillingService.updatePayment(
        paymentObject.metadata.internal_payment_id,
        {
          status: 'completed',
          external_payment_id: paymentObject.id,
          metadata: paymentObject
        }
      );
    }

    // Here you could also:
    // - Activate user subscription
    // - Send confirmation email
    // - Update user's plan
    
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentCanceled(paymentObject: any) {
  try {
    console.log('Payment canceled:', paymentObject.id);
    
    // Update payment status in database
    if (paymentObject.metadata?.internal_payment_id) {
      await BillingService.updatePayment(
        paymentObject.metadata.internal_payment_id,
        {
          status: 'cancelled',
          external_payment_id: paymentObject.id,
          metadata: paymentObject
        }
      );
    }
    
  } catch (error) {
    console.error('Error handling payment canceled:', error);
  }
}

async function handlePaymentWaitingForCapture(paymentObject: any) {
  try {
    console.log('Payment waiting for capture:', paymentObject.id);
    
    // Update payment status in database
    if (paymentObject.metadata?.internal_payment_id) {
      await BillingService.updatePayment(
        paymentObject.metadata.internal_payment_id,
        {
          status: 'pending',
          external_payment_id: paymentObject.id,
          metadata: paymentObject
        }
      );
    }
    
  } catch (error) {
    console.error('Error handling payment waiting for capture:', error);
  }
}

// GET method for webhook verification (some payment providers require this)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
} 