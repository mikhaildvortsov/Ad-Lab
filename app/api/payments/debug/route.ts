import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/database';
export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: Payment debug endpoint called');
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'Authentication required',
        debug: {
          session: session ? 'exists' : 'null',
          userId: session?.user?.id || 'not found'
        }
      }, { status: 401 });
    }
    const userId = session.user.id;
    console.log('DEBUG: User ID:', userId);
    const paymentsResult = await query(
      'SELECT id, user_id, amount, currency, status, payment_method, created_at, metadata FROM payments WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    console.log('DEBUG: Found payments:', paymentsResult.rows.length);
    const countResult = await query(
      'SELECT COUNT(*) as total FROM payments WHERE user_id = $1',
      [userId]
    );
    return NextResponse.json({
      success: true,
      debug: {
        userId: userId,
        totalPayments: countResult.rows[0].total,
        payments: paymentsResult.rows,
        databaseConnection: 'working'
      }
    });
  } catch (error) {
    console.error('DEBUG: Error in payment debug endpoint:', error);
    return NextResponse.json({
      error: 'Internal server error',
      debug: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorType: typeof error
      }
    }, { status: 500 });
  }
}
