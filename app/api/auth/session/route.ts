import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 })
    }
    
    return NextResponse.json({ 
      user: session.user,
      expiresAt: session.expiresAt 
    })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
} 