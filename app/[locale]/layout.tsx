import type { Metadata } from 'next'
import '../globals.css'
import { locales, type Locale } from '@/lib/i18n'

export async function generateStaticParams() {
  return locales.map((locale: Locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: 'Ad Lab - Профессиональные инструменты для рекламных текстов',
  description: 'Превратите обычные рекламные скрипты в мощные продающие тексты с помощью профессиональных техник копирайтинга',
  generator: 'v0.dev',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  
  return <>{children}</>
} 