"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sparkles, Zap, Target, TrendingUp, ArrowRight, User, LogOut, Check } from "lucide-react"
import { LanguageSelector } from "@/components/language-selector"
import { MobileNav } from "@/components/ui/mobile-nav"
import { useLocale } from "@/lib/use-locale"
import { useTranslation } from "@/lib/translations"
import type { Locale } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface User {
  id: string
  name: string
  email: string
  image?: string
}

interface Plan {
  id: string
  name: string
  price: number
  features: string[]
  improvements: number
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Базовый',
    price: 299,
    features: ['10 улучшений в месяц', 'История запросов', 'Базовая аналитика'],
    improvements: 10
  },
  {
    id: 'pro',
    name: 'Профессиональный',
    price: 599,
    features: ['50 улучшений в месяц', 'Расширенная аналитика', 'Приоритетная поддержка', 'Экспорт в PDF'],
    improvements: 50,
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Корпоративный',
    price: 1499,
    features: ['Неограниченные улучшения', 'API доступ', 'Персональный менеджер', 'Индивидуальные настройки'],
    improvements: -1
  }
]

function HomePageContent({ params }: { params: { locale: Locale } }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { user: authUser, loading } = useAuth();
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user')
      setIsAuthenticated(!!savedUser)
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (error) {
          localStorage.removeItem('user')
        }
      }
    }
    const authSuccess = searchParams.get('auth')
    const logoutParam = searchParams.get('logout')
    const userParam = searchParams.get('user')
    if (logoutParam === 'true') {
      setUser(null)
      setIsAuthenticated(false)
      localStorage.removeItem('user')
      router.replace('/', { scroll: false })
    } else if (authSuccess === 'success' && userParam) {
      try {
        const userData = JSON.parse(userParam)
        setUser(userData)
        setIsAuthenticated(true)
        localStorage.setItem('user', userParam)
        router.replace('/', { scroll: false })
      } catch (error) {}
    }
  }, [router, searchParams])

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('user')
    router.push('/api/auth/logout')
  }

  const handleTryClick = () => {
    if (isAuthenticated) {
      router.push('/pricing');
    } else {
      router.push('/auth');
    }
  };

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
                <Link href="/pricing">
                  <Button variant="ghost" size="sm">{t('header.pricing')}</Button>
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
          <Button
            size="lg"
            className="group text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl active:scale-95 focus:scale-105 focus:shadow-lg"
            onClick={handleTryClick}
          >
            {isAuthenticated ? 'Выбрать тариф' : t('hero.cta')}
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
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

      {/* Pricing Modal */}
      <Dialog open={false} onOpenChange={(open) => {
        console.log('Pricing modal onOpenChange:', open);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Выберите подходящий тариф</DialogTitle>
            <DialogDescription className="text-center text-base">
              Начните с бесплатного пробного периода и выберите план, который лучше всего подходит для ваших потребностей
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Популярный</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-xl sm:text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                    ₽{plan.price}
                    <span className="text-sm sm:text-base font-normal text-gray-500">/месяц</span>
                  </div>
                  <CardDescription className="text-sm sm:text-base">
                    {plan.improvements === -1 ? 'Неограниченные улучшения' : `${plan.improvements} улучшений в месяц`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm sm:text-base">
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full h-12 text-base ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  >
                    Выбрать план
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Additional Info */}
          <div className="mt-8 text-center">
            <div className="bg-gray-50 rounded-xl p-6 max-w-2xl mx-auto">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Что включено во все планы:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Профессиональные алгоритмы
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Безопасность данных
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Поддержка клиентов
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Регулярные обновления
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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