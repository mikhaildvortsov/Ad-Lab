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
  
  // Check if required environment variables are configured
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
  const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  if (!googleClientId || !googleClientSecret) {
    console.error('🚨 Google OAuth Configuration Error:')
    console.error('❌ GOOGLE_CLIENT_ID exists:', !!googleClientId)
    console.error('❌ GOOGLE_CLIENT_SECRET exists:', !!googleClientSecret)
    console.error('💡 Solution: Set these environment variables in .env.local or Vercel settings')
    console.error('📝 Debug endpoint: /api/auth/debug')
    return NextResponse.redirect(new URL('/auth?error=oauth_not_configured', request.url))
  }
  
  // Если Google вернул ошибку
  if (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(new URL('/auth?error=google_auth_failed', request.url))
  }
  
  if (!code) {
    // Проверяем что это осознанный запрос на авторизацию, а не случайный редирект
    const intentHeader = request.headers.get('referer')
    const isFromAuthPage = intentHeader?.includes('/auth') || request.nextUrl.searchParams.get('intent') === 'login'
    
    if (!isFromAuthPage) {
      console.log('Google OAuth: Blocking automatic auth redirect, not from auth page')
      return NextResponse.redirect(new URL('/auth?error=auth_required', request.url))
    }
    
    // Дополнительная проверка через заголовки что это не автоматический запрос
    const userAgent = request.headers.get('user-agent') || ''
    const isBot = /bot|crawler|spider|crawling/i.test(userAgent)
    
    if (isBot) {
      console.log('Google OAuth: Blocking bot/crawler from OAuth')
      return NextResponse.redirect(new URL('/auth?error=auth_blocked', request.url))
    }
    
    // Первый этап - редирект на Google OAuth
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    googleAuthUrl.searchParams.set('client_id', googleClientId)
    googleAuthUrl.searchParams.set('redirect_uri', `${nextAuthUrl}/api/auth/google`)
    googleAuthUrl.searchParams.set('response_type', 'code')
    googleAuthUrl.searchParams.set('scope', 'openid email profile')
    googleAuthUrl.searchParams.set('access_type', 'offline')
    // Используем 'select_account' чтобы всегда показывать экран выбора аккаунта
    googleAuthUrl.searchParams.set('prompt', 'select_account')
    
    console.log('🚀 Redirecting to Google OAuth:', googleAuthUrl.toString())
    console.log('📍 Redirect URI configured:', `${nextAuthUrl}/api/auth/google`)
    
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
    
    // Проверяем существует ли пользователь в БД или создаем нового
    let dbUser;
    try {
      // Сначала ищем пользователя по Google ID
      const existingUserResult = await UserService.getUserByProviderId('google', userData.id);
      
      if (existingUserResult.success && existingUserResult.data) {
        // Пользователь существует, обновляем last_login_at
        dbUser = existingUserResult.data;
        console.log('Google OAuth: Found existing user:', {
          databaseId: dbUser.id,
          email: dbUser.email,
          providerId: dbUser.provider_id
        });
        
        // Validate that we have the correct UUID format
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
        // Пользователь не существует, создаем нового
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
          
          // Validate that we have the correct UUID format
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
    
    // Создаем сессию с данными пользователя из БД
    console.log('Google OAuth: Creating session with user ID:', dbUser.id);
    
    const sessionData: SessionData = {
      user: {
        id: dbUser.id,  // This should be the database UUID, not Google ID
        name: dbUser.name,
        email: dbUser.email,
        image: dbUser.avatar_url || undefined,
      },
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + tokenData.expires_in
    }
    
    // Final validation before creating session
    if (sessionData.user.id === userData.id) {
      console.error('CRITICAL ERROR: Session contains Google ID instead of database UUID!');
      console.error('Google ID:', userData.id);
      console.error('Database should have UUID:', dbUser.id);
      throw new Error('Session creation failed: wrong user ID');
    }
    
    // Создаем защищенную сессию
    await createSession(sessionData)
    
    // Редиректим на callback страницу для обновления AuthContext
    const redirectUrl = new URL('/auth/callback', request.url)
    
    console.log('Google OAuth: redirecting to callback:', redirectUrl.toString())
    
    return NextResponse.redirect(redirectUrl.toString())
    
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.redirect(new URL('/auth?error=google_auth_failed', request.url))
  }
} 