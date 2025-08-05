import { NextRequest, NextResponse } from 'next/server'
import { createSession, createResponseWithSession, SessionData } from '@/lib/session'
import { UserService } from '@/lib/services/user-service'
export async function GET(request: NextRequest) {
  console.log('🔐 Google OAuth endpoint called:', request.url)
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  console.log('📝 OAuth params:', { 
    hasCode: !!code, 
    hasError: !!error,
    referer: request.headers.get('referer'),
    userAgent: request.headers.get('user-agent')?.substring(0, 50) + '...'
  })
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
  const nextAuthUrl = process.env.NEXTAUTH_URL || 'http:
  if (!googleClientId || !googleClientSecret) {
    console.error('🚨 Google OAuth Configuration Error:')
    console.error('❌ GOOGLE_CLIENT_ID exists:', !!googleClientId)
    console.error('❌ GOOGLE_CLIENT_SECRET exists:', !!googleClientSecret)
    console.error('💡 Solution: Set these environment variables in .env.local or Vercel settings')
    console.error('📝 Debug endpoint: /api/auth/debug')
    return NextResponse.redirect(new URL('/auth?error=oauth_not_configured', request.url))
  }
  if (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(new URL('/auth?error=google_auth_failed', request.url))
  }
  if (!code) {
    const intentHeader = request.headers.get('referer')
    const isFromAuthPage = intentHeader?.includes('/auth') || request.nextUrl.searchParams.get('intent') === 'login'
    if (!isFromAuthPage) {
      console.log('Google OAuth: Blocking automatic auth redirect, not from auth page')
      return NextResponse.redirect(new URL('/auth?error=auth_required', request.url))
    }
    const userAgent = request.headers.get('user-agent') || ''
    const isBot = /bot|crawler|spider|crawling/i.test(userAgent)
    if (isBot) {
      console.log('Google OAuth: Blocking bot/crawler from OAuth')
      return NextResponse.redirect(new URL('/auth?error=auth_blocked', request.url))
    }
    const googleAuthUrl = new URL('https:
    googleAuthUrl.searchParams.set('client_id', googleClientId)
    googleAuthUrl.searchParams.set('redirect_uri', `${nextAuthUrl}/api/auth/google`)
    googleAuthUrl.searchParams.set('response_type', 'code')
    googleAuthUrl.searchParams.set('scope', 'openid email profile')
    googleAuthUrl.searchParams.set('access_type', 'offline')
    googleAuthUrl.searchParams.set('prompt', 'select_account')
    console.log('🚀 Redirecting to Google OAuth:', googleAuthUrl.toString())
    console.log('📍 Redirect URI configured:', `${nextAuthUrl}/api/auth/google`)
    return NextResponse.redirect(googleAuthUrl.toString())
  }
  try {
    const tokenResponse = await fetch('https:
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${nextAuthUrl}/api/auth/google`,
      }),
    })
    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData)
      throw new Error('Failed to get access token')
    }
    const userResponse = await fetch('https:
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })
    const userData = await userResponse.json()
    if (!userResponse.ok) {
      console.error('User info failed:', userData)
      throw new Error('Failed to get user info')
    }
    let dbUser;
    try {
      const existingUserResult = await UserService.getUserByProviderId('google', userData.id);
      if (existingUserResult.success && existingUserResult.data) {
        dbUser = existingUserResult.data;
        console.log('Google OAuth: Found existing user:', {
          databaseId: dbUser.id,
          email: dbUser.email,
          providerId: dbUser.provider_id
        });
        if (!dbUser.id || dbUser.id.length !== 36 || !dbUser.id.includes('-')) {
          console.error('ERROR: Invalid user ID format from database:', dbUser.id);
          throw new Error('Invalid user ID format');
        }
        await UserService.updateUser(dbUser.id, { 
          name: userData.name,
          avatar_url: userData.picture || null
        });
        console.log('Google OAuth: existing user logged in:', dbUser.email);
      } else {
        const createUserResult = await UserService.createUser({
          email: userData.email,
          name: userData.name,
          avatar_url: userData.picture || null,
          provider: 'google',
          provider_id: userData.id,
          email_verified: userData.verified_email || true,
          preferred_language: 'ru'
        });
        if (createUserResult.success && createUserResult.data) {
          dbUser = createUserResult.data;
          console.log('Google OAuth: Created new user:', {
            databaseId: dbUser.id,
            email: dbUser.email,
            providerId: dbUser.provider_id
          });
          if (!dbUser.id || dbUser.id.length !== 36 || !dbUser.id.includes('-')) {
            console.error('ERROR: Invalid user ID format from database:', dbUser.id);
            throw new Error('Invalid user ID format');
          }
          console.log('Google OAuth: new user created:', dbUser.email);
        } else {
          console.error('Failed to create user:', createUserResult.error);
          throw new Error('Failed to create user in database');
        }
      }
    } catch (dbError) {
      console.error('Database error during user creation/retrieval:', dbError);
      throw new Error('Database operation failed');
    }
    if (!dbUser) {
      throw new Error('Failed to get or create user');
    }
    console.log('Google OAuth: Creating session with user ID:', dbUser.id);
    const sessionData: SessionData = {
      user: {
        id: dbUser.id,  
        name: dbUser.name,
        email: dbUser.email,
        image: dbUser.avatar_url || undefined,
      },
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + tokenData.expires_in
    }
    if (sessionData.user.id === userData.id) {
      console.error('CRITICAL ERROR: Session contains Google ID instead of database UUID!');
      console.error('Google ID:', userData.id);
      console.error('Database should have UUID:', dbUser.id);
      throw new Error('Session creation failed: wrong user ID');
    }
    await createSession(sessionData)
    const redirectUrl = new URL('/dashboard', request.url)
    console.log('Google OAuth: redirecting to dashboard:', redirectUrl.toString())
    const response = NextResponse.redirect(redirectUrl.toString())
    response.cookies.delete('logout_flag')
    console.log('Google OAuth: cleared logout_flag cookie for immediate access')
    return response
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.redirect(new URL('/auth?error=google_auth_failed', request.url))
  }
}
