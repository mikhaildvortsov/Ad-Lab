import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from '@/lib/i18n'

// Упрощенная версия middleware для тестирования
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Пропускаем статические файлы и API роуты
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Базовая локализация
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  const isLocale = locales.includes(firstSegment as any)
  
  // Если путь не содержит локаль, добавляем дефолтную
  if (!isLocale && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = `/${defaultLocale}${pathname}`
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
