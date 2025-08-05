"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Sparkles, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getClientSession } from "@/lib/client-session"
import { useLocale } from "@/lib/use-locale"
import { useTranslation } from "@/lib/translations"
import type { Locale } from "@/lib/i18n"
export const dynamic = 'force-dynamic'
export default function AuthPage({ params }: { params: { locale: Locale } }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [userExists, setUserExists] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login: googleLogin, updateUser } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'register') {
      setIsLogin(false)
    } else if (mode === 'login') {
      setIsLogin(true)
    }
    const authError = searchParams.get('error')
    if (authError === 'google_auth_failed') {
      setError(t('auth.errors.googleAuthFailed'))
    } else if (authError === 'oauth_not_configured') {
      setError(t('auth.errors.oauthNotConfigured'))
    } else if (authError === 'invalid_user_data') {
      setError(t('auth.errors.invalidUserData'))
    } else if (authError === 'no_user_data') {
      setError(t('auth.errors.noUserData'))
    } else if (authError === 'redirect_uri_mismatch') {
      setError(t('auth.errors.redirectUriMismatch'))
    }
  }, [searchParams, t])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setUserExists(false)
    if (!isLogin && !privacyConsent) {
      setError(t('auth.errors.privacyRequired'))
      setUserExists(false)
      setIsLoading(false)
      return
    }
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const requestBody = isLogin 
        ? { email, password }
        : { email, password, name }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      const data = await response.json()
      if (data.success) {
        if (isLogin) {
          const session = await getClientSession()
          if (session) {
            updateUser(session.user)
            console.log('Email auth: updated AuthContext with user:', session.user)
            router.push(`/${locale}/dashboard`)
          } else {
            setError(t('auth.errors.sessionError'))
            setUserExists(false)
          }
        } else {
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.removeItem('logout_in_progress')
              window.localStorage.removeItem('last_logout_time')
              window.localStorage.removeItem('emergency_logout')
              document.cookie = 'logout_flag=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
              console.log('Registration: cleared all auth blocking flags')
            } catch (e) {
              console.warn('Could not clear auth flags:', e)
            }
          }
          await new Promise(resolve => setTimeout(resolve, 500))
          const session = await getClientSession()
          console.log('Registration: getClientSession result:', session)
          if (session) {
            updateUser(session.user)
            console.log('Registration: automatically logged in user:', session.user)
            console.log('Registration: redirecting to dashboard...')
            router.push(`/${locale}/dashboard`)
          } else {
            console.error('Registration: Failed to get session after clearing auth flags')
            setError(t('auth.errors.registrationSuccess'))
            setUserExists(false)
          }
        }
      } else {
        if (!isLogin && data.errorCode === 'USER_EXISTS') {
          setUserExists(true)
          setError(data.error)
        } else {
          setUserExists(false)
          setError(data.error || t('auth.errors.authError'))
        }
      }
    } catch (error) {
      console.error('Email auth error:', error)
      setError(t('auth.errors.networkError'))
      setUserExists(false)
    } finally {
      setIsLoading(false)
    }
  }
  const handleGoogleAuth = () => {
    setIsLoading(true)
    setError('')
    window.location.href = '/api/auth/google'
  }
  const switchToLogin = () => {
    setIsLogin(true)
    setError('')
    setPassword('')
    setName('')
    setPrivacyConsent(false)
    setUserExists(false)
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
            {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
          {}
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
              {isLoading ? t('auth.loading') : t('auth.continueWithGoogle')}
            </span>
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('auth.or')}
              </span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base">{t('auth.name')}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('auth.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 sm:h-12"
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 sm:h-12"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base">{t('auth.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth.passwordPlaceholder')}
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
              {!isLogin && (
                <p className="text-xs text-gray-500">
                  {t('auth.passwordRequirements')}
                </p>
              )}
            </div>
            {!isLogin && (
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border">
                <Checkbox 
                  id="privacy-consent" 
                  checked={privacyConsent}
                  onCheckedChange={(checked) => setPrivacyConsent(checked as boolean)}
                  className="mt-1 h-5 w-5 border-2 border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="privacy-consent" className="text-sm text-gray-700 leading-5 cursor-pointer">
                  {t('auth.privacyConsent')}{" "}
                  <Link 
                    href={`/${locale}/privacy`}
                    className="text-blue-600 hover:text-blue-800 underline"
                    target="_blank"
                  >
                    {t('auth.privacyPolicy')}
                  </Link>
                  {" "}{t('auth.privacyConsentText')}
                </Label>
              </div>
            )}
            {error && (
              <div className={`text-sm p-3 rounded-lg border ${
                userExists ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-red-600 bg-red-50 border-red-200'
              }`}>
                <div className="mb-2">{error}</div>
                {userExists && (
                  <button
                    onClick={switchToLogin}
                    className="text-blue-700 hover:text-blue-900 font-medium underline"
                  >
                    {t('auth.userExistsPrompt')}
                  </button>
                )}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full h-11 sm:h-12" 
              disabled={isLoading}
            >
              <span className="text-sm sm:text-base">
                {isLoading ? t('auth.loading') : (isLogin ? t('auth.loginButton') : t('auth.registerButton'))}
              </span>
            </Button>
          </form>
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setPassword('')
                setName('')
                setPrivacyConsent(false)
                setUserExists(false)
                if (isLogin) {
                  setEmail('')
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isLogin ? t('auth.switchToRegister') : t('auth.switchToLogin')}
            </button>
          </div>
          <div className="text-center pt-2">
            <Link href={`/${locale}`} className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
              {t('auth.backToHome')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
