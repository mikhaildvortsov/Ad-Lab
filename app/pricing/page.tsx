"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useLocale } from "@/lib/use-locale"
import { useTranslation } from "@/lib/translations"
interface Plan {
  id: string
  name: string
  price: number
  originalPrice?: number
  features: string[]
  improvements: number
  popular?: boolean
}
export default function PricingPage() {
  const { user, loading } = useAuth()
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const getPlanName = (planId: string) => {
    try {
      const translationKey = `paywallModal.plans.${planId}.name`;
      const translation = t(translationKey);
      if (translation === translationKey) {
        const fallbackNames: Record<string, string> = {
          'week': 'Неделя',
          'month': 'Месяц', 
          'quarter': 'Три месяца'
        };
        return fallbackNames[planId] || planId;
      }
      return translation;
    } catch (error) {
      console.error('Error getting plan name:', error);
      const fallbackNames: Record<string, string> = {
        'week': 'Неделя',
        'month': 'Месяц',
        'quarter': 'Три месяца'
      };
      return fallbackNames[planId] || planId;
    }
  };
  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true)
      try {
        const response = await fetch('/api/plans')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setPlans(data.data)
          }
        }
      } catch (error) {
        console.error('Error fetching plans:', error)
      } finally {
        setLoadingPlans(false)
      }
    }
    fetchPlans()
  }, [])
  const handleSelectPlan = async (plan: Plan) => {
    setIsLoading(true)
    setSelectedPlan(plan)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Plan selected successfully:', plan)
    } catch (error) {
      console.error('Ошибка при выборе тарифа:', error)
    } finally {
      setIsLoading(false)
    }
  }
  if (loading || loadingPlans) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{loading ? 'Загрузка...' : 'Загружаем тарифы...'}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <span className="text-lg sm:text-xl font-bold text-gray-900">Ad Lab</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                На главную
              </Button>
            </Link>
            {user ? (
              <Link href={`/${locale}/dashboard`}>
                <Button size="sm">Личный кабинет</Button>
              </Link>
            ) : (
              <Link href={`/${locale}/auth?mode=login`}>
                <Button size="sm">Войти</Button>
              </Link>
            )}
          </div>
        </div>
      </header>
      {}
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Выберите подходящий тариф
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Выберите план, который лучше всего подходит для ваших потребностей
          </p>
        </div>
        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Популярный</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl sm:text-2xl mb-2">{getPlanName(plan.name)}</CardTitle>
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
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isLoading}
                  className={`w-full h-12 text-base ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                >
                  {isLoading && selectedPlan?.id === plan.id ? (
                    "Обработка..."
                  ) : (
                    user ? "Выбрать план" : "Выбрать план"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        {}
        <div className="mt-12 sm:mt-16 text-center">
          <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8 max-w-2xl mx-auto">
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
      </div>
    </div>
  )
}
