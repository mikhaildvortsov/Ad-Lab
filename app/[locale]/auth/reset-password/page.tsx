"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "@/lib/use-locale"
import type { Locale } from "@/lib/i18n"

export const dynamic = 'force-dynamic'

export default function ResetPasswordRedirectPage({ params }: { params: { locale: Locale } }) {
  const router = useRouter()
  const { locale } = useLocale()

  useEffect(() => {
    // Перенаправляем на новую страницу восстановления пароля
    router.replace(`/${locale}/auth?mode=reset`)
  }, [router, locale])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-gray-600">Перенаправление...</p>
      </div>
    </div>
  )
}