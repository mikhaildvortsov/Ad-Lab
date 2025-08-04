"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sparkles, Zap, Target, TrendingUp, ArrowRight, User, LogOut, Check, Wand2, Building2, ShoppingCart, GraduationCap, Heart, Loader2, LucideAccessibility } from "lucide-react"
import { LanguageSelector } from "@/components/language-selector"
import { MobileNav } from "@/components/ui/mobile-nav"
import { useLocale } from "@/lib/use-locale"
import { useTranslation } from "@/lib/translations"
import type { Locale } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import { ChatInterface } from '@/components/chat-interface'
import { NicheSelector } from "@/components/niche-selector"
import { PaywallModal } from "@/components/paywall-modal"
import { TextValidator } from '@/components/text-validator'

import { getAvailableNiches, getAvailableNichesWithTranslation, type NicheType } from '@/lib/ai-instructions'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface Plan {
  id: string
  name: string
  price: number
  originalPrice?: number
  features: string[]
  improvements: number
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: 'week',
    name: 'Неделя',
    price: 1990,
    features: ['Полный доступ на 7 дней', 'Неограниченные улучшения', 'Все функции приложения', 'Поддержка 24/7'],
    improvements: -1
  },
  {
    id: 'month',
    name: 'Месяц',
    price: 2990,
    originalPrice: 6990,
    features: ['Полный доступ на 30 дней', 'Неограниченные улучшения', 'Все функции приложения', 'Приоритетная поддержка', 'Экономия 57%'],
    improvements: -1,
    popular: true
  },
  {
    id: 'quarter',
    name: 'Три месяца',
    price: 9990,
    features: ['Полный доступ на 90 дней', 'Неограниченные улучшения', 'Все функции приложения', 'VIP поддержка', 'Максимальная экономия'],
    improvements: -1
  }
]

const nicheIcons = {
  ecommerce: ShoppingCart,
  saas: Building2,
  infoproducts: GraduationCap,
  b2b: Building2,
  local_business: Building2,
  healthcare: Heart,
  education: GraduationCap,
  finance: Building2,
  real_estate: Building2,
  consulting: Building2
};

function HomePageContent({ params }: { params: { locale: Locale } }) {
  const [improvementModalOpen, setImprovementModalOpen] = useState(false)
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [initialText, setInitialText] = useState("")
  const [goalText, setGoalText] = useState("")
  const [improvedText, setImprovedText] = useState("")
  const [reformulatedGoal, setReformulatedGoal] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isProcessingGoal, setIsProcessingGoal] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const { user, loading, logout } = useAuth();
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const [chatOpen, setChatOpen] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Hydration-safe client detection
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Get CSRF token when user is authenticated
  useEffect(() => {
    if (user && !csrfToken) {
      const fetchCsrfToken = async () => {
        try {
          const response = await fetch('/api/csrf-token');
          if (response.ok) {
            const data = await response.json();
            setCsrfToken(data.csrfToken);
          }
        } catch (error) {
          console.error('Failed to get CSRF token:', error);
        }
      };
      fetchCsrfToken();
    }
  }, [user, csrfToken]);

  // Проверка подписки с учетом тестового режима
  const hasActiveSubscription = () => {
    // В тестовом режиме всегда возвращаем true (подписка активна)
    if (process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
      return true;
    }
    
    // В реальном приложении здесь будет проверка через API
    // Пока что считаем, что у пользователя нет активной подписки
    return false;
  };

  const handleLogout = async () => {
    try {
      await logout()
      // Остаемся на главной странице, так как мы уже здесь
      // Состояние обновится автоматически через AuthContext
    } catch (error) {
      console.error('Logout error:', error)
      // Даже при ошибке состояние обновится через AuthContext
    }
  };
  
  const handleTryClick = () => {
    if (!isClient || !user) {
      // Если клиент не готов или пользователь не авторизован - перенаправляем на авторизацию
      router.push('/auth');
    } else if (!hasActiveSubscription()) {
      // Если авторизован, но нет подписки - показываем paywall
      setShowPaywall(true);
    } else {
      // Если авторизован и есть подписка - открываем чат
      setChatOpen(true);
    }
  };

  const handleImproveText = async () => {
    if (!initialText.trim() || initialText.length < 20) {
      return;
    }

    setIsProcessing(true);
    
    try {
      // Check if we have CSRF token
      if (!csrfToken) {
        console.error('No CSRF token available');
        return;
      }

      // Сначала анализируем конверсионность, затем улучшаем
      const analysisResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ 
          message: `Проанализируй конверсионные элементы этого текста и предложи улучшения: ${initialText}`,
          instructionType: 'conversion_analysis',
          locale: locale,
          sessionId: sessionId
        }),
      });

      const analysisData = await analysisResponse.json();
      
      if (!analysisResponse.ok) {
        throw new Error(analysisData.error || 'Ошибка анализа');
      }

      // Затем улучшаем текст с учетом анализа
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: `На основе анализа конверсии улучши этот рекламный текст, добавив боли, преимущества и сильные CTA: ${initialText}
          
Анализ конверсии: ${analysisData.response}`,
          instructionType: 'copywriting',
          locale: locale,
          sessionId: sessionId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setImprovedText(data.response);
        setImprovementModalOpen(false);
        
        // Показываем paywall после получения улучшенного текста (если не тестовый режим)
        if (process.env.NEXT_PUBLIC_TEST_MODE !== 'true') {
          setTimeout(() => {
            setShowPaywall(true);
          }, 1000);
        }
      } else {
        console.error('Error improving text:', data.error);
        // Можно показать уведомление об ошибке
      }
    } catch (error) {
      console.error('Error improving text:', error);
      // Можно показать уведомление об ошибке
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoalReformulation = async () => {
    if (!goalText.trim() || goalText.length < 10) {
      return;
    }

    setIsProcessingGoal(true);
    
    try {
      // Check if we have CSRF token
      if (!csrfToken) {
        console.error('No CSRF token available');
        return;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ 
          message: locale === 'en' 
            ? `Reformulate this business goal using the SMART-PAIN-GAIN framework: ${goalText}`
            : `Переформулируй эту бизнес-цель по фреймворку SMART-PAIN-GAIN: ${goalText}`,
          instructionType: 'goal_reformulation',
          locale: locale,
          sessionId: sessionId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setReformulatedGoal(data.response);
        setGoalModalOpen(false);
        
        // Показываем paywall после получения переформулированной цели (если не тестовый режим)
        if (process.env.NEXT_PUBLIC_TEST_MODE !== 'true') {
          setTimeout(() => {
            setShowPaywall(true);
          }, 1000);
        }
      } else {
        console.error('Error reformulating goal:', data.error);
      }
    } catch (error) {
      console.error('Error reformulating goal:', error);
    } finally {
      setIsProcessingGoal(false);
    }
  };

  const handlePaymentSuccess = () => {
    // После успешной оплаты закрываем paywall и открываем чат
    setShowPaywall(false);
    
    // В реальном приложении здесь бы обновился статус подписки
    // После оплаты открываем чат для создания текста
    setChatOpen(true);
  };

  // Show loading only on client side to prevent hydration mismatch
  if (isClient && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
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
            {isClient && user ? (
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
                <Link href={`/${locale}/dashboard`}>
                  <Button variant="ghost" size="sm">{t('dashboardBtn')}</Button>
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
            <MobileNav user={isClient ? user : null} onLogout={handleLogout} t={t} />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8">
            {t('hero.title')}{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('hero.titleHighlight')}
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>

          {/* ДКЦП Marketing Framework Section */}
          <div className="bg-white rounded-2xl shadow-lg border p-6 sm:p-8 mb-8 sm:mb-12 max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                {t('dkcpMarketing.title')}
              </h2>
              <p className="text-gray-600 text-base sm:text-lg">
                {t('dkcpMarketing.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Что это такое */}
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                  {t('dkcpMarketing.whatIs.title')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('dkcpMarketing.whatIs.description')}
                </p>
              </div>

              {/* Пункты анализа */}
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                  {t('dkcpMarketing.analysis.title')}
                </h3>
                <ul className="text-gray-600 text-sm space-y-1 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    {locale === 'en' ? 'Activity - basic needs' : 'Деятельность - базовые потребности'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    {locale === 'en' ? 'Jobs - specific customer goals' : 'Задачи - конкретные цели клиентов'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    {locale === 'en' ? 'Forces - push/pull factors' : 'Силы - push/pull факторы'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    {locale === 'en' ? 'KMC - key contradictions' : 'Конфликты - ключевые противоречия'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    {locale === 'en' ? 'Selection - priority issues' : 'Выбор - приоритетные проблемы'}
                  </li>
                </ul>
              </div>

              {/* Как помогает */}
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                  {t('dkcpMarketing.howHelps.title')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('dkcpMarketing.howHelps.description')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              className="group text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl active:scale-95 focus:scale-105 focus:shadow-lg"
              onClick={handleTryClick}
            >
              {isClient && user ? t('upgrade') : t('hero.cta')}
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              className="group text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transform transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl active:scale-95 focus:scale-105 focus:shadow-lg"
              onClick={() => setGoalModalOpen(true)}
            >
              <Target className="mr-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:scale-110" />
              {t('goalReformulation.buttonText')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

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


      </section>

      {/* Niche Customization Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('niche.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('niche.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {getAvailableNichesWithTranslation(t).slice(0, 6).map((niche) => {
            const IconComponent = nicheIcons[niche.value as keyof typeof nicheIcons] || Building2;
            return (
              <Card key={niche.value} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <IconComponent className="h-8 w-8 text-blue-600" />
                    <h3 className="font-semibold text-lg">{niche.label}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {t('niche.recommendationsFor')} {niche.label.toLowerCase()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>


      </section>



      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-base sm:text-lg font-semibold">{t('header.brand')}</span>
          </div>
          <div className="space-y-2">
            <Link 
              href={`/${locale}/privacy`} 
              className="text-sm text-gray-400 hover:text-white underline transition-colors"
            >
              {t('privacy.title')}
            </Link>
            <p className="text-sm sm:text-base text-gray-400">{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>

              <ChatInterface 
          open={chatOpen} 
          onOpenChange={setChatOpen}
        />

      {/* Script Improvement Modal */}
      <Dialog open={improvementModalOpen} onOpenChange={setImprovementModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">{t('scriptImprover.title')}</DialogTitle>
            <DialogDescription className="text-center text-base">
              {t('scriptImprover.description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="script-text" className="text-sm font-medium">
                {t('scriptImprover.label')}
              </Label>
              <Textarea
                id="script-text"
                value={initialText}
                onChange={(e) => setInitialText(e.target.value)}
                placeholder={t('scriptImprover.placeholder')}
                className="min-h-[200px] mt-2"
                disabled={isProcessing}
              />
              {/* Замена простой валидации на TextValidator */}
              <TextValidator 
                text={initialText}
                textType="script"
                showRecommendations={true}
                className="mt-3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-blue-900 mb-4">🚀 Что включает улучшение:</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600" />
                      Анализ конверсионных элементов (PAS-CTA-TRUST)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600" />
                      Усиление болей и преимуществ
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600" />
                      Мощные призывы к действию (CTA)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600" />
                      Эмоциональные триггеры и доверие
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600" />
                      Оценка конверсионности (1-10 баллов)
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Пример улучшения</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Было:</p>
                      <p className="text-sm bg-red-50 p-2 rounded border border-red-200">
                        "Купите наш продукт. Он хороший и недорогой."
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Стало:</p>
                      <p className="text-sm bg-green-50 p-2 rounded border border-green-200">
                        "Откройте секрет экономии 40% семейного бюджета! Наше решение уже помогло 10,000+ семей..."
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleImproveText}
                disabled={initialText.length < 20 || isProcessing}
                className="flex-1"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('scriptImprover.processing')}
                  </>
                ) : (
                  t('scriptImprover.improveButton')
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setImprovementModalOpen(false)}
                disabled={isProcessing}
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goal Reformulation Modal */}
      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">{t('goalReformulation.modalTitle')}</DialogTitle>
            <DialogDescription className="text-center text-base">
              {t('goalReformulation.modalDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="goal-text" className="text-sm font-medium">
                {t('goalReformulation.currentGoalLabel')}
              </Label>
              <Textarea
                id="goal-text"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder={t('goalReformulation.currentGoalPlaceholder')}
                className="min-h-[150px] mt-2"
                disabled={isProcessingGoal}
              />
              <TextValidator 
                text={goalText}
                textType="goal"
                showRecommendations={true}
                className="mt-3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-green-900 mb-4">{t('goalReformulation.analysisTitle')}</h3>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {t('goalReformulation.analysisItems.smart')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {t('goalReformulation.analysisItems.pain')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {t('goalReformulation.analysisItems.gain')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {t('goalReformulation.analysisItems.cta')}
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">{t('goalReformulation.exampleTitle')}</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">{t('goalReformulation.exampleBefore')}</p>
                      <p className="text-sm bg-red-50 p-2 rounded border border-red-200">
                        "{t('goalReformulation.exampleBeforeText')}"
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">{t('goalReformulation.exampleAfter')}</p>
                      <p className="text-sm bg-green-50 p-2 rounded border border-green-200">
                        "{t('goalReformulation.exampleAfterText')}"
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleGoalReformulation}
                disabled={goalText.length < 10 || isProcessingGoal}
                className="flex-1"
                size="lg"
              >
                {isProcessingGoal ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('goalReformulation.reformulateProcessing')}
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    {t('goalReformulation.reformulateButton')}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setGoalModalOpen(false)}
                disabled={isProcessingGoal}
              >
                {t('goalReformulation.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paywall Modal */}
      <PaywallModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        originalText={initialText || goalText}
        improvedText={improvedText || reformulatedGoal}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Pricing Modal */}
      <Dialog open={improvementModalOpen} onOpenChange={setImprovementModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">{t('pricingModal.title')}</DialogTitle>
            <DialogDescription className="text-center text-base">
              {t('pricingModal.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">{t('pricingModal.popular')}</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-xl sm:text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                    ₽{plan.price}
                    <span className="text-sm sm:text-base font-normal text-gray-500">/месяц</span>
                  </div>
                  <CardDescription className="text-sm sm:text-base">
                    {plan.improvements === -1 ? t('pricingModal.unlimitedImprovements') : `${plan.improvements} ${t('pricingModal.improvementsPerMonth')}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
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
                    {t('pricingModal.choosePlan')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Additional Info */}
          <div className="mt-8">
            <div className="bg-gray-50 rounded-xl p-6 max-w-2xl mx-auto">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">{t('pricingModal.whatsIncluded')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {t('pricingModal.features.professionalAlgorithms')}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {t('pricingModal.features.dataSecurity')}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {t('pricingModal.features.customerSupport')}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {t('pricingModal.features.regularUpdates')}
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