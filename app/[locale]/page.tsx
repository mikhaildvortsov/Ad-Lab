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
import { Container } from "@/components/ui/container"
import { Section } from "@/components/ui/section"
import { Heading1, Heading2, Heading3, BodyLarge, BodyMedium, BodySmall } from "@/components/ui/typography"
import { AdaptiveButton } from "@/components/ui/adaptive-button"
import { AdaptiveCard } from "@/components/ui/adaptive-card"
import { FadeInUp, FadeInDown, FadeInLeft, FadeInRight, FadeInScale } from "@/components/ui/fade-in"

import { getAvailableNiches, getAvailableNichesWithTranslation, type NicheType } from '@/lib/ai-instructions'

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
  const { t, tArray } = useTranslation(locale)
  const [chatOpen, setChatOpen] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

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

  useEffect(() => {
    const checkSubscription = async () => {
      if (user) {

        if (process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
          setHasActiveSubscription(true);
          setSubscriptionData({
            hasActiveSubscription: true,
            subscription: {
              id: 'test-subscription',
              planName: 'Test Plan',
              status: 'active',
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              isExpired: false
            }
          });
          return;
        }

        try {
          const response = await fetch('/api/auth/subscription');
          if (response.ok) {
            const data = await response.json();
            if (data.success) {

              setHasActiveSubscription(data.data.hasActiveSubscription);
              setSubscriptionData(data.data);
            } else {
              setHasActiveSubscription(false);
              setSubscriptionData(null);
            }
          } else {

            setHasActiveSubscription(false);
            setSubscriptionData(null);
          }
        } catch (error) {
          console.error('Error checking subscription:', error);

          setHasActiveSubscription(false);
          setSubscriptionData(null);
        }
      } else {

        setHasActiveSubscription(false);
        setSubscriptionData(null);
      }
    };

    checkSubscription();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout()

    } catch (error) {
      console.error('Logout error:', error)

    }
  };

  const handleTryClick = () => {
    if (!isClient || !user) {

      router.push(`/${locale}/auth?mode=register`);
    } else if (hasActiveSubscription === null) {

      return;
    } else if (hasActiveSubscription === false) {

      setShowPaywall(true);
    } else {

      router.push(`/${locale}/dashboard`);
    }
  };

  const handleImproveText = async () => {
    if (!initialText.trim() || initialText.length < 20) {
      return;
    }

    setIsProcessing(true);

    try {

      if (!csrfToken) {
        console.error('No CSRF token available');
        return;
      }

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

        if (process.env.NEXT_PUBLIC_TEST_MODE !== 'true') {
          setTimeout(() => {
            setShowPaywall(true);
          }, 1000);
        }
      } else {
        console.error('Error improving text:', data.error);

      }
    } catch (error) {
      console.error('Error improving text:', error);

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

    setShowPaywall(false);

    setHasActiveSubscription(true);

    router.push(`/${locale}/dashboard`);
  };

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
      {}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <Container size="wide" className="py-4 sm:py-6 lg:py-8">
          <div className="flex justify-between items-center">
            <FadeInLeft delay={50}>
              <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Sparkles className="h-7 w-7 sm:h-9 sm:w-9 lg:h-11 lg:w-11 text-blue-600" />
                <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900">{t('header.brand')}</span>
              </Link>
            </FadeInLeft>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              <FadeInDown delay={100}>
                <LanguageSelector />
              </FadeInDown>
              {isClient && user ? (
                <div className="flex items-center gap-3 lg:gap-4">
                  <FadeInDown delay={150}>
                    <div className="hidden lg:flex items-center gap-2">
                      {user.image ? (
                        <img 
                          src={user.image} 
                          alt={user.name} 
                          className="w-8 h-8 lg:w-10 lg:h-10 rounded-full"
                        />
                      ) : (
                        <User className="h-8 w-8 lg:h-10 lg:w-10 text-gray-600" />
                      )}
                      <span className="text-sm lg:text-base font-medium text-gray-700">{user.name}</span>
                    </div>
                  </FadeInDown>
                  <FadeInDown delay={200}>
                    <Link href={`/${locale}/dashboard`}>
                      <Button variant="ghost" size="sm" className="text-base sm:text-lg lg:text-xl px-4 lg:px-5 py-2 lg:py-3">{t('dashboardBtn')}</Button>
                    </Link>
                  </FadeInDown>
                  <FadeInDown delay={250}>
                    <Button variant="outline" onClick={handleLogout} size="sm" className="text-base sm:text-lg lg:text-xl px-4 lg:px-5 py-2 lg:py-3">
                      <LogOut className="h-5 w-5 lg:h-6 lg:w-6 mr-2" />
                      <span className="hidden sm:inline">{t('header.logout')}</span>
                    </Button>
                  </FadeInDown>
                </div>
              ) : (
                <>
                  <FadeInDown delay={150}>
                    <Link href={`/${locale}/auth?mode=login`}>
                      <Button variant="ghost" size="sm" className="text-base sm:text-lg lg:text-xl px-4 lg:px-5 py-2 lg:py-3">{t('header.login')}</Button>
                    </Link>
                  </FadeInDown>
                  <FadeInDown delay={200}>
                    <Link href={`/${locale}/auth?mode=register`}>
                      <Button size="sm" className="text-base sm:text-lg lg:text-xl px-4 lg:px-5 py-2 lg:py-3">{t('header.register')}</Button>
                    </Link>
                  </FadeInDown>
                </>
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center gap-2">
              <FadeInDown delay={100}>
                <LanguageSelector />
              </FadeInDown>
              <FadeInDown delay={150}>
                <MobileNav user={isClient ? user : null} onLogout={handleLogout} t={t} />
              </FadeInDown>
            </div>
          </div>
        </Container>
      </header>

      {/* Hero Section */}
      <Section containerSize="wide" padding="xxlarge">
        <div className="text-center max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto">
          <FadeInUp delay={100}>
            <Heading1>
              {t('hero.title')}{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t('hero.titleHighlight')}
              </span>
            </Heading1>
          </FadeInUp>
          
          <FadeInUp delay={200}>
            <BodyLarge className="max-w-3xl lg:max-w-4xl mx-auto">
              {t('hero.subtitle')}
            </BodyLarge>
          </FadeInUp>

          {/* Framework Description Section */}
          <div className="mt-16 lg:mt-20 mb-12 lg:mb-16">
            <div className="text-center mb-8 lg:mb-12">
              <FadeInUp delay={300}>
                <Heading2>
                  {t('dkcpMarketing.title')}
                </Heading2>
              </FadeInUp>
              <FadeInUp delay={400}>
                <BodyMedium className="max-w-3xl lg:max-w-4xl mx-auto">
                  {t('dkcpMarketing.subtitle')}
                </BodyMedium>
              </FadeInUp>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {/* What is it */}
              <FadeInLeft delay={500}>
                <AdaptiveCard size="lg" className="h-full">
                  <div className="flex flex-col items-center text-center h-full">
                    <Sparkles className="h-12 w-12 lg:h-14 lg:w-14 text-blue-600 mb-4" />
                    <Heading3 className="text-xl lg:text-2xl mb-3 text-center">
                      {t('dkcpMarketing.whatIs.title')}
                    </Heading3>
                    <BodyMedium className="text-sm lg:text-base leading-relaxed text-center flex-grow">
                      {t('dkcpMarketing.whatIs.description')}
                    </BodyMedium>
                  </div>
                </AdaptiveCard>
              </FadeInLeft>

              {/* Analysis points */}
              <FadeInUp delay={600}>
                <AdaptiveCard size="lg" className="h-full">
                  <div className="flex flex-col items-start text-left h-full">
                    <Target className="h-12 w-12 lg:h-14 lg:w-14 text-purple-600 mb-4 mx-auto" />
                    <Heading3 className="text-xl lg:text-2xl mb-3 text-center w-full">
                      {t('dkcpMarketing.analysis.title')}
                    </Heading3>
                    <ul className="sm:text-lg xl:text-2xl 2xl:text-3xl text-gray-600 text-sm lg:text-base leading-relaxed text-center flex-grow">
                      {(() => {
                        try {
                          const points = tArray('dkcpMarketing.analysis.points');
                          if (points && points.length > 0) {
                            return points.map((point: string, index: number) => (
                              <li key={index} className="flex items-start gap-3 w-full pl-2">
                                <span className="text-purple-600 font-bold text-lg">•</span>
                                {point}
                              </li>
                            ));
                          } else {
                            const fallbackPoints = [
                              "Деятельность (Activity) - базовые потребности",
                              "Задачи (Jobs) - конкретные цели клиентов",
                              "Силы (Forces) - push/pull факторы",
                              "Конфликты (KMC) - ключевые противоречия",
                              "Выбор (Selection) - приоритетные проблемы"
                            ];
                            return fallbackPoints.map((point: string, index: number) => (
                              <li key={index} className="flex items-start gap-3 w-full pl-2">
                                <span className="text-purple-600 font-bold text-lg">•</span>
                                {point}
                              </li>
                            ));
                          }
                        } catch (error) {
                          const fallbackPoints = [
                            "Деятельность (Activity) - базовые потребности",
                            "Задачи (Jobs) - конкретные цели клиентов",
                            "Силы (Forces) - push/pull факторы",
                            "Конфликты (KMC) - ключевые противоречия",
                            "Выбор (Selection) - приоритетные проблемы"
                          ];
                                                                                                                                                                                                                                                                             return fallbackPoints.map((point: string, index: number) => (
                                                            <li key={index} className="flex items-start gap-3 w-full pl-2">
                                <span className="text-purple-600 font-bold text-lg">•</span>
                                {point}
                              </li>
                          ));
                        }
                      })()}
                    </ul>
                  </div>
                </AdaptiveCard>
              </FadeInUp>

              {/* How helps */}
              <FadeInRight delay={700}>
                <AdaptiveCard size="lg" className="h-full">
                  <div className="flex flex-col items-center text-center h-full">
                    <TrendingUp className="h-12 w-12 lg:h-14 lg:w-14 text-green-600 mb-4" />
                    <Heading3 className="text-xl lg:text-2xl mb-3 text-center">
                      {t('dkcpMarketing.howHelps.title')}
                    </Heading3>
                    <BodyMedium className="text-sm lg:text-base leading-relaxed text-center flex-grow">
                      {t('dkcpMarketing.howHelps.description')}
                    </BodyMedium>
                  </div>
                </AdaptiveCard>
              </FadeInRight>
            </div>
          </div>

          <FadeInUp delay={900}>
            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center">
              <AdaptiveButton 
                size="xl"
                className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={handleTryClick}
              >
                {isClient && user ? t('upgrade') : t('hero.cta')}
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 transition-transform duration-300 group-hover:translate-x-1" />
              </AdaptiveButton>

              <AdaptiveButton 
                size="xl"
                variant="outline"
                className="group border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                onClick={() => setGoalModalOpen(true)}
              >
                <Target className="mr-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 transition-transform duration-300 group-hover:scale-110" />
                {t('goalReformulation.buttonText')}
              </AdaptiveButton>
            </div>
          </FadeInUp>
        </div>
      </Section>

      {/* Features Section */}
      <Section containerSize="wide" padding="xlarge">
        <div className="text-center mb-12 lg:mb-16">
          <FadeInUp delay={100}>
            <Heading2>
              {t('features.title')}
            </Heading2>
          </FadeInUp>
          <FadeInUp delay={200}>
            <BodyMedium className="max-w-3xl lg:max-w-4xl mx-auto">
              {t('features.subtitle')}
            </BodyMedium>
          </FadeInUp>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Target */}
          <FadeInLeft delay={300}>
            <AdaptiveCard size="lg" className="h-full">
              <div className="flex flex-col items-center text-center h-full">
                <Target className="h-12 w-12 lg:h-14 lg:w-14 text-blue-600 mb-4" />
                <Heading3 className="text-xl lg:text-2xl mb-3 text-center">
                  {t('features.target.title')}
                </Heading3>
                <BodyMedium className="text-sm lg:text-base leading-relaxed text-center flex-grow">
                  {t('features.target.description')}
                </BodyMedium>
              </div>
            </AdaptiveCard>
          </FadeInLeft>
          
          {/* Speed */}
          <FadeInUp delay={400}>
            <AdaptiveCard size="lg" className="h-full">
              <div className="flex flex-col items-center text-center h-full">
                <Zap className="h-12 w-12 lg:h-14 lg:w-14 text-purple-600 mb-4" />
                <Heading3 className="text-xl lg:text-2xl mb-3 text-center">
                  {t('features.speed.title')}
                </Heading3>
                <BodyMedium className="text-sm lg:text-base leading-relaxed text-center flex-grow">
                  {t('features.speed.description')}
                </BodyMedium>
              </div>
            </AdaptiveCard>
          </FadeInUp>
          
          {/* Conversion */}
          <FadeInRight delay={500}>
            <AdaptiveCard size="lg" className="h-full">
              <div className="flex flex-col items-center text-center h-full">
                <TrendingUp className="h-12 w-12 lg:h-14 lg:w-14 text-green-600 mb-4" />
                <Heading3 className="text-xl lg:text-2xl mb-3 text-center">
                  {t('features.conversion.title')}
                </Heading3>
                <BodyMedium className="text-sm lg:text-base leading-relaxed text-center flex-grow">
                  {t('features.conversion.description')}
                </BodyMedium>
              </div>
            </AdaptiveCard>
          </FadeInRight>
        </div>
      </Section>

      {/* Niche Section */}
      <Section containerSize="wide" padding="xlarge">
        <div className="text-center mb-12 lg:mb-16">
          <FadeInUp delay={100}>
            <Heading2>
              {t('niche.title')}
            </Heading2>
          </FadeInUp>
          <FadeInUp delay={200}>
            <BodyMedium className="max-w-3xl lg:max-w-4xl mx-auto">
              {t('niche.subtitle')}
            </BodyMedium>
          </FadeInUp>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12 mb-8 lg:mb-12">
          {getAvailableNichesWithTranslation(t).slice(0, 6).map((niche, index) => {
            const IconComponent = nicheIcons[niche.value as keyof typeof nicheIcons] || Building2;
            const delay = 300 + (index * 100);
            const direction = index % 2 === 0 ? 'left' : 'right';
            
            return (
              <div key={niche.value} className="w-full">
                {direction === 'left' ? (
                  <FadeInLeft delay={delay}>
                    <AdaptiveCard size="xl" hover className="h-full w-full">
                      <div className="flex flex-col items-center text-center gap-6 lg:gap-8 mb-6 lg:mb-8">
                        <IconComponent className="h-16 w-16 lg:h-20 lg:w-20 text-blue-600" />
                        <Heading3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-center">{niche.label}</Heading3>
                      </div>
                    </AdaptiveCard>
                  </FadeInLeft>
                ) : (
                  <FadeInRight delay={delay}>
                    <AdaptiveCard size="xl" hover className="h-full w-full">
                      <div className="flex flex-col items-center text-center gap-6 lg:gap-8 mb-6 lg:mb-8">
                        <IconComponent className="h-16 w-16 lg:h-20 lg:w-20 text-blue-600" />
                        <Heading3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-center">{niche.label}</Heading3>
                      </div>
                    </AdaptiveCard>
                  </FadeInRight>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 lg:py-16">
        <Container size="wide" className="text-center">
          <FadeInUp delay={100}>
            <div className="flex items-center justify-center gap-3 lg:gap-5 mb-4 lg:mb-6">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 lg:h-9 lg:w-9" />
              <span className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold">{t('header.brand')}</span>
            </div>
          </FadeInUp>
          <FadeInUp delay={200}>
            <div className="space-y-2 lg:space-y-3">
              <Link 
                href={`/${locale}/privacy`} 
                className="text-base sm:text-lg lg:text-xl xl:text-2xl text-gray-400 hover:text-white underline transition-colors"
              >
                {t('privacy.title')}
              </Link>
              <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-gray-400">{t('footer.copyright')}</p>
            </div>
          </FadeInUp>
        </Container>
      </footer>

              <ChatInterface 
          open={chatOpen} 
          onOpenChange={setChatOpen}
        />

      {}
      <Dialog open={improvementModalOpen} onOpenChange={setImprovementModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <FadeInUp delay={50}>
              <DialogTitle className="text-2xl font-bold text-center">{t('scriptImprover.title')}</DialogTitle>
            </FadeInUp>
            <FadeInUp delay={100}>
              <DialogDescription className="text-center text-base">
                {t('scriptImprover.description')}
              </DialogDescription>
            </FadeInUp>
          </DialogHeader>

          <div className="space-y-6">
            <FadeInUp delay={150}>
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
                <TextValidator 
                  text={initialText}
                  textType="script"
                  showRecommendations={true}
                  className="mt-3"
                />
              </div>
            </FadeInUp>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FadeInLeft delay={200}>
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
              </FadeInLeft>

              <FadeInRight delay={250}>
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
              </FadeInRight>
            </div>

            <FadeInUp delay={300}>
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
            </FadeInUp>
          </div>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <FadeInUp delay={50}>
              <DialogTitle className="text-2xl font-bold text-center">{t('goalReformulation.modalTitle')}</DialogTitle>
            </FadeInUp>
            <FadeInUp delay={100}>
              <DialogDescription className="text-center text-base">
                {t('goalReformulation.modalDescription')}
              </DialogDescription>
            </FadeInUp>
          </DialogHeader>

          <div className="space-y-6">
            <FadeInUp delay={150}>
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
            </FadeInUp>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FadeInLeft delay={200}>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-green-900 mb-4">{t('goalReformulation.analysisTitle')}</h3>
                    <ul className="space-y-2 text-sm text-green-800">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {t('goalReformulation.analysisItems.smart')}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {t('goalReformulation.analysisItems.pain')}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {t('goalReformulation.analysisItems.gain')}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {t('goalReformulation.analysisItems.cta')}
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </FadeInLeft>

              <FadeInRight delay={250}>
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
              </FadeInRight>
            </div>

            <FadeInUp delay={300}>
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
            </FadeInUp>
          </div>
        </DialogContent>
      </Dialog>

      {}
      <PaywallModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        originalText={initialText || goalText}
        improvedText={improvedText || reformulatedGoal}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {}
      <Dialog open={improvementModalOpen} onOpenChange={setImprovementModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">{t('pricingModal.title')}</DialogTitle>
            <DialogDescription className="text-center text-base">
              {t('pricingModal.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {plans.map((plan, index) => (
              <FadeInUp key={plan.id} delay={150 + (index * 100)}>
                <Card className={`relative ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white">{t('pricingModal.popular')}</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="text-xl sm:text-2xl mb-2">{plan.name}</CardTitle>
                    <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                      {plan.originalPrice && (
                        <div className="text-lg text-gray-500 line-through mb-1">
                          ₽{plan.originalPrice}
                        </div>
                      )}
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
              </FadeInUp>
            ))}
          </div>

          <FadeInUp delay={500}>
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
          </FadeInUp>
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
