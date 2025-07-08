"use client"

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { locales, defaultLocale, type Locale } from './i18n'
import { getStoredLocale, setStoredLocale, getPreferredLocale } from './locale-storage'

export function useLocale() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const getLocaleFromPath = (path: string): Locale => {
    const segments = path.split('/').filter(Boolean)
    const pathLocale = segments[0]
    return locales.includes(pathLocale as Locale) ? (pathLocale as Locale) : defaultLocale
  }
  
  const removeLocaleFromPath = (path: string): string => {
    const segments = path.split('/').filter(Boolean)
    const firstSegment = segments[0]
    
    if (locales.includes(firstSegment as Locale)) {
      // Remove the locale segment
      const pathWithoutLocale = '/' + segments.slice(1).join('/')
      return pathWithoutLocale === '/' ? '/' : pathWithoutLocale
    }
    
    return path
  }
  
  const locale = getLocaleFromPath(pathname)

  // Auto-redirect to preferred locale only on initial load
  useEffect(() => {
    if (!mounted) return

    const currentLocale = getLocaleFromPath(pathname)
    const preferredLocale = getPreferredLocale()
    
    // Only redirect if we're on the root page without any locale
    if (pathname === '/') {
      if (preferredLocale !== defaultLocale) {
        router.replace(`/${preferredLocale}`)
        return
      }
    }
    
    // Save current locale as preference if it's different from stored
    const storedLocale = getStoredLocale()
    if (currentLocale !== storedLocale) {
      setStoredLocale(currentLocale)
    }
  }, [mounted, pathname, router])

  const changeLocale = useCallback(
    (newLocale: Locale) => {
      if (!mounted) return
      
      // Save the new locale preference
      setStoredLocale(newLocale)
      
      // Get the path without any locale
      const pathWithoutLocale = removeLocaleFromPath(pathname)
      
      // Build new path with the new locale
      let newPath: string
      if (newLocale === defaultLocale) {
        // For default locale, we might want to keep it simple
        newPath = pathWithoutLocale
      } else {
        newPath = `/${newLocale}${pathWithoutLocale}`
      }
      
      // Add search params if they exist
      const params = searchParams.toString()
      if (params) {
        newPath += `?${params}`
      }
      
      router.push(newPath)
    },
    [router, pathname, searchParams, mounted]
  )

  return {
    locale,
    changeLocale,
    mounted,
  }
} 