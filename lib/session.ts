import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { isUserBlacklisted } from './token-blacklist'
let JWT_SECRET: Uint8Array | null = null;
function getJWTSecret(): Uint8Array {
  if (!JWT_SECRET) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required for security!')
    }
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long for security!')
    }
    JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
  }
  return JWT_SECRET;
}
const SESSION_CONFIG = {
  cookieName: 'session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: process.env.NODE_ENV === 'production' 
      ? 365 * 24 * 60 * 60
      : 30 * 24 * 60 * 60,
    path: '/'
  }
}
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
  cookieStore.delete('logout_flag')
  console.log('createSession: Cleared logout_flag cookie for user:', sessionData.user.email)
  return token
}
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies()
    const logoutFlag = cookieStore.get('logout_flag')?.value
    if (logoutFlag === 'true') {
      console.log('getSession: Logout flag detected, returning null')
      return null
    }
    const token = cookieStore.get(SESSION_CONFIG.cookieName)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, getJWTSecret())
    const sessionData = {
      user: payload.user as SessionData['user'],
      accessToken: payload.accessToken as string,
      refreshToken: payload.refreshToken as string,
      expiresAt: payload.expiresAt as number
    }
    if (isUserBlacklisted(sessionData.user)) {
      console.log('getSession: User is blacklisted, invalidating session:', sessionData.user.email)
      const cookieStore = await cookies()
      cookieStore.delete(SESSION_CONFIG.cookieName)
      return null
    }
    return sessionData
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      console.warn('JWT signature verification failed. This usually means:')
      console.warn('1. JWT_SECRET environment variable changed')
      console.warn('2. Session was created with different JWT_SECRET')
      console.warn('3. Session cookie is corrupted')
      console.warn('Solution: Clear browser cookies or restart with same JWT_SECRET')
      const cookieStore = await cookies()
      cookieStore.delete(SESSION_CONFIG.cookieName)
    } else {
      console.error('Session verification failed:', error)
    }
    return null
  }
}
export async function updateSession(sessionData: Partial<SessionData>) {
  const currentSession = await getSession()
  if (!currentSession) return null
  const updatedSession = { ...currentSession, ...sessionData }
  await createSession(updatedSession)
  return updatedSession
}
export async function deleteSession() {
  console.log('=== deleteSession() STARTED ===')
  const cookieStore = await cookies()
  const sessionCookieName = SESSION_CONFIG.cookieName
  console.log('=== deleteSession(): Deleting session cookie:', sessionCookieName, '===')
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
  for (const options of cookieOptions) {
    cookieStore.set(sessionCookieName, '', options)
  }
  try {
    cookieStore.delete(sessionCookieName)
    cookieStore.delete({
      name: sessionCookieName,
      path: '/',
    })
    console.log('=== deleteSession(): Session cookie deleted using delete() method ===')
  } catch (e) {
    console.warn('Could not use cookie delete method:', e)
  }
  console.log('=== deleteSession(): Setting logout_flag cookie ===')
  cookieStore.set('logout_flag', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60,
    path: '/'
  })
  console.log('=== deleteSession() COMPLETED: Session deleted with logout flag set for 60 seconds ===')
}
export function needsRefresh(session: SessionData): boolean {
  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = session.expiresAt - now
  return timeUntilExpiry < 300
}
export async function refreshGoogleToken(refreshToken: string): Promise<{
  accessToken: string
  expiresAt: number
} | null> {
  try {
    const response = await fetch('https:
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
export async function validateSession(request: NextRequest) {
  const logoutFlag = request.cookies.get('logout_flag')?.value
  if (logoutFlag === 'true') {
    console.log('validateSession: Logout flag detected, returning null session')
    return null
  }
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
    if (isUserBlacklisted(session.user)) {
      console.log('validateSession: User is blacklisted, invalidating session:', session.user.email)
      return null
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
  response.cookies.delete('logout_flag')
  return response
}
