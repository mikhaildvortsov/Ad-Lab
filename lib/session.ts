import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// JWT secret key - in production, use a proper secret
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-at-least-32-characters-long'
)

// Session configuration
const SESSION_CONFIG = {
  cookieName: 'session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/'
  }
}

// Session data interface
export interface SessionData {
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
  accessToken: string
  refreshToken: string
  expiresAt: number
}

// Create a new session
export async function createSession(sessionData: SessionData) {
  const payload = {
    ...sessionData,
    exp: Math.floor(Date.now() / 1000) + SESSION_CONFIG.cookieOptions.maxAge
  }
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(payload.exp)
    .sign(JWT_SECRET)
  
  const cookieStore = await cookies()
  cookieStore.set(SESSION_CONFIG.cookieName, token, SESSION_CONFIG.cookieOptions)
  
  return token
}

// Get current session
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_CONFIG.cookieName)?.value
    
    if (!token) return null
    
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    return {
      user: payload.user as SessionData['user'],
      accessToken: payload.accessToken as string,
      refreshToken: payload.refreshToken as string,
      expiresAt: payload.expiresAt as number
    }
  } catch (error) {
    console.error('Session verification failed:', error)
    return null
  }
}

// Update session
export async function updateSession(sessionData: Partial<SessionData>) {
  const currentSession = await getSession()
  if (!currentSession) return null
  
  const updatedSession = { ...currentSession, ...sessionData }
  await createSession(updatedSession)
  
  return updatedSession
}

// Delete session
export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_CONFIG.cookieName)
}

// Check if session needs refresh
export function needsRefresh(session: SessionData): boolean {
  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = session.expiresAt - now
  // Refresh if token expires within 5 minutes
  return timeUntilExpiry < 300
}

// Refresh Google access token
export async function refreshGoogleToken(refreshToken: string): Promise<{
  accessToken: string
  expiresAt: number
} | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('Token refresh failed:', data)
      return null
    }
    
    return {
      accessToken: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + data.expires_in
    }
  } catch (error) {
    console.error('Token refresh error:', error)
    return null
  }
}

// Middleware helper for session validation
export async function validateSession(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_CONFIG.cookieName)?.value
  
  if (!sessionCookie) {
    return null
  }
  
  try {
    const { payload } = await jwtVerify(sessionCookie, JWT_SECRET)
    
    const session: SessionData = {
      user: payload.user as SessionData['user'],
      accessToken: payload.accessToken as string,
      refreshToken: payload.refreshToken as string,
      expiresAt: payload.expiresAt as number
    }
    
    return session
  } catch (error) {
    console.error('Session validation failed:', error)
    return null
  }
}

// Create response with updated session
export async function createResponseWithSession(
  response: NextResponse,
  sessionData: SessionData
) {
  const payload = {
    ...sessionData,
    exp: Math.floor(Date.now() / 1000) + SESSION_CONFIG.cookieOptions.maxAge
  }
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(payload.exp)
    .sign(JWT_SECRET)
  
  response.cookies.set(SESSION_CONFIG.cookieName, token, SESSION_CONFIG.cookieOptions)
  
  return response
} 