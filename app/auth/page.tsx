"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getClientSession } from "@/lib/client-session"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login: googleLogin, updateUser } = useAuth()
  
  useEffect(() => {
    // Проверяем параметры URL для обработки ошибок авторизации
    const authError = searchParams.get('error')
    if (authError === 'google_auth_failed') {
      setError('Ошибка авторизации через Google. Попробуйте еще раз.')
    } else if (authError === 'oauth_not_configured') {
      setError('OAuth не настроен. Обратитесь к администратору.')
    } else if (authError === 'invalid_user_data') {
      setError('Ошибка обработки данных пользователя.')
    } else if (authError === 'no_user_data') {
      setError('Не удалось получить данные пользователя.')
    } else if (authError === 'redirect_uri_mismatch') {
      setError('Ошибка настройки OAuth. Проверьте redirect URI в Google Console.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, isRegistration: !isLogin }),
      })

      const data = await response.json()

      if (data.success) {
        // Получаем сессию из cookies (она была создана API роутом)
        const session = await getClientSession()
        if (session) {
          // Обновляем AuthContext с новыми данными пользователя
          updateUser(session.user)
          console.log('Email auth: updated AuthContext with user:', session.user)
          
          // Перенаправляем на dashboard
          router.push('/dashboard')
        } else {
          setError('Не удалось получить данные сессии')
        }
      } else {
        setError(data.error || 'Ошибка авторизации')
      }
    } catch (error) {
      console.error('Email auth error:', error)
      setError("Произошла ошибка при авторизации")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = () => {
    setIsLoading(true)
    googleLogin()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm sm:max-w-md">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <span className="text-xl sm:text-2xl font-bold text-gray-900">Ad Lab</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl">
            {isLogin ? "Войти в аккаунт" : "Создать аккаунт"}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {isLogin 
              ? "Войдите в свой аккаунт для доступа к аналитике"
              : "Создайте аккаунт для начала работы"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
          {/* Google Auth Button */}
          <Button 
            onClick={handleGoogleAuth}
            disabled={isLoading}
            variant="outline" 
            className="w-full h-11 sm:h-12"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm sm:text-base">
              {isLoading ? "Загрузка..." : "Продолжить с Google"}
            </span>
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Или
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 sm:h-12"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base">Пароль</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 sm:h-12" 
              disabled={isLoading}
            >
              <span className="text-sm sm:text-base">
                {isLoading ? "Загрузка..." : (isLogin ? "Войти" : "Создать аккаунт")}
              </span>
            </Button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isLogin 
                ? "Нет аккаунта? Создать" 
                : "Уже есть аккаунт? Войти"
              }
            </button>
          </div>

          <div className="text-center pt-2">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
              ← Вернуться на главную
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
