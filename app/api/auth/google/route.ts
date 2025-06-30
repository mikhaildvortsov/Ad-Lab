import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (!code) {
    // Первый этап - редирект на Google OAuth
    const googleAuthUrl = new URL('https://accounts.google.com/oauth/authorize')
    googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '')
    googleAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/auth/google`)
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
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/auth/google`,
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
    
    // Редиректим на главную страницу с данными пользователя
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('auth', 'success')
    redirectUrl.searchParams.set('user', JSON.stringify(user))
    
    return NextResponse.redirect(redirectUrl.toString())
    
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.redirect('/auth?error=google_auth_failed')
  }
} 