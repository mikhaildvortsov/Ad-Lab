import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/csrf-protection';
import { getSession } from '@/lib/session';
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const sessionId = session?.user?.id;
    const csrfToken = await generateCSRFToken(sessionId);
    return NextResponse.json({
      csrfToken,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
