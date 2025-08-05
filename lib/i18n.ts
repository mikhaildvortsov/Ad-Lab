export type Locale = 'ru' | 'en'
export const locales: Locale[] = ['ru', 'en']
export const defaultLocale: Locale = 'ru'
export const localeNames: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
}
export const localeFlags: Record<Locale, string> = {
  ru: '🇷🇺',
  en: '🇺🇸',
}
export function getLocaleFromPath(path: string): Locale {
  const segments = path.split('/')
  const pathLocale = segments[1]
  return locales.includes(pathLocale as Locale) ? (pathLocale as Locale) : defaultLocale
}
