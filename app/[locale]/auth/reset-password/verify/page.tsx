"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Shield } from "lucide-react"
import { useLocale } from "@/lib/use-locale"
import { useTranslation } from "@/lib/translations"
import type { Locale } from "@/lib/i18n"

export const dynamic = 'force-dynamic'

export default function VerifyCodePage({ params }: { params: { locale: Locale } }) {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  
  const email = searchParams.get('email') || ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) {
      return
    }
    
    setIsLoading(true)
    setError("")

    // Валидация
    if (!email) {
      setError('Email не найден. Пожалуйста, начните процесс заново.')
      setIsLoading(false)
      return
    }

    if (code.length !== 6) {
      setError('Код должен содержать 6 цифр')
      setIsLoading(false)
      return
    }

    try {
      // Проверяем только код
      const response = await fetch('/api/auth/reset-password/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          code
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Переходим на страницу смены пароля с email и кодом
        router.push(`/${locale}/auth/reset-password/new-password?email=${encodeURIComponent(email)}&code=${code}`)
      } else {
        setError(data.error || 'Неверный код')
      }
    } catch (error) {
      console.error('Code verification error:', error)
      setError('Произошла ошибка при проверке кода')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm sm:max-w-md">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{t('header.brand')}</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl">
            Введите код
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Мы отправили 6-значный код на<br/>
            <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="code" className="text-sm sm:text-base text-center block">Код из email</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="pl-12 h-14 text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 text-center">Введите 6-значный код из письма</p>
            </div>

            {error && (
              <div className="text-sm p-3 rounded-lg border text-red-600 bg-red-50 border-red-200 text-center">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-base" 
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? 'Проверка...' : 'Проверить код'}
            </Button>
          </form>

          <div className="text-center pt-4 space-y-2">
            <p className="text-sm text-gray-600">
              Не получили код?
            </p>
            <Link href={`/${locale}/auth?mode=reset`} className="text-sm text-blue-600 hover:text-blue-800 transition-colors inline-block px-2 py-1 rounded hover:bg-blue-50">
              Отправить новый код
            </Link>
          </div>

          <div className="text-center pt-2">
            <Link href={`/${locale}/auth`} className="text-sm text-gray-600 hover:text-gray-800 transition-colors inline-block px-2 py-1 rounded hover:bg-gray-50">
              {t('auth.backToLogin')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
