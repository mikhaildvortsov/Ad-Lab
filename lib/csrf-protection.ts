import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
const CSRF_CONFIG = {
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  secret: process.env.JWT_SECRET, 
  maxAge: 60 * 60 * 24, 
};
function getCSRFSecret(): Uint8Array {
  if (!CSRF_CONFIG.secret) {
    throw new Error('JWT_SECRET environment variable is required for CSRF protection!');
  }
  return new TextEncoder().encode(CSRF_CONFIG.secret);
}
export async function generateCSRFToken(sessionId?: string): Promise<string> {
  const payload = {
    type: 'csrf',
    sessionId: sessionId || 'anonymous',
    timestamp: Date.now(),
    exp: Math.floor(Date.now() / 1000) + CSRF_CONFIG.maxAge
  };
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(payload.exp)
    .sign(getCSRFSecret());
  return token;
}
export async function verifyCSRFToken(token: string, sessionId?: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getCSRFSecret());
    if (payload.type !== 'csrf') {
      return false;
    }
    if (sessionId && payload.sessionId !== sessionId) {
      return false;
    }
    return true;
  } catch (error) {
    console.warn('CSRF token verification failed:', error);
    return false;
  }
}
export async function checkCSRFProtection(request: NextRequest, sessionId?: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true };
  }
  const csrfTokenHeader = request.headers.get(CSRF_CONFIG.headerName);
  if (!csrfTokenHeader) {
    return { 
      valid: false, 
      error: 'CSRF token missing. Please include X-CSRF-Token header.' 
    };
  }
  const isValid = await verifyCSRFToken(csrfTokenHeader, sessionId);
  if (!isValid) {
    return { 
      valid: false, 
      error: 'Invalid CSRF token. Please refresh the page and try again.' 
    };
  }
  return { valid: true };
}
const SAFE_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  process.env.NEXTAUTH_URL,
].filter(Boolean);
export function checkOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  if (process.env.NODE_ENV === 'development') {
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') {
          return true;
        }
      } catch (error) {
        console.warn('Failed to parse origin URL:', origin);
      }
    }
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.hostname === 'localhost' || refererUrl.hostname === '127.0.0.1') {
          return true;
        }
      } catch (error) {
        console.warn('Failed to parse referer URL:', referer);
      }
    }
  }
  if (!origin && !referer) {
    return true; 
  }
  if (origin && SAFE_ORIGINS.includes(origin)) {
    return true;
  }
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      return SAFE_ORIGINS.includes(refererOrigin);
    } catch {
      return false;
    }
  }
  if (process.env.NODE_ENV === 'development') {
    console.warn('Origin check failed:', {
      origin,
      referer,
      safeOrigins: SAFE_ORIGINS,
      nextAuthUrl: process.env.NEXTAUTH_URL
    });
  }
  return false;
}
