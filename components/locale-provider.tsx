"use client"
import { useEffect } from 'react'
import { useLocale } from '@/lib/use-locale'
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale()
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  return <>{children}</>
}
