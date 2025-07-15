import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Development helper to clear sessions
export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    
    // Clear session cookie
    cookieStore.delete('session');
    
    return NextResponse.json({
      success: true,
      message: 'Development session cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing dev session:', error);
    return NextResponse.json(
      { error: 'Failed to clear session' },
      { status: 500 }
    );
  }
} 