import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

// CSRF configuration
const CSRF_CONFIG = {
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  secret: process.env.JWT_SECRET, // Reuse JWT secret for CSRF tokens
  maxAge: 60 * 60 * 24, // 24 hours
};

function getCSRFSecret(): Uint8Array {
  if (!CSRF_CONFIG.secret) {
    throw new Error('JWT_SECRET environment variable is required for CSRF protection!');
  }
  return new TextEncoder().encode(CSRF_CONFIG.secret);
}

// Generate CSRF token
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

// Verify CSRF token
export async function verifyCSRFToken(token: string, sessionId?: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getCSRFSecret());
    
    // Verify token type and session match
    if (payload.type !== 'csrf') {
      return false;
    }

    // For authenticated users, verify session ID matches
    if (sessionId && payload.sessionId !== sessionId) {
      return false;
    }

    return true;
  } catch (error) {
    console.warn('CSRF token verification failed:', error);
    return false;
  }
}

// Check CSRF protection for request
export async function checkCSRFProtection(request: NextRequest, sessionId?: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true };
  }

  // Get CSRF token from header
  const csrfTokenHeader = request.headers.get(CSRF_CONFIG.headerName);
  if (!csrfTokenHeader) {
    return { 
      valid: false, 
      error: 'CSRF token missing. Please include X-CSRF-Token header.' 
    };
  }

  // Verify CSRF token
  const isValid = await verifyCSRFToken(csrfTokenHeader, sessionId);
  if (!isValid) {
    return { 
      valid: false, 
      error: 'Invalid CSRF token. Please refresh the page and try again.' 
    };
  }

  return { valid: true };
}

// Safe origins for CSRF (add your production domains here)
const SAFE_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  process.env.NEXTAUTH_URL,
  // Add your production domains here
].filter(Boolean);

// Verify origin for additional CSRF protection
export function checkOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // For same-origin requests, origin might be null
  if (!origin && !referer) {
    return true; // Allow same-origin requests without origin header
  }

  // Check if origin is in safe list
  if (origin && SAFE_ORIGINS.includes(origin)) {
    return true;
  }

  // Check if referer domain matches safe origins
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      return SAFE_ORIGINS.includes(refererOrigin);
    } catch {
      return false;
    }
  }

  return false;
} 