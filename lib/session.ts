import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// JWT secret key - lazy initialization for build compatibility
let JWT_SECRET: Uint8Array | null = null;

function getJWTSecret(): Uint8Array {
  if (!JWT_SECRET) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required for security!')
    }
    
    // Validate JWT_SECRET length (minimum 32 characters for security)
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long for security!')
    }
    
    JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
  }
  return JWT_SECRET;
}

// Session configuration
const SESSION_CONFIG = {
  cookieName: 'session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    // В продакшене - 1 год, в разработке - 30 дней
    maxAge: process.env.NODE_ENV === 'production' 
      ? 365 * 24 * 60 * 60 // 1 год для продакшена
      : 30 * 24 * 60 * 60,  // 30 дней для разработки
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
    .sign(getJWTSecret())
  
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
    
    const { payload } = await jwtVerify(token, getJWTSecret())
    
    return {
      user: payload.user as SessionData['user'],
      accessToken: payload.accessToken as string,
      refreshToken: payload.refreshToken as string,
      expiresAt: payload.expiresAt as number
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      console.warn('JWT signature verification failed. This usually means:')
      console.warn('1. JWT_SECRET environment variable changed')
      console.warn('2. Session was created with different JWT_SECRET')
      console.warn('3. Session cookie is corrupted')
      console.warn('Solution: Clear browser cookies or restart with same JWT_SECRET')
      
      // Clear the invalid session cookie
      const cookieStore = await cookies()
      cookieStore.delete(SESSION_CONFIG.cookieName)
    } else {
      console.error('Session verification failed:', error)
    }
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
    const { payload } = await jwtVerify(sessionCookie, getJWTSecret())
    
    const session: SessionData = {
      user: payload.user as SessionData['user'],
      accessToken: payload.accessToken as string,
      refreshToken: payload.refreshToken as string,
      expiresAt: payload.expiresAt as number
    }
    
    return session
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      console.warn('JWT signature verification failed in middleware. This usually means:')
      console.warn('1. JWT_SECRET environment variable changed')
      console.warn('2. Session was created with different JWT_SECRET')
      console.warn('3. Session cookie is corrupted')
      console.warn('Solution: Clear browser cookies or restart with same JWT_SECRET')
    } else {
      console.error('Session validation failed:', error)
    }
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
    .sign(getJWTSecret())
  
  response.cookies.set(SESSION_CONFIG.cookieName, token, SESSION_CONFIG.cookieOptions)
  
  return response
} 