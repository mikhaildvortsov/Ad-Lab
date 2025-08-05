import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/session'
export async function GET(request: NextRequest) {
  try {
    await deleteSession()
    console.log('Logout endpoint called - session deleted')
    const response = NextResponse.redirect(new URL('/', request.url))
    const cookieNames = ['session'] 
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
    for (const cookieName of cookieNames) {
      for (const options of cookieOptions) {
        response.cookies.set(cookieName, '', options)
      }
    }
    return response
  } catch (error) {
    console.error('Logout error:', error)
    const response = NextResponse.redirect(new URL('/', request.url))
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
    console.log('=== LOGOUT API CALLED ===')
    await deleteSession()
    console.log('=== LOGOUT API: deleteSession() completed ===')
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    })
    const cookieNames = [
      'session', 
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
    for (const cookieName of cookieNames) {
      for (const options of cookieOptions) {
        response.cookies.set(cookieName, '', options)
      }
      response.cookies.delete(cookieName)
      response.cookies.delete({
        name: cookieName,
        path: '/'
      })
    }
    console.log('=== LOGOUT API: checking if logout_flag was set by deleteSession ===')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    console.log('=== LOGOUT API COMPLETED SUCCESSFULLY ===')
    return response
  } catch (error) {
    console.error('=== LOGOUT API ERROR ===', error)
    const response = NextResponse.json({ 
      success: false, 
      error: 'Logout failed' 
    }, { status: 500 })
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
