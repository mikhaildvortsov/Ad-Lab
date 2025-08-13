import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/services/billing-service';
import { TributeService } from '@/lib/services/tribute-service';
import { getSession } from '@/lib/session';
export async function POST(request: NextRequest) {
  console.log('POST request received');
  try {
    const session = await getSession();
    console.log('Session:', session?.user?.id ? 'Found' : 'Not found');
    if (!session?.user?.id) {
      console.log('Unauthorized: No valid session');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    let requestData;
    try {
      requestData = await request.json();
      console.log('Request data:', requestData);
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }
    const { planId, planName, amount } = requestData;
    if (!planId || !planName || !amount) {
      console.log('Missing required fields:', { planId, planName, amount });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    if (amount <= 0) {
      console.log('Invalid amount:', amount);
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }
    console.log('Creating payment record...');
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
    console.log('Payment result:', paymentResult);
    if (!paymentResult.success) {
      console.error('Failed to create payment record:', paymentResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to create payment record' },
        { status: 500 }
      );
    }
    const payment = paymentResult.data;
    if (!payment?.id) {
      console.error('Payment ID is missing from result');
      return NextResponse.json(
        { success: false, error: 'Payment ID is missing' },
        { status: 500 }
      );
    }
    console.log('Creating Tribute payment...');
    const tributePaymentData = await TributeService.createPayment({
      paymentId: payment.id,
      amount: amount,
      currency: 'RUB',
      description: ``,
      userId: session.user.id,
      planName: planName,
      planId: planId,
      returnUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
      webhookUrl: `${process.env.NEXTAUTH_URL}/api/payments/webhook`
    });
    console.log('Tribute payment result:', tributePaymentData);
    if (!tributePaymentData.success) {
      console.error('Tribute service error:', tributePaymentData.error);
      return NextResponse.json(
        { success: false, error: tributePaymentData.error },
        { status: 500 }
      );
    }
    console.log('Returning success response');
    return NextResponse.json({
      success: true,
      ...tributePaymentData.data
    });
  } catch (error) {
    console.error('Tribute payment creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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
    const payments = await BillingService.getUserPayments(session.user.id);
    const payment = payments.success && payments.data ? payments.data.data.find(p => p.id === paymentId) : null;
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }
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
