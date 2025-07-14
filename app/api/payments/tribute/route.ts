import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/services/billing-service';
import { TributeService } from '@/lib/services/tribute-service';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  console.log('POST request received');
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { planId, planName, amount } = await request.json();

    // Validate input data
    if (!planId || !planName || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create payment record in database
    const paymentResult = await BillingService.createPayment({
      user_id: session.user.id,
      amount: amount,
      currency: 'RUB',
      payment_method: 'tribute',
      status: 'pending',
      metadata: {
        plan_id: planId,
        plan_name: planName,
        payment_type: 'subscription'
      }
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    const payment = paymentResult.data;

    if (!payment?.id) {
      return NextResponse.json(
        { error: 'Payment ID is missing' },
        { status: 500 }
      );
    }

    // Create Tribute payment through new service
    const tributePaymentData = await TributeService.createPayment({
      paymentId: payment.id,
      amount: amount,
      currency: 'RUB',
      description: `Оплата плана ${planName}`,
      userId: session.user.id,
      planName: planName,
      returnUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
      webhookUrl: `${process.env.NEXTAUTH_URL}/api/payments/webhook`
    });

    if (!tributePaymentData.success) {
      return NextResponse.json(
        { error: tributePaymentData.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...tributePaymentData.data
    });

  } catch (error) {
    console.error('Tribute payment creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Get payment information from database
    const payments = await BillingService.getUserPayments(session.user.id);
    const payment = payments.success && payments.data ? payments.data.data.find(p => p.id === paymentId) : null;

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check payment status through Tribute
    const statusResult = await TributeService.checkPaymentStatus(paymentId, payment.external_payment_id || '');

    if (!statusResult.success) {
      return NextResponse.json(
        { error: statusResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: statusResult.data?.status || 'pending',
      paymentId: paymentId
    });
  } catch (error) {
    console.error('Error checking Tribute payment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 