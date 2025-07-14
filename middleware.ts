import { NextRequest, NextResponse } from 'next/server'
import { validateSession, needsRefresh, refreshGoogleToken, createResponseWithSession } from '@/lib/session'
import { checkCSRFProtection, checkOrigin } from '@/lib/csrf-protection'
import { applyEnvironmentHeaders } from '@/lib/security-headers'
import { locales, defaultLocale } from '@/lib/i18n'

// Protected routes that require authentication (including localized versions)
const protectedRoutes = [
  '/dashboard',
  '/chat',
  '/pricing'
]

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth',
  '/auth/callback',
  '/api/auth/google',
  '/api/auth/login',
  '/api/auth/logout'
]

function getLocaleFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  return locales.includes(firstSegment as any) ? firstSegment : null
}

function removeLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  
  if (locales.includes(firstSegment as any)) {
    const pathWithoutLocale = '/' + segments.slice(1).join('/')
    return pathWithoutLocale === '/' ? '/' : pathWithoutLocale
  }
  
  return pathname
}

function isProtectedPath(pathname: string): boolean {
  const pathWithoutLocale = removeLocaleFromPath(pathname)
  return protectedRoutes.some(route => pathWithoutLocale.startsWith(route))
}

function isPublicPath(pathname: string): boolean {
  const pathWithoutLocale = removeLocaleFromPath(pathname)
  return publicRoutes.some(route => pathWithoutLocale === route || pathWithoutLocale.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files and specific API routes
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') ||
      pathname === '/api/csrf-token') {
    const response = NextResponse.next()
    return applyEnvironmentHeaders(response)
  }

  // Apply CSRF protection to API routes (except auth callbacks)
  if (pathname.startsWith('/api/') && 
      !pathname.startsWith('/api/auth/google') && 
      !pathname.startsWith('/api/auth/callback')) {
    
    // Check origin for additional security
    if (!checkOrigin(request)) {
      const response = NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      )
      return applyEnvironmentHeaders(response)
    }

    // Get session for CSRF validation
    const session = await validateSession(request)
    const sessionId = session?.user?.id

    // Check CSRF protection
    const csrfCheck = await checkCSRFProtection(request, sessionId)
    if (!csrfCheck.valid) {
      const response = NextResponse.json(
        { error: csrfCheck.error || 'CSRF validation failed' },
        { status: 403 }
      )
      return applyEnvironmentHeaders(response)
    }
  }
  
  // Check if route requires authentication (support localized routes)
  const isProtectedRoute = isProtectedPath(pathname)
  const isPublicRoute = isPublicPath(pathname)
  
  // Get current session
  const session = await validateSession(request)
  
  // If no session and trying to access protected route, redirect to auth
  if (!session && isProtectedRoute) {
    const response = NextResponse.redirect(new URL('/auth', request.url))
    return applyEnvironmentHeaders(response)
  }
  
  // If session exists and trying to access auth page, redirect to dashboard
  // Preserve locale in redirect
  if (session && (pathname === '/auth' || pathname.match(/^\/[a-z]{2}\/auth$/))) {
    const locale = getLocaleFromPath(pathname)
    const dashboardPath = locale && locale !== defaultLocale ? `/${locale}/dashboard` : '/dashboard'
    const response = NextResponse.redirect(new URL(dashboardPath, request.url))
    return applyEnvironmentHeaders(response)
  }
  
  // If session exists, check if token needs refresh
  if (session && needsRefresh(session)) {
    try {
      const newTokenData = await refreshGoogleToken(session.refreshToken)
      
      if (newTokenData) {
        // Update session with new token
        const updatedSession = {
          ...session,
          accessToken: newTokenData.accessToken,
          expiresAt: newTokenData.expiresAt
        }
        
        // Create response with updated session
        const response = NextResponse.next()
        const responseWithSession = await createResponseWithSession(response, updatedSession)
        return applyEnvironmentHeaders(responseWithSession)
      } else {
        // Refresh failed, redirect to auth
        const response = NextResponse.redirect(new URL('/auth', request.url))
        response.cookies.delete('session')
        return applyEnvironmentHeaders(response)
      }
    } catch (error) {
      console.error('Token refresh in middleware failed:', error)
      // If refresh fails, redirect to auth
      const response = NextResponse.redirect(new URL('/auth', request.url))
      response.cookies.delete('session')
      return applyEnvironmentHeaders(response)
    }
  }
  
  // Continue without modification
  const response = NextResponse.next()
  return applyEnvironmentHeaders(response)
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 