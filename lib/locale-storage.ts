import { type Locale, defaultLocale, locales } from './i18n'
const LOCALE_STORAGE_KEY = 'preferred-locale'
export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored && locales.includes(stored as Locale)) {
      return stored as Locale
    }
  } catch (error) {
    console.warn('Could not access localStorage:', error)
  }
  return null
}
export function setStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch (error) {
    console.warn('Could not save to localStorage:', error)
  }
}
export function getPreferredLocale(): Locale {
  const stored = getStoredLocale()
  if (stored) {
    return stored
  }
  if (typeof window !== 'undefined' && navigator.language) {
    const browserLang = navigator.language.split('-')[0] as Locale
    if (locales.includes(browserLang)) {
      return browserLang
    }
  }
  return defaultLocale
}
