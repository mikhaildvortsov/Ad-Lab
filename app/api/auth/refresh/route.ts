import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession, refreshGoogleToken, needsRefresh } from '@/lib/session'
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }
    if (!needsRefresh(session)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Token is still valid',
        expiresAt: session.expiresAt 
      })
    }
    const newTokenData = await refreshGoogleToken(session.refreshToken)
    if (!newTokenData) {
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
    }
    const updatedSession = await updateSession({
      accessToken: newTokenData.accessToken,
      expiresAt: newTokenData.expiresAt
    })
    if (!updatedSession) {
      return NextResponse.json({ error: 'Session update failed' }, { status: 500 })
    }
    return NextResponse.json({ 
      success: true, 
      message: 'Token refreshed successfully',
      expiresAt: updatedSession.expiresAt 
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
