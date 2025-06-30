"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles, Zap, Target, TrendingUp, ArrowRight, User, LogOut } from "lucide-react"
import { LanguageSelector } from "@/components/language-selector"
import { MobileNav } from "@/components/ui/mobile-nav"
import { useLocale } from "@/lib/use-locale"
import { useTranslation } from "@/lib/translations"
import type { Locale } from "@/lib/i18n"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface User {
  id: string
  name: string
  email: string
  image?: string
}

function HomePageContent({ params }: { params: { locale: Locale } }) {
  const [user, setUser] = useState<User | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  
  useEffect(() => {
    // Проверяем localStorage при загрузке
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        localStorage.removeItem('user')
      }
    }

    // Обрабатываем параметры URL для авторизации
    const authSuccess = searchParams.get('auth')
    const logoutParam = searchParams.get('logout')
    const userParam = searchParams.get('user')

    if (logoutParam === 'true') {
      setUser(null)
      localStorage.removeItem('user')
      // Очищаем URL
      router.replace('/', { scroll: false })
    } else if (authSuccess === 'success' && userParam) {
      try {
        const userData = JSON.parse(userParam)
        setUser(userData)
        localStorage.setItem('user', userParam)
        // Очищаем URL
        router.replace('/', { scroll: false })
      } catch (error) {
        console.error('Error parsing user data from URL:', error)
      }
    }
  }, [router, searchParams])

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
    router.push('/api/auth/logout')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <span className="text-lg sm:text-xl font-bold text-gray-900">{t('header.brand')}</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSelector />
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-2">
                  {user.image ? (
                    <img 
                      src={user.image} 
                      alt={user.name} 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="h-8 w-8 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                </div>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">{t('header.dashboard')}</Button>
                </Link>
                <Button variant="outline" onClick={handleLogout} size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{t('header.logout')}</span>
                </Button>
              </div>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" size="sm">{t('header.login')}</Button>
                </Link>
                <Link href="/auth">
                  <Button size="sm">{t('header.register')}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSelector />
            <MobileNav user={user} onLogout={handleLogout} t={t} />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              {t('hero.title')}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {t('hero.titleHighlight')}
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              {t('hero.subtitle')}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 px-4">
            <div className="flex flex-col items-center p-4 sm:p-6 bg-white rounded-xl shadow-sm border">
              <Target className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mb-3 sm:mb-4" />
              <h3 className="font-semibold text-base sm:text-lg mb-2">{t('features.target.title')}</h3>
              <p className="text-gray-600 text-sm text-center">{t('features.target.description')}</p>
            </div>
            <div className="flex flex-col items-center p-4 sm:p-6 bg-white rounded-xl shadow-sm border">
              <Zap className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600 mb-3 sm:mb-4" />
              <h3 className="font-semibold text-base sm:text-lg mb-2">{t('features.speed.title')}</h3>
              <p className="text-gray-600 text-sm text-center">{t('features.speed.description')}</p>
            </div>
            <div className="flex flex-col items-center p-4 sm:p-6 bg-white rounded-xl shadow-sm border sm:col-span-2 lg:col-span-1">
              <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 mb-3 sm:mb-4" />
              <h3 className="font-semibold text-base sm:text-lg mb-2">{t('features.conversion.title')}</h3>
              <p className="text-gray-600 text-sm text-center">{t('features.conversion.description')}</p>
            </div>
          </div>

          {/* CTA */}
          <Link href="/auth">
            <Button
              size="lg"
              className="group text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl active:scale-95 focus:scale-105 focus:shadow-lg"
            >
              {t('hero.cta')}
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-base sm:text-lg font-semibold">{t('header.brand')}</span>
          </div>
          <p className="text-sm sm:text-base text-gray-400">{t('footer.copyright')}</p>
        </div>
      </footer>
    </div>
  )
}

export default function HomePage({ params }: { params: { locale: Locale } }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    }>
      <HomePageContent params={params} />
    </Suspense>
  )
} 