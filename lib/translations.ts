import type { Locale } from './i18n'
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
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param]?.toString() || match
    })
  }
  return value
}

export function getTranslationArray(locale: Locale, key: string): string[] {
  const keys = key.split('.')
  let value: any = translations[locale] || translations.ru
  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) {
      value = translations.ru
      for (const fallbackKey of keys) {
        value = value?.[fallbackKey]
      }
      break
    }
  }
  if (Array.isArray(value)) {
    return value
  }
  return []
}

export function useTranslation(locale: Locale) {
  return {
    t: (key: string, params?: Record<string, string | number>) => getTranslation(locale, key, params),
    tArray: (key: string) => getTranslationArray(locale, key),
  }
}
