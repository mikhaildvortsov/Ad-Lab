import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    console.log('Session API: Getting session...')
    const session = await getSession()
    console.log('Session API: Session result:', session ? 'found' : 'not found')
    
    if (!session) {
      console.log('Session API: Returning null user')
      return NextResponse.json({ user: null }, { status: 200 })
    }
    
    console.log('Session API: Returning user:', session.user.email)
    return NextResponse.json({ 
      user: session.user,
      expiresAt: session.expiresAt 
    })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
} 