"use client"

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { locales, defaultLocale, type Locale } from './i18n'

export function useLocale() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const getLocaleFromPath = (path: string): Locale => {
    const segments = path.split('/')
    const pathLocale = segments[1]
    return locales.includes(pathLocale as Locale) ? (pathLocale as Locale) : defaultLocale
  }
  
  const locale = getLocaleFromPath(pathname)

  const changeLocale = useCallback(
    (newLocale: Locale) => {
      const currentLocale = getLocaleFromPath(pathname)
      let newPath = pathname
      
      if (locales.includes(currentLocale)) {
        newPath = pathname.replace(`/${currentLocale}`, '')
      }
      
      if (newLocale !== defaultLocale) {
        newPath = `/${newLocale}${newPath}`
      }
      
      const params = searchParams.toString()
      if (params) {
        newPath += `?${params}`
      }
      
      router.push(newPath)
    },
    [router, pathname, searchParams]
  )

  return {
    locale,
    changeLocale,
  }
} 