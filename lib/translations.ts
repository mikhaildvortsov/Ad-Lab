import type { Locale } from './i18n'

// Import translations
import ruTranslations from '../locales/ru.json'
import enTranslations from '../locales/en.json'

const translations = {
  ru: ruTranslations,
  en: enTranslations,
}

export type TranslationKey = keyof typeof ruTranslations

export function getTranslation(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.')
  let value: any = translations[locale] || translations.ru

  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) {
      // Fallback to Russian if translation not found
      value = translations.ru
      for (const fallbackKey of keys) {
        value = value?.[fallbackKey]
      }
      break
    }
  }

  if (typeof value !== 'string') {
    return key
  }

  // Replace parameters
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param]?.toString() || match
    })
  }

  return value
}

export function useTranslation(locale: Locale) {
  return {
    t: (key: string, params?: Record<string, string | number>) => getTranslation(locale, key, params),
  }
} 