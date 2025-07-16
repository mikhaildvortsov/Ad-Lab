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
    const response = NextResponse.json({ 
      success: false, 
      message: 'Logout failed' 
    }, { status: 500 })
    
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