import { NextRequest, NextResponse } from 'next/server'
import { validateSession, needsRefresh, refreshGoogleToken, createResponseWithSession } from '@/lib/session'

// Protected routes that require authentication
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files and API routes (except auth)
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }
  
  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))
  
  // Get current session
  const session = await validateSession(request)
  
  // If no session and trying to access protected route, redirect to auth
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }
  
  // If session exists and trying to access auth page, redirect to dashboard
  if (session && pathname === '/auth') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
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
        return createResponseWithSession(response, updatedSession)
      } else {
        // Refresh failed, redirect to auth
        const response = NextResponse.redirect(new URL('/auth', request.url))
        response.cookies.delete('session')
        return response
      }
    } catch (error) {
      console.error('Token refresh in middleware failed:', error)
      // If refresh fails, redirect to auth
      const response = NextResponse.redirect(new URL('/auth', request.url))
      response.cookies.delete('session')
      return response
    }
  }
  
  return NextResponse.next()
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