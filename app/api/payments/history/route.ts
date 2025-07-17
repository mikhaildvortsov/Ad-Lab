import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { BillingService } from '@/lib/services/billing-service';

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10'); // Fewer payments for dashboard
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const sort_order = searchParams.get('sort_order') || 'DESC';

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const allowedSortFields = ['created_at', 'amount', 'status'];
    if (!allowedSortFields.includes(sort_by)) {
      return NextResponse.json(
        { error: 'Invalid sort field' },
        { status: 400 }
      );
    }

    const allowedSortOrders = ['ASC', 'DESC'];
    if (!allowedSortOrders.includes(sort_order.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid sort order' },
        { status: 400 }
      );
    }

    // Build query options
    const queryOptions = {
      page,
      limit,
      sort_by,
      sort_order: sort_order.toUpperCase() as 'ASC' | 'DESC'
    };

    // Get user's payment history
    const result = await BillingService.getUserPayments(userId, queryOptions);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch payment history' },
        { status: 500 }
      );
    }

    // Transform payment data for dashboard display
    const transformedPayments = result.data!.data.map(payment => ({
      id: payment.id,
      amount: parseFloat(payment.amount.toString()),
      currency: payment.currency,
      status: payment.status,
      payment_method: payment.payment_method,
      created_at: payment.created_at,
      completed_at: payment.completed_at,
      plan_name: payment.metadata?.plan_name || 'Unknown Plan',
      plan_id: payment.metadata?.plan_id || null
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        data: transformedPayments
      }
    });

  } catch (error) {
    console.error('Error in payments history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE payment request received');
    
    // Get current user session
    const session = await getSession();
    console.log('Session:', session ? 'exists' : 'null', session?.user?.id ? `user_id: ${session.user.id}` : 'no user id');
    
    if (!session?.user?.id) {
      console.log('Authentication failed - no session or user id');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');
    console.log('Payment ID to delete:', paymentId);

    if (!paymentId) {
      console.log('No payment ID provided');
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    console.log('Attempting to delete payment:', paymentId, 'for user:', userId);

    // Delete payment using BillingService
    const result = await BillingService.deletePayment(paymentId, userId);
    console.log('BillingService result:', result);

    if (!result.success) {
      console.log('Delete failed:', result.error);
      return NextResponse.json(
        { 
          error: result.error || 'Failed to delete payment',
          details: result.error 
        },
        { status: result.error === 'Payment not found' ? 404 : 500 }
      );
    }

    console.log('Payment deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 