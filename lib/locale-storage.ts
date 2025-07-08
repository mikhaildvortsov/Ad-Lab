import { type Locale, defaultLocale, locales } from './i18n'

const LOCALE_STORAGE_KEY = 'preferred-locale'

export function getStoredLocale(): Locale | null {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored && locales.includes(stored as Locale)) {
      return stored as Locale
    }
  } catch (error) {
    // localStorage might not be available
    console.warn('Could not access localStorage:', error)
  }

  return null
}

export function setStoredLocale(locale: Locale): void {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch (error) {
    // localStorage might not be available
    console.warn('Could not save to localStorage:', error)
  }
}

export function getPreferredLocale(): Locale {
  // First check stored preference
  const stored = getStoredLocale()
  if (stored) {
    return stored
  }

  // Then check browser language
  if (typeof window !== 'undefined' && navigator.language) {
    const browserLang = navigator.language.split('-')[0] as Locale
    if (locales.includes(browserLang)) {
      return browserLang
    }
  }

  // Fallback to default
  return defaultLocale
} 