import { NextRequest, NextResponse } from 'next/server'
import { createSession, createResponseWithSession, SessionData } from '@/lib/session'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  
  // Check if required environment variables are configured
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
  const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  if (!googleClientId || !googleClientSecret) {
    console.error('Google OAuth: Missing required environment variables')
    return NextResponse.redirect('/auth?error=oauth_not_configured')
  }
  
  // Если Google вернул ошибку
  if (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect('/auth?error=google_auth_failed')
  }
  
  if (!code) {
    // Первый этап - редирект на Google OAuth
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    googleAuthUrl.searchParams.set('client_id', googleClientId)
    googleAuthUrl.searchParams.set('redirect_uri', `${nextAuthUrl}/api/auth/google`)
    googleAuthUrl.searchParams.set('response_type', 'code')
    googleAuthUrl.searchParams.set('scope', 'openid email profile')
    googleAuthUrl.searchParams.set('access_type', 'offline')
    googleAuthUrl.searchParams.set('prompt', 'consent')
    
    return NextResponse.redirect(googleAuthUrl.toString())
  }
  
  try {
    // Второй этап - обмен кода на токен
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
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
    
    // Получаем информацию о пользователе
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })
    
    const userData = await userResponse.json()
    
    if (!userResponse.ok) {
      console.error('User info failed:', userData)
      throw new Error('Failed to get user info')
    }
    
    // Создаем пользователя
    const user = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      image: userData.picture,
    }
    
    console.log('Google OAuth: created user:', user)
    
    // Создаем сессию с токенами
    const sessionData: SessionData = {
      user,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + tokenData.expires_in
    }
    
    // Создаем защищенную сессию
    await createSession(sessionData)
    
    // Редиректим на callback страницу для обновления AuthContext
    const redirectUrl = new URL('/auth/callback', request.url)
    
    console.log('Google OAuth: redirecting to callback:', redirectUrl.toString())
    
    return NextResponse.redirect(redirectUrl.toString())
    
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.redirect('/auth?error=google_auth_failed')
  }
} 