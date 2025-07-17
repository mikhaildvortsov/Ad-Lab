import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    // Удаляем сессию
    await deleteSession()
    
    console.log('Logout endpoint called - session deleted')
    
    // Создаем response с редиректом
    const response = NextResponse.redirect(new URL('/', request.url))
    
    // Множественная очистка cookie для надежности
    const cookieNames = ['session', 'logout_flag']
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
    
    // Удаляем все возможные варианты cookie
    for (const cookieName of cookieNames) {
      for (const options of cookieOptions) {
        response.cookies.set(cookieName, '', options)
      }
    }
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    const response = NextResponse.redirect(new URL('/', request.url))
    
    // Удаляем cookie даже при ошибке
    const cookieNames = ['session', 'logout_flag']
    for (const cookieName of cookieNames) {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 0,
        expires: new Date(0),
        path: '/'
      })
    }
    
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
    
    // АГРЕССИВНАЯ очистка ВСЕХ возможных auth-related cookies
    const cookieNames = [
      'session', 
      'logout_flag', 
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
    
    // Удаляем ВСЕ возможные варианты auth cookies
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
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    const response = NextResponse.json({ 
      success: false, 
      message: 'Logout failed' 
    }, { status: 500 })
    
    // Удаляем cookie даже при ошибке (упрощенная версия)
    const cookieNames = ['session', 'logout_flag']
    for (const cookieName of cookieNames) {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 0,
        expires: new Date(0),
        path: '/'
      })
    }
    
    return response
  }
} 