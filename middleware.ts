import { NextRequest, NextResponse } from 'next/server'
import { validateSession, needsRefresh, refreshGoogleToken, createResponseWithSession } from '@/lib/session'
import { checkCSRFProtection, checkOrigin } from '@/lib/csrf-protection'
import { applyEnvironmentHeaders } from '@/lib/security-headers'
import { locales, defaultLocale } from '@/lib/i18n'

// Protected routes that require authentication (including localized versions)
const protectedRoutes = [
  '/dashboard',
  '/chat'
]

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth', // Legacy auth route (redirect will be handled by Next.js)
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
  return publicRoutes.some(route => {
    // Для API маршрутов используем startsWith
    if (route.startsWith('/api/')) {
      return pathWithoutLocale.startsWith(route)
    }
    // Для auth маршрутов проверяем точное совпадение и вариант с callback
    if (route === '/auth') {
      return pathWithoutLocale === '/auth' || pathWithoutLocale.startsWith('/auth/')
    }
    // Для всех остальных - точное совпадение
    return pathWithoutLocale === route
  })
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

  // ИСПРАВЛЕНИЕ: Проверяем блокировку авторизации ПЕРЕД всеми остальными проверками
  // Это предотвращает бесконечные редиректы после logout
  const logoutFlag = request.cookies.get('logout_flag')?.value
  const isProtectedRoute = isProtectedPath(pathname)
  const isPublicRoute = isPublicPath(pathname)
  
  // Reduced debug logging to prevent console spam
  
  if (logoutFlag === 'true' && isProtectedRoute) {
    console.log('Middleware: Auth blocked by logout flag, redirecting to home page')
    const response = NextResponse.redirect(new URL('/', request.url))
    return applyEnvironmentHeaders(response)
  }

  // Apply CSRF protection to API routes (except auth callbacks and internal APIs)
  if (pathname.startsWith('/api/') && 
      !pathname.startsWith('/api/auth/google') && 
      !pathname.startsWith('/api/auth/callback') &&
      !pathname.startsWith('/api/auth/register') &&
      !pathname.startsWith('/api/auth/login') &&
      !pathname.startsWith('/api/auth/logout') &&
      !pathname.startsWith('/api/history') &&
      !pathname.startsWith('/api/analytics')) {
    
    // Check origin for additional security (skip for auth routes)
    if (!pathname.startsWith('/api/auth/') && !checkOrigin(request)) {
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
  // Удаляем дублирующиеся проверки - они уже выполнены выше
  
  // Get current session ТОЛЬКО если нет блокировки logout
  const session = await validateSession(request)
  
  // If no session and trying to access protected route, redirect to auth
  if (!session && isProtectedRoute) {
    const locale = getLocaleFromPath(pathname) || defaultLocale
    const authPath = locale === defaultLocale ? '/auth' : `/${locale}/auth`
    const response = NextResponse.redirect(new URL(authPath, request.url))
    return applyEnvironmentHeaders(response)
  }
  
  // If session exists and trying to access auth page, redirect to dashboard
  // Preserve locale in redirect
  // BUT allow forced login by checking for force_login parameter
  if (session && (pathname === '/auth' || pathname.match(/^\/[a-z]{2}\/auth$/))) {
    const url = new URL(request.url)
    const forceLogin = url.searchParams.get('force_login')
    
    if (!forceLogin) {
      const locale = getLocaleFromPath(pathname) || defaultLocale
      const dashboardPath = locale === defaultLocale ? '/dashboard' : `/${locale}/dashboard`
      const response = NextResponse.redirect(new URL(dashboardPath, request.url))
      return applyEnvironmentHeaders(response)
    }
    
    // If force_login=true, allow access to auth page even with existing session
  }
  
  // If session exists, check if token needs refresh or session needs extension
  if (session) {
    let updatedSession = session
    let needsUpdate = false

    // Check if token needs refresh
    if (needsRefresh(session)) {
      try {
        const newTokenData = await refreshGoogleToken(session.refreshToken)
        
        if (newTokenData) {
          updatedSession = {
            ...session,
            accessToken: newTokenData.accessToken,
            expiresAt: newTokenData.expiresAt
          }
          needsUpdate = true
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

    // ИСПРАВЛЕНИЕ: убираем автоматическое обновление сессии на каждом запросе
    // Это вызывало бесконечный цикл в middleware
    // Сессия будет обновляться только при необходимости (например, при рефреше токена)
    
    // Update session cookie if needed
    if (needsUpdate) {
      const response = NextResponse.next()
      const responseWithSession = await createResponseWithSession(response, updatedSession)
      return applyEnvironmentHeaders(responseWithSession)
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