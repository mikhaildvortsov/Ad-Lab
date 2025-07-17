import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { BillingService } from '@/lib/services/billing-service';

export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Create test payments
    const testPayments = [
      {
        user_id: userId,
        amount: 2990,
        currency: 'RUB',
        status: 'completed' as const,
        payment_method: 'tribute' as const,
        external_payment_id: 'test_payment_1',
        metadata: {
          plan_name: 'Month',
          plan_id: 'month'
        }
      },
      {
        user_id: userId,
        amount: 1990,
        currency: 'RUB',
        status: 'completed' as const,
        payment_method: 'tribute' as const,
        external_payment_id: 'test_payment_2',
        metadata: {
          plan_name: 'Week',
          plan_id: 'week'
        }
      },
      {
        user_id: userId,
        amount: 9990,
        currency: 'RUB',
        status: 'pending' as const,
        payment_method: 'tribute' as const,
        external_payment_id: 'test_payment_3',
        metadata: {
          plan_name: 'Quarter',
          plan_id: 'quarter'
        }
      }
    ];

    const results = [];
    for (const paymentData of testPayments) {
      const result = await BillingService.createPayment(paymentData);
      results.push(result);
    }

    return NextResponse.json({
      success: true,
      message: 'Test payments created',
      data: results
    });

  } catch (error) {
    console.error('Error creating test payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 