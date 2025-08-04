import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    // Удаляем сессию
    await deleteSession()
    
    console.log('Logout endpoint called - session deleted')
    
    // Создаем response с редиректом
    const response = NextResponse.redirect(new URL('/auth', request.url))
    
    // Множественная очистка cookie для надежности (БЕЗ logout_flag!)
    const cookieNames = ['session'] // Убираем 'logout_flag' из списка удаляемых
    const cookieOptions = [
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 0,
        expires: new Date(0),
        path: '/'
      },
      {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 0,
        expires: new Date(0),
        path: '/'
      }
    ]
    
    // Удаляем все возможные варианты cookie (кроме logout_flag)
    for (const cookieName of cookieNames) {
      for (const options of cookieOptions) {
        response.cookies.set(cookieName, '', options)
      }
    }
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    const response = NextResponse.redirect(new URL('/auth', request.url))
    
    // Удаляем cookie даже при ошибке (кроме logout_flag)
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0,
      expires: new Date(0),
      path: '/'
    })
    
    return response
  }
}

export async function POST(request: NextRequest) {
  try {
    // Удаляем сессию
    await deleteSession()
    
    console.log('Logout endpoint called - session deleted')
    
    // Создаем response
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    })
    
    // АГРЕССИВНАЯ очистка auth-related cookies (БЕЗ logout_flag!)
    const cookieNames = [
      'session', 
      // Убираем 'logout_flag' из списка! Он нужен для блокировки повторной авторизации
      'auth-token', 
      'refresh-token', 
      'access-token',
      '_token',
      'next-auth.session-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.session-token'
    ]
    
    const cookieOptions = [
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 0,
        expires: new Date(0),
        path: '/'
      },
      {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 0,
        expires: new Date(0),
        path: '/'
      },
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 0,
        expires: new Date(0),
        path: '/'
      },
      {
        maxAge: 0,
        expires: new Date(0),
        path: '/'
      }
    ]
    
    // Удаляем ВСЕ возможные варианты auth cookies (кроме logout_flag)
    for (const cookieName of cookieNames) {
      for (const options of cookieOptions) {
        response.cookies.set(cookieName, '', options)
      }
      
      // Дополнительное принудительное удаление
      response.cookies.delete(cookieName)
      response.cookies.delete({
        name: cookieName,
        path: '/'
      })
    }
    
    // Добавляем заголовки для принудительной очистки кеша
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
} 