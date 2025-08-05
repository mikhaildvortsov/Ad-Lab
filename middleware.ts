import { NextRequest, NextResponse } from 'next/server'
import { validateSession, needsRefresh, refreshGoogleToken, createResponseWithSession } from '@/lib/session'
import { checkCSRFProtection, checkOrigin } from '@/lib/csrf-protection'
import { applyEnvironmentHeaders } from '@/lib/security-headers'
import { locales, defaultLocale } from '@/lib/i18n'
const protectedRoutes = [
  '/dashboard',
  '/chat'
]
const publicRoutes = [
  '/',
  '/auth',
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
    if (route.startsWith('/api/')) {
      return pathWithoutLocale.startsWith(route)
    }
    if (route === '/auth') {
      return pathWithoutLocale === '/auth' || pathWithoutLocale.startsWith('/auth/')
    }
    return pathWithoutLocale === route
  })
}
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') ||
      pathname === '/api/csrf-token') {
    const response = NextResponse.next()
    return applyEnvironmentHeaders(response)
  }
  const logoutFlag = request.cookies.get('logout_flag')?.value
  const isProtectedRoute = isProtectedPath(pathname)
  const isPublicRoute = isPublicPath(pathname)
  if (logoutFlag === 'true' && isProtectedRoute) {
    console.log('Middleware: Auth blocked by logout flag, redirecting to home page')
    const response = NextResponse.redirect(new URL('/', request.url))
    return applyEnvironmentHeaders(response)
  }
  if (pathname.startsWith('/api/') && 
      !pathname.startsWith('/api/auth/google') && 
      !pathname.startsWith('/api/auth/register') &&
      !pathname.startsWith('/api/auth/login') &&
      !pathname.startsWith('/api/auth/logout') &&
      !pathname.startsWith('/api/history') &&
      !pathname.startsWith('/api/analytics')) {
    if (!pathname.startsWith('/api/auth/') && !checkOrigin(request)) {
      const response = NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      )
      return applyEnvironmentHeaders(response)
    }
    const session = await validateSession(request)
    const sessionId = session?.user?.id
    const csrfCheck = await checkCSRFProtection(request, sessionId)
    if (!csrfCheck.valid) {
      const response = NextResponse.json(
        { error: csrfCheck.error || 'CSRF validation failed' },
        { status: 403 }
      )
      return applyEnvironmentHeaders(response)
    }
  }
  const session = await validateSession(request)
  if (!session && isProtectedRoute) {
    const locale = getLocaleFromPath(pathname) || defaultLocale
    const authPath = locale === defaultLocale ? '/auth' : `/${locale}/auth`
    const response = NextResponse.redirect(new URL(authPath, request.url))
    return applyEnvironmentHeaders(response)
  }
  if (session && (pathname === '/auth' || pathname.match(/^\/[a-z]{2}\/auth$/))) {
    const url = new URL(request.url)
    const forceLogin = url.searchParams.get('force_login')
    if (!forceLogin) {
      const locale = getLocaleFromPath(pathname) || defaultLocale
      const dashboardPath = locale === defaultLocale ? '/dashboard' : `/${locale}/dashboard`
      const response = NextResponse.redirect(new URL(dashboardPath, request.url))
      return applyEnvironmentHeaders(response)
    }
  }
  if (session) {
    let updatedSession = session
    let needsUpdate = false
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
          const response = NextResponse.redirect(new URL('/auth', request.url))
          response.cookies.delete('session')
          return applyEnvironmentHeaders(response)
        }
      } catch (error) {
        console.error('Token refresh in middleware failed:', error)
        const response = NextResponse.redirect(new URL('/auth', request.url))
        response.cookies.delete('session')
        return applyEnvironmentHeaders(response)
      }
    }
    if (needsUpdate) {
      const response = NextResponse.next()
      const responseWithSession = await createResponseWithSession(response, updatedSession)
      return applyEnvironmentHeaders(responseWithSession)
    }
  }
  const response = NextResponse.next()
  return applyEnvironmentHeaders(response)
}
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
