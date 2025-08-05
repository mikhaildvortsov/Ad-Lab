import { NextRequest, NextResponse } from 'next/server'
export async function GET(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development'
  const debugHeader = request.headers.get('x-debug-auth')
  if (!isDev && debugHeader !== 'true') {
    return NextResponse.json({ error: 'Debug endpoint not accessible' }, { status: 403 })
  }
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
  const nextAuthUrl = process.env.NEXTAUTH_URL
  const nextAuthSecret = process.env.NEXTAUTH_SECRET
  const jwtSecret = process.env.JWT_SECRET
  const config = {
    google_oauth: {
      client_id_exists: !!googleClientId,
      client_id_length: googleClientId?.length || 0,
      client_id_prefix: googleClientId?.substring(0, 10) + '...',
      client_secret_exists: !!googleClientSecret,
      client_secret_length: googleClientSecret?.length || 0,
    },
    app_config: {
      nextauth_url: nextAuthUrl || 'NOT SET',
      nextauth_secret_exists: !!nextAuthSecret,
      jwt_secret_exists: !!jwtSecret,
      node_env: process.env.NODE_ENV,
    },
    oauth_urls: {
      redirect_uri: `${nextAuthUrl || 'http://localhost:3000'}/api/auth/google`,
      google_auth_url: googleClientId ? 
        `https://accounts.google.com/o/oauth2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(`${nextAuthUrl || 'http://localhost:3000'}/api/auth/google`)}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account`
        : 'GOOGLE_CLIENT_ID not set'
    },
    validation: {
      ready_for_oauth: !!(googleClientId && googleClientSecret && nextAuthUrl),
      issues: []
    }
  }
  if (!googleClientId) {
    config.validation.issues.push('GOOGLE_CLIENT_ID is missing')
  }
  if (!googleClientSecret) {
    config.validation.issues.push('GOOGLE_CLIENT_SECRET is missing')
  }
  if (!nextAuthUrl) {
    config.validation.issues.push('NEXTAUTH_URL is missing - should be your domain (e.g., https:
  }
  if (nextAuthUrl?.includes('localhost') && process.env.NODE_ENV === 'production') {
    config.validation.issues.push('NEXTAUTH_URL is set to localhost in production')
  }
  return NextResponse.json(config, { 
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
