import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Only allow in development or with specific debug header
  if (process.env.NODE_ENV === 'production' && !request.headers.get('x-debug-auth')) {
    return NextResponse.json({ error: 'Debug endpoint not available in production' }, { status: 403 })
  }

  const config = {
    environment: process.env.NODE_ENV,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT_SET',
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasJwtSecret: !!process.env.JWT_SECRET,
    requestUrl: request.url,
    expectedRedirectUri: `${process.env.NEXTAUTH_URL || 'NOT_SET'}/api/auth/google`
  }

  return NextResponse.json({
    message: 'OAuth Configuration Debug Info',
    config,
    recommendations: [
      !process.env.GOOGLE_CLIENT_ID && 'Set GOOGLE_CLIENT_ID environment variable',
      !process.env.GOOGLE_CLIENT_SECRET && 'Set GOOGLE_CLIENT_SECRET environment variable',
      !process.env.NEXTAUTH_URL && 'Set NEXTAUTH_URL to your production domain',
      !process.env.NEXTAUTH_SECRET && 'Set NEXTAUTH_SECRET for session encryption',
      !process.env.JWT_SECRET && 'Set JWT_SECRET for token signing'
    ].filter(Boolean)
  })
} 