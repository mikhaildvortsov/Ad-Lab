import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    return NextResponse.json({
      message: 'Cookie Debug Info',
      cookies: allCookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value.substring(0, 20) + '...' // Truncate for security
      })),
      sessionCookieExists: !!cookieStore.get('session'),
      requestCookies: request.cookies.getAll().map(cookie => ({
        name: cookie.name,
        value: cookie.value.substring(0, 20) + '...'
      }))
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get cookies',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 