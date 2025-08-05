import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
export async function GET(request: NextRequest) {
  try {
    console.log('Session API: Getting session...')
    const logoutFlag = request.cookies.get('logout_flag')?.value
    if (logoutFlag === 'true') {
      console.log('Session API: Logout flag detected, returning null user')
      return NextResponse.json({ user: null }, { status: 200 })
    }
    const sessionCookie = request.cookies.get('session')?.value
    if (!sessionCookie) {
      console.log('Session API: No session cookie found')
      return NextResponse.json({ user: null }, { status: 200 })
    }
    const session = await getSession()
    console.log('Session API: Session result:', session ? 'found' : 'not found')
    if (!session) {
      console.log('Session API: Session validation failed, returning null user')
      return NextResponse.json({ user: null }, { status: 200 })
    }
    if (!session.user || !session.user.id || !session.user.email) {
      console.log('Session API: Invalid session data structure')
      return NextResponse.json({ user: null }, { status: 200 })
    }
    console.log('Session API: Returning valid user:', session.user.email)
    return NextResponse.json({ 
      user: session.user,
      expiresAt: session.expiresAt 
    })
  } catch (error) {
    console.error('Session API error:', error)
    if (error instanceof Error) {
      if (error.message.includes('JWT') || error.message.includes('signature')) {
        console.log('Session API: JWT validation error, likely expired or invalid token')
        return NextResponse.json({ user: null }, { status: 200 })
      }
      if (error.message.includes('ERR_JWS_SIGNATURE_VERIFICATION_FAILED')) {
        console.log('Session API: JWT signature verification failed, clearing session')
        const response = NextResponse.json({ user: null }, { status: 200 })
        response.cookies.delete('session')
        return response
      }
    }
    console.error('Session API: Unexpected error, returning null user')
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
