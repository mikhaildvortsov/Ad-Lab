import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from "@/components/ui/toaster"
import { LocaleProvider } from '@/components/locale-provider'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ad Lab - Профессиональные инструменты для рекламных текстов',
  description: 'Превратите обычные рекламные скрипты в мощные продающие тексты с помощью профессиональных техник копирайтинга',
  generator: 'v0.dev',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <LocaleProvider>
          {children}
        </LocaleProvider>
        <Toaster />
      </body>
    </html>
  )
}
