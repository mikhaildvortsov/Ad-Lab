import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/database';
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (process.env.NODE_ENV === 'production') {
      const userResult = await query(
        'SELECT * FROM users WHERE id = $1 AND email = $2',
        [session.user.id, process.env.ADMIN_EMAIL || 'admin@adlab.com']
      );
      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }
    const { action } = await request.json();
    switch (action) {
      case 'clear_all_sessions':
        return NextResponse.json({
          success: true,
          message: 'All sessions will expire naturally based on JWT expiry'
        });
      case 'get_session_info':
        return NextResponse.json({
          success: true,
          data: {
            currentUser: session.user,
            sessionExpiry: new Date(session.expiresAt * 1000).toISOString(),
            environment: process.env.NODE_ENV
          }
        });
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in admin sessions endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
