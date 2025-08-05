"use client"
import Link from 'next/link'
import { useLocale } from '@/lib/use-locale'
export const dynamic = 'force-dynamic'
export default function NotFound() {
  const { locale } = useLocale()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Страница не найдена</h2>
      <p className="text-gray-600 mb-8">Извините, запрашиваемая страница не существует.</p>
      <Link 
        href={`/${locale}`} 
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Вернуться на главную
      </Link>
    </div>
  )
}
