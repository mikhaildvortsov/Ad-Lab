"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Lock, Eye, EyeOff, Check, X } from "lucide-react"
import { useLocale } from "@/lib/use-locale"
import { useTranslation } from "@/lib/translations"
import type { Locale } from "@/lib/i18n"

// Функция для оценки сложности пароля
const getPasswordStrength = (password: string) => {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  Object.values(checks).forEach(check => {
    if (check) score++;
  });

  if (password.length >= 12) score += 1;

  return {
    score,
    level: score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong',
    checks
  };
};

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage({ params }: { params: { locale: Locale } }) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState<boolean | null>(null)
  const [passwordStrength, setPasswordStrength] = useState(getPasswordStrength(""))
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  
  const token = searchParams.get('token')

  useEffect(() => {
    const validateToken = async () => {
      // Проверяем наличие токена
      if (!token) {
        setValidToken(false)
        setError(t('auth.errors.invalidResetToken'))
        return
      }

      try {
        // Проверяем валидность токена через API
        const response = await fetch('/api/auth/reset-password/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (data.success) {
          setValidToken(true)
        } else {
          setValidToken(false)
          setError(data.error || t('auth.errors.invalidResetToken'))
        }
      } catch (error) {
        console.error('Token validation error:', error)
        setValidToken(false)
        setError(t('auth.errors.invalidResetToken'))
      }
    }

    validateToken()
  }, [token, t])

  // Обработчик изменения пароля
  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword)
    setPasswordStrength(getPasswordStrength(newPassword))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Предотвращаем повторную отправку, если форма уже обрабатывается
    if (isLoading) {
      return
    }
    
    setIsLoading(true)
    setError("")

    // Валидация паролей
    if (passwordStrength.score < 3) {
      setError('Пароль слишком простой. Используйте более сложный пароль.')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'))
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          password,
          locale 
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setError('')
        // Перенаправляем на страницу входа через 3 секунды
        setTimeout(() => {
          router.push(`/${locale}/auth?mode=login`)
        }, 3000)
      } else {
        // Проверяем специфичные ошибки токена
        if (data.error === 'Reset token has already been used') {
          setError('Эта ссылка для сброса пароля уже была использована. Запросите новую ссылку, если нужно изменить пароль снова.')
        } else if (data.error === 'Reset token has expired') {
          setError('Срок действия ссылки для сброса пароля истек. Запросите новую ссылку.')
        } else {
          setError(data.error || t('auth.errors.passwordResetFailed'))
        }
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setError(t('auth.errors.passwordResetFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  if (validToken === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm sm:max-w-md">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <span className="text-xl sm:text-2xl font-bold text-gray-900">{t('header.brand')}</span>
            </div>
            <CardTitle className="text-xl sm:text-2xl text-red-600">
              Ошибка
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">
                  {error}
                </p>
              </div>
              <Link href={`/${locale}/auth`}>
                <Button variant="outline" className="w-full">
                  {t('auth.backToLogin')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
            {t('auth.resetPasswordPageTitle')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Введите новый пароль для вашего аккаунта
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
          {success ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">
                  {t('auth.passwordResetSuccess')}
                </p>
                <p className="text-green-600 text-xs mt-2">
                  Перенаправление через 3 секунды...
                </p>
              </div>
              <Link href={`/${locale}/auth?mode=login`}>
                <Button className="w-full">
                  {t('auth.backToLogin')}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base">{t('auth.newPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('auth.newPasswordPlaceholder')}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="pl-10 pr-10 h-11 sm:h-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Индикатор сложности пароля */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Сложность:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            passwordStrength.level === 'weak' ? 'bg-red-500 w-1/3' :
                            passwordStrength.level === 'medium' ? 'bg-yellow-500 w-2/3' :
                            'bg-green-500 w-full'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.level === 'weak' ? 'text-red-600' :
                        passwordStrength.level === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {passwordStrength.level === 'weak' ? 'Слабый' :
                         passwordStrength.level === 'medium' ? 'Средний' : 'Сильный'}
                      </span>
                    </div>
                    
                    {/* Требования к паролю */}
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      <div className={`flex items-center gap-1 ${passwordStrength.checks.length ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordStrength.checks.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>Минимум 8 символов</span>
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordStrength.checks.lowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>Строчные буквы (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordStrength.checks.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>Заглавные буквы (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.checks.number ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordStrength.checks.number ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>Цифры (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.checks.special ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordStrength.checks.special ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>Специальные символы (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm sm:text-base">{t('auth.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-11 sm:h-12"
                    required
                  />
                </div>
                {/* Индикатор совпадения паролей */}
                {confirmPassword && (
                  <div className={`flex items-center gap-1 text-xs ${
                    password === confirmPassword ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {password === confirmPassword ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>
                      {password === confirmPassword ? 'Пароли совпадают' : 'Пароли не совпадают'}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-sm p-3 rounded-lg border text-red-600 bg-red-50 border-red-200">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 sm:h-12" 
                disabled={isLoading}
              >
                <span className="text-sm sm:text-base">
                  {isLoading ? t('auth.loading') : t('auth.setNewPassword')}
                </span>
              </Button>
            </form>
          )}

          <div className="text-center pt-3">
            <Link href={`/${locale}/auth`} className="text-sm text-gray-600 hover:text-gray-800 transition-colors inline-block px-2 py-1 rounded hover:bg-gray-50">
              {t('auth.backToLogin')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}