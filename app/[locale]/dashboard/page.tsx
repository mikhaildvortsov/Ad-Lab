"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sparkles, History, CreditCard, Settings, LogOut, FileText, Calendar, TrendingUp, User, Check, X, RefreshCw, Copy, Download, AlertCircle, Trash2, Lock, Plus } from "lucide-react"
import { MobileNav } from "@/components/ui/mobile-nav"
import { useAuth } from "@/lib/auth-context"
import { ChatInterface } from "@/components/chat-interface"
import { PaywallModal } from "@/components/paywall-modal"
import { useLocale } from "@/lib/use-locale"
import { useTranslation } from "@/lib/translations"
import { LanguageSelector } from "@/components/language-selector"
import { useRouter } from "next/navigation"
import { isAuthBlocked } from '@/lib/client-session'
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
interface Request {
  id: number
  originalText: string
  improvedText: string
  date: string
  status: string
}
// Функция для определения типа периода подписки
function getSubscriptionPeriodType(planName: string): 'week' | 'month' | 'quarter' {
  const planNameLower = planName?.toLowerCase();
  
  if (planNameLower?.includes('week') || planNameLower?.includes('недел')) {
    return 'week';
  } else if (planNameLower?.includes('quarter') || planNameLower?.includes('квартал') || planNameLower?.includes('3')) {
    return 'quarter';
  } else {
    return 'month';
  }
}

// Функция для получения текста кнопки продления
function getRenewalButtonText(planName: string, locale: string): string {
  const periodType = getSubscriptionPeriodType(planName);
  
  if (locale === 'ru') {
    switch (periodType) {
      case 'week':
        return 'Продлить на неделю';
      case 'quarter':
        return 'Продлить на 3 месяца';
      default:
        return 'Продлить на месяц';
    }
  } else {
    switch (periodType) {
      case 'week':
        return 'Extend for 1 week';
      case 'quarter':
        return 'Extend for 3 months';
      default:
        return 'Extend for 1 month';
    }
  }
}

// Функция для получения описания типа подписки
function getSubscriptionTypeDescription(planName: string, locale: string): string {
  const periodType = getSubscriptionPeriodType(planName);
  
  if (locale === 'ru') {
    switch (periodType) {
      case 'week':
        return 'Недельная подписка';
      case 'quarter':
        return 'Трёхмесячная подписка';
      default:
        return 'Месячная подписка';
    }
  } else {
    switch (periodType) {
      case 'week':
        return 'Weekly subscription';
      case 'quarter':
        return '3-month subscription';
      default:
        return 'Monthly subscription';
    }
  }
}

export default function Dashboard() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const { user, loading, error, login, logout, clearError } = useAuth()
  const router = useRouter()
  const [showPlanModal, setShowPlanModal] = useState(false)
  
  // Promo code state
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [isActivatingPromo, setIsActivatingPromo] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [copySuccess, setCopySuccess] = useState<number | null>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [currentUsage, setCurrentUsage] = useState<any>(null)
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null)
  const [isDeletingPayment, setIsDeletingPayment] = useState(false)
  const [presetText, setPresetText] = useState<string>('')
  const [requests, setRequests] = useState<Request[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [errorHistory, setErrorHistory] = useState<string | null>(null)
  const [errorAnalytics, setErrorAnalytics] = useState<string | null>(null)
  const [errorPayments, setErrorPayments] = useState<string | null>(null)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  
  // Function to fetch subscription data
  const fetchSubscriptionData = async () => {
    if (!user) return
    
    setLoadingSubscription(true)
    setSubscriptionError(null)
    
    if (process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
      setHasActiveSubscription(true)
      setSubscriptionData({
        hasActiveSubscription: true,
        subscription: {
          id: 'test-subscription',
          planName: 'Test Plan',
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          isExpired: false
        }
      })
      setLoadingSubscription(false)
      return
    }
    
    try {
      const response = await fetch('/api/auth/subscription')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setHasActiveSubscription(data.data.hasActiveSubscription)
          setSubscriptionData(data.data)
          setSubscriptionError(null)
        } else {
          setSubscriptionError(data.error || 'Ошибка получения данных подписки')
          setHasActiveSubscription(false)
          setSubscriptionData(null)
        }
      } else {
        setSubscriptionError(`HTTP ошибка: ${response.status}`)
        setHasActiveSubscription(false)
        setSubscriptionData(null)
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
      setSubscriptionError('Ошибка сети при загрузке данных подписки')
      setHasActiveSubscription(false)
      setSubscriptionData(null)
    } finally {
      setLoadingSubscription(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchSubscriptionData()
    } else {
      // Reset state when user is not available
      setHasActiveSubscription(null)
      setSubscriptionData(null)
      setSubscriptionError(null)
      setLoadingSubscription(false)
    }
  }, [user])
  useEffect(() => {
    if (!loading && !user) {
      const authPath = locale && locale !== 'en' ? `/${locale}/auth` : '/auth'
      console.log('Dashboard: No user found, redirecting to:', authPath)
      router.push(authPath)
    }
  }, [loading, user, locale, router])

  // Removed automatic redirect for users without subscription
  // Users should be able to access dashboard to see their status and purchase subscription
  useEffect(() => {
    if (user && hasActiveSubscription !== null) {
      fetchHistoryData()
      fetchAnalyticsData()
      fetchPaymentHistory()
      fetchPlansData()
      fetchCurrentUsage()
    }
  }, [user, hasActiveSubscription])

  // Fetch CSRF token when user is authenticated
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('dashboard.loading')}</p>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {locale === 'ru' ? 'Ошибка авторизации' : 'Authorization Error'}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => {
              clearError()
              window.location.reload()
            }} variant="outline">
              {locale === 'ru' ? 'Попробовать снова' : 'Try Again'}
            </Button>
            <Button onClick={login}>
              {locale === 'ru' ? 'Войти заново' : 'Sign In Again'}
            </Button>
          </div>
        </div>
      </div>
    )
  }
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {locale === 'ru' ? 'Загрузка...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }
  const fetchHistoryData = async () => {
    setLoadingHistory(true)
    setErrorHistory(null)
    try {
      const response = await fetch('/api/history?limit=10')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const transformedRequests = data.data.data.map((query: any, index: number) => ({
            id: index + 1, 
            originalText: query.query_text,
            improvedText: query.response_text || 'Processing...',
            date: query.created_at,
            status: query.success ? 'completed' : 'failed'
          }))
          setRequests(transformedRequests)
        } else {
          setErrorHistory(data.error || 'Failed to load history')
        }
      } else {
        setErrorHistory('Failed to load history data')
      }
    } catch (error) {
      console.error('Error fetching history:', error)
      setErrorHistory('Network error while loading history')
    } finally {
      setLoadingHistory(false)
    }
  }
  const fetchAnalyticsData = async () => {
    setLoadingAnalytics(true)
    setErrorAnalytics(null)
    try {
      const response = await fetch('/api/analytics')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAnalytics(data.data)
        } else {
          setErrorAnalytics(data.error || 'Failed to load analytics')
        }
      } else {
        setErrorAnalytics('Failed to load analytics data')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setErrorAnalytics('Network error while loading analytics')
    } finally {
      setLoadingAnalytics(false)
    }
  }
  const fetchPaymentHistory = async () => {
    setLoadingPayments(true)
    setErrorPayments(null)
    try {
      const response = await fetch('/api/payments/history?limit=5')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPaymentHistory(data.data.data)
        } else {
          setErrorPayments(data.error || 'Failed to load payment history')
        }
      } else {
        setErrorPayments('Failed to load payment data')
      }
    } catch (error) {
      console.error('Error fetching payment history:', error)
      setErrorPayments('Network error while loading payments')
    } finally {
      setLoadingPayments(false)
    }
  }
  const retryFetchHistory = () => {
    fetchHistoryData()
  }
  const retryFetchAnalytics = () => {
    fetchAnalyticsData()
  }
  const retryFetchPayments = () => {
    fetchPaymentHistory()
  }
  const fetchPlansData = async () => {
    setLoadingPlans(true)
    try {
      const response = await fetch('/api/plans')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPlans(data.data)
          if (subscriptionData?.subscription?.planName) {
            const planId = mapPlanNameToId(subscriptionData.subscription.planName);
            const plan = data.data.find((p: Plan) => p.name === planId)
            if (plan) setCurrentPlan(plan)
          } else if (data.data.length > 0) {
            setCurrentPlan(data.data[0])
          }
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoadingPlans(false)
    }
  }
  const fetchCurrentUsage = async () => {
    if (!csrfToken) {
      console.error('No CSRF token available for stats request');
      return;
    }
    try {
      const response = await fetch('/api/history?action=stats', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ action: 'stats' })
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCurrentUsage(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching current usage:', error)
    }
  }
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  const handleRegenerateText = (requestId: number, originalText: string) => {
    setPresetText(originalText)
    setChatOpen(true)
    console.log('Повторная генерация для запроса:', requestId, originalText)
  }
  
  const handleNewRequest = () => {
    setPresetText('')
    setChatOpen(true)
    console.log('Создание нового запроса')
  }
  const handleCopyText = async (text: string, requestId: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(requestId)
      setTimeout(() => setCopySuccess(null), 2000)
    } catch (error) {
      console.error('Ошибка копирования:', error)
      alert('Не удалось скопировать текст')
    }
  }
  const handleExportText = (request: any) => {
    const content = `${t('dashboard.history.originalText').toUpperCase()}\n${request.originalText}\n\n${t('dashboard.history.improvedText').toUpperCase()}\n${request.improvedText}\n\n${locale === 'en' ? 'Date' : 'Дата'}: ${new Date(request.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'ru-RU')}`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ad-lab-request-${request.id}-${request.date}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  const handlePaymentSuccess = () => {
    setShowPlanModal(false)
    setHasActiveSubscription(true)
    setChatOpen(true)
  }

  const handleActivatePromoCode = async () => {
    if (!promoCodeInput.trim()) {
      setPromoError(t('promoCode.errors.required'))
      return
    }

    if (!csrfToken) {
      setPromoError('Отсутствует токен безопасности. Попробуйте перезагрузить страницу.')
      return
    }

    setIsActivatingPromo(true)
    setPromoError(null)

    try {
      const response = await fetch('/api/promo/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ code: promoCodeInput.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        setPromoCodeInput('')
        setHasActiveSubscription(true)
        // Refresh subscription data
        fetchSubscriptionData()
      } else {
        setPromoError(data.error || t('promoCode.errors.activationFailed'))
      }
    } catch (error) {
      console.error('Error activating promo code:', error)
      setPromoError(t('promoCode.errors.activationFailed'))
    } finally {
      setIsActivatingPromo(false)
    }
  }
  const handleCancelSubscription = async () => {
    setIsLoading(true)
    try {
      console.log('Отмена подписки')
      await new Promise(resolve => setTimeout(resolve, 1000))
      setShowCancelModal(false)
      alert('Подписка отменена. Вы сможете возобновить её в любое время.')
    } catch (error) {
      console.error('Ошибка при отмене подписки:', error)
      alert('Произошла ошибка при отмене подписки. Попробуйте позже.')
    } finally {
      setIsLoading(false)
    }
  }
  const handleDeletePayment = async () => {
    if (!paymentToDelete) return
    if (!csrfToken) {
      alert(locale === 'ru' ? 'Отсутствует токен безопасности. Попробуйте перезагрузить страницу.' : 'Security token missing. Please refresh the page.');
      return;
    }
    setIsDeletingPayment(true)
    try {
      console.log('Deleting payment:', paymentToDelete)
      const response = await fetch(`/api/payments/history?id=${paymentToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
      })
      const data = await response.json()
      console.log('Delete response:', response.status, data)
      if (data.success) {
        setPaymentHistory(prev => prev.filter(p => p.id !== paymentToDelete))
        setShowDeletePaymentModal(false)
        setPaymentToDelete(null)
        console.log('Payment deleted successfully')
      } else {
        const errorMessage = data.details || data.error || (locale === 'ru' ? 'Неизвестная ошибка' : 'Unknown error')
        console.error('Delete failed:', errorMessage)
        alert((locale === 'ru' ? 'Ошибка при удалении платежа: ' : 'Error deleting payment: ') + errorMessage)
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert(locale === 'ru' ? 'Ошибка сети при удалении платежа' : 'Network error deleting payment')
    } finally {
      setIsDeletingPayment(false)
    }
  }
  const openDeletePaymentModal = (paymentId: string) => {
    setPaymentToDelete(paymentId)
    setShowDeletePaymentModal(true)
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
          {}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
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
            <LanguageSelector />
            <Link href={`/${locale}`}>
              <Button variant="ghost" size="sm">{t('dashboard.header.home')}</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              {t('dashboard.header.logout')}
            </Button>
          </div>
          {}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSelector />
            <MobileNav user={user} onLogout={handleLogout} t={t} />
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-600 text-sm sm:text-base">{t('dashboard.subtitle')}</p>
        </div>

        {hasActiveSubscription === false ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {locale === 'ru' ? 'Требуется подписка' : 'Subscription Required'}
              </h2>
              <p className="text-gray-600 mb-6">
                {locale === 'ru' 
                  ? 'Для доступа к личному кабинету необходима активная подписка или промо-код'
                  : 'An active subscription or promo code is required to access the dashboard'
                }
              </p>
              
              {/* Promo Code Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  {t('promoCode.title')}
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('promoCode.placeholder')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    disabled={isActivatingPromo}
                  />
                  <Button 
                    onClick={handleActivatePromoCode}
                    disabled={!promoCodeInput.trim() || isActivatingPromo}
                    size="sm"
                  >
                    {isActivatingPromo ? t('promoCode.activating') : t('promoCode.activate')}
                  </Button>
                </div>
                {promoError && (
                  <p className="text-red-600 text-xs mt-2">{promoError}</p>
                )}
              </div>

              <div className="text-sm text-gray-500 mb-4">
                {locale === 'ru' ? 'или' : 'or'}
              </div>

              <Button onClick={() => setShowPlanModal(true)} className="w-full">
                {locale === 'ru' ? 'Выбрать план' : 'Choose Plan'}
              </Button>
            </div>
          </div>
        ) : (
        <Tabs defaultValue="subscription" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger value="subscription" className="flex items-center gap-2 text-xs sm:text-sm py-2">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{locale === 'ru' ? 'Подписка' : 'Subscription'}</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 text-xs sm:text-sm py-2">
              <History className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t('dashboard.tabs.history')}</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2 text-xs sm:text-sm py-2">
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t('dashboard.tabs.billing')}</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs sm:text-sm py-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t('dashboard.tabs.analytics')}</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="subscription" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Текущая подписка */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {locale === 'ru' ? 'Текущая подписка' : 'Current Subscription'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingSubscription ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">
                        {locale === 'ru' ? 'Загрузка информации о подписке...' : 'Loading subscription information...'}
                      </p>
                    </div>
                  ) : subscriptionError ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        {locale === 'ru' ? 'Ошибка загрузки подписки' : 'Subscription Loading Error'}
                      </h3>
                      <p className="text-sm text-red-600 mb-4">{subscriptionError}</p>
                      <Button 
                        onClick={() => {
                          setSubscriptionError(null)
                          fetchSubscriptionData()
                        }}
                        variant="outline" 
                        size="sm"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {locale === 'ru' ? 'Повторить' : 'Retry'}
                      </Button>
                    </div>
                  ) : subscriptionData?.subscription ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{locale === 'ru' ? 'План:' : 'Plan:'}</span>
                        <div className="text-right">
                          <Badge variant={subscriptionData.subscription.status === 'active' ? 'default' : 'secondary'}>
                            {subscriptionData.subscription.planName}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            {getSubscriptionTypeDescription(subscriptionData.subscription.planName, locale)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{locale === 'ru' ? 'Статус:' : 'Status:'}</span>
                        <Badge variant={subscriptionData.subscription.status === 'active' ? 'default' : 'destructive'}>
                          {subscriptionData.subscription.status === 'active' ? 
                            (locale === 'ru' ? 'Активна' : 'Active') : 
                            (locale === 'ru' ? 'Неактивна' : 'Inactive')
                          }
                        </Badge>
                      </div>

                      {subscriptionData.subscription.expiresAt && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {locale === 'ru' ? 'Действует до:' : 'Valid until:'}
                          </span>
                          <span className="text-sm font-medium">
                            {new Date(subscriptionData.subscription.expiresAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}
                          </span>
                        </div>
                      )}

                      {subscriptionData.subscription.daysUntilExpiry !== null && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {locale === 'ru' ? 'Дней осталось:' : 'Days remaining:'}
                          </span>
                          <span className={`text-sm font-medium ${
                            subscriptionData.subscription.daysUntilExpiry <= 7 ? 'text-red-600' : 
                            subscriptionData.subscription.daysUntilExpiry <= 30 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {subscriptionData.subscription.daysUntilExpiry}
                          </span>
                        </div>
                      )}

                      {subscriptionData.subscription.maxQueriesPerMonth && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {locale === 'ru' ? 'Запросов в месяц:' : 'Queries per month:'}
                          </span>
                          <span className="text-sm font-medium">
                            {subscriptionData.subscription.maxQueriesPerMonth}
                          </span>
                        </div>
                      )}

                      {subscriptionData.subscription.canRenew && (
                        <div className="pt-4 border-t">
                          <Button 
                            onClick={() => setShowPlanModal(true)} 
                            className="w-full"
                            variant="outline"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {getRenewalButtonText(subscriptionData.subscription.planName, locale)}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        {locale === 'ru' ? 'Нет активной подписки' : 'No Active Subscription'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {locale === 'ru' 
                          ? 'У вас нет активной подписки. Приобретите план для доступа к возможностям сервиса.'
                          : 'You do not have an active subscription. Purchase a plan to access service features.'
                        }
                      </p>
                      <Button 
                        onClick={() => setShowPlanModal(true)} 
                        size="sm"
                      >
                        {locale === 'ru' ? 'Выбрать план' : 'Choose Plan'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Статистика использования */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {locale === 'ru' ? 'Использование' : 'Usage Statistics'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentUsage ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {locale === 'ru' ? 'Запросов использовано:' : 'Queries used:'}
                        </span>
                        <span className="text-sm font-medium">
                          {currentUsage.queries_count || 0}
                          {subscriptionData?.subscription?.maxQueriesPerMonth && 
                            ` / ${subscriptionData.subscription.maxQueriesPerMonth}`
                          }
                        </span>
                      </div>
                      
                      {subscriptionData?.subscription?.maxQueriesPerMonth && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min(100, (currentUsage.queries_count || 0) / subscriptionData.subscription.maxQueriesPerMonth * 100)}%` 
                            }}
                          ></div>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {locale === 'ru' ? 'Токенов использовано:' : 'Tokens used:'}
                        </span>
                        <span className="text-sm font-medium">
                          {currentUsage.tokens_used || 0}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        {locale === 'ru' ? 'Загрузка статистики...' : 'Loading usage statistics...'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="history" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg sm:text-xl font-semibold">{t('dashboard.history.title')}</h2>
              <Button onClick={handleNewRequest} className="flex items-center gap-2 whitespace-nowrap">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t('dashboard.history.newRequest')}</span>
                <span className="sm:hidden">{locale === 'ru' ? 'Новый' : 'New'}</span>
              </Button>
            </div>
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <div className="animate-pulse space-y-2">
                          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : errorHistory ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {locale === 'ru' ? 'Ошибка загрузки истории' : 'Error Loading History'}
                    </h3>
                    <p className="text-gray-500 mb-4">{errorHistory}</p>
                    <Button onClick={retryFetchHistory} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {locale === 'ru' ? 'Попробовать снова' : 'Try Again'}
                    </Button>
                  </CardContent>
                </Card>
              ) : requests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {locale === 'ru' ? 'История запросов пуста' : 'No request history'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {locale === 'ru' 
                        ? 'Здесь будут отображаться ваши запросы к ИИ для улучшения рекламных текстов'
                        : 'Your AI requests for ad text improvements will appear here'
                      }
                    </p>
                    <Button 
                      onClick={handleNewRequest}
                      className="mt-2"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {locale === 'ru' ? 'Создать первый запрос' : 'Create first request'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-base sm:text-lg">{t('dashboard.history.requestNumber').replace('{id}', request.id.toString())}</CardTitle>
                        <CardDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">{new Date(request.date).toLocaleDateString(locale === 'en' ? "en-US" : "ru-RU")}</span>
                          </div>
                          <Badge variant="secondary" className="w-fit">
                            {request.status === "completed" ? t('dashboard.history.completed') : t('dashboard.history.inProgress')}
                          </Badge>
                        </CardDescription>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleRegenerateText(request.id, request.originalText)}
                          className="flex-1 sm:flex-none"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {t('dashboard.history.regenerate')}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleCopyText(request.improvedText, request.id)}
                          className="flex-1 sm:flex-none"
                        >
                          {copySuccess === request.id ? (
                            <>
                              <Check className="h-4 w-4 mr-2 text-green-600" />
                              {t('dashboard.history.copied')}
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              {t('dashboard.history.copy')}
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleExportText(request)}
                          className="flex-1 sm:flex-none"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {t('dashboard.history.export')}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">{t('dashboard.history.originalText')}</h4>
                      <p className="text-sm bg-gray-50 p-3 rounded border">{request.originalText}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm text-gray-700">{t('dashboard.history.improvedText')}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyText(request.improvedText, request.id)}
                          className="h-6 px-2 text-xs"
                        >
                          {copySuccess === request.id ? (
                            <>
                              <Check className="h-3 w-3 mr-1 text-green-600" />
                              {t('dashboard.history.copied')}
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              {t('dashboard.history.copy')}
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm bg-blue-50 p-3 rounded border border-blue-200">{request.improvedText}</p>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="billing" className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('dashboard.billing.management')}</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => setShowPlanModal(true)}
                  className="flex-1"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t('dashboard.billing.changePlan')}
                </Button>
                <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                      <X className="h-4 w-4 mr-2" />
                      {t('dashboard.billing.cancelSubscription')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('dashboard.billing.cancelModal.title')}</DialogTitle>
                      <DialogDescription>
                        {t('dashboard.billing.cancelModal.description')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 mt-6">
                      <Button 
                        onClick={handleCancelSubscription}
                        disabled={isLoading}
                        variant="destructive"
                        className="flex-1"
                      >
                        {isLoading ? t('dashboard.billing.cancelModal.canceling') : t('dashboard.billing.cancelModal.confirm')}
                      </Button>
                      <Button 
                        onClick={() => setShowCancelModal(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        {t('dashboard.billing.cancelModal.cancel')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-4">{t('dashboard.billing.paymentHistory')}</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {loadingPayments ? (
                      <div className="space-y-0 divide-y">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-4">
                            <div className="animate-pulse flex justify-between items-center">
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                                <div className="h-3 bg-gray-200 rounded w-24"></div>
                              </div>
                              <div className="text-right space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-16"></div>
                                <div className="h-3 bg-gray-200 rounded w-12"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : process.env.NEXT_PUBLIC_TEST_MODE === 'true' ? (
                      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {t('dashboard.billing.plan').replace('{name}', 'Test Plan')}
                            <Badge variant="secondary" className="text-xs">
                              {locale === 'ru' ? 'Тестовый режим' : 'Test Mode'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">{new Date().toLocaleDateString(locale === 'en' ? "en-US" : "ru-RU")}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{locale === 'ru' ? 'Тестовый' : 'Test'}</div>
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            {locale === 'ru' ? 'Активен' : 'Active'}
                          </Badge>
                        </div>
                      </div>
                    ) : errorPayments ? (
                      <div className="p-8 text-center">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                        <p className="text-sm text-red-600 mb-3">{errorPayments}</p>
                        <Button onClick={retryFetchPayments} variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {locale === 'ru' ? 'Повторить' : 'Retry'}
                        </Button>
                      </div>
                    ) : paymentHistory.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">
                          {locale === 'ru' ? 'История платежей пуста' : 'No payment history'}
                        </p>
                      </div>
                    ) : (
                      paymentHistory.map((payment) => (
                        <div key={payment.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <div className="font-medium">
                              {t('dashboard.billing.plan').replace('{name}', payment.plan_name)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(payment.created_at).toLocaleDateString(locale === 'en' ? "en-US" : "ru-RU")}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="font-medium">
                                {payment.currency === 'RUB' ? '₽' : '$'}{payment.amount}
                              </div>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${
                                  payment.status === 'completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : payment.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {payment.status === 'completed' 
                                  ? t('dashboard.billing.paid') 
                                  : payment.status === 'pending'
                                  ? (locale === 'ru' ? 'В обработке' : 'Pending')
                                  : (locale === 'ru' ? 'Неудачно' : 'Failed')
                                }
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeletePaymentModal(payment.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="analytics" className="space-y-6">
            {loadingAnalytics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : errorAnalytics ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {locale === 'ru' ? 'Ошибка загрузки аналитики' : 'Error Loading Analytics'}
                  </h3>
                  <p className="text-gray-500 mb-4">{errorAnalytics}</p>
                  <Button onClick={retryFetchAnalytics} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {locale === 'ru' ? 'Попробовать снова' : 'Try Again'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">{t('dashboard.analytics.totalRequests')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{analytics?.totalRequests || 0}</div>
                    <p className="text-xs text-green-600">{t('dashboard.analytics.monthlyGrowth').replace('{percent}', String(analytics?.monthlyGrowth || 0))}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">{t('dashboard.analytics.averageLength')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{analytics?.averageLength || 0}</div>
                    <p className="text-xs text-gray-500">{t('dashboard.analytics.characters')}</p>
                  </CardContent>
                </Card>
                <Card className="sm:col-span-2 lg:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">{t('dashboard.analytics.qualityImprovement')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{analytics?.qualityImprovement || '+0%'}</div>
                    <p className="text-xs text-blue-600">{t('dashboard.analytics.average')}</p>
                  </CardContent>
                </Card>
              </div>
            )}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">{t('dashboard.analytics.dailyActivity')}</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAnalytics ? (
                  <div className="h-48 sm:h-64 animate-pulse bg-gray-200 rounded"></div>
                ) : (
                  <>
                    <div className="h-48 sm:h-64 flex items-end justify-between gap-1 sm:gap-2">
                      {(analytics?.weeklyActivity || [0, 0, 0, 0, 0, 0, 0]).map((height: number, index: number) => (
                        <div key={index} className="flex-1 bg-blue-200 rounded-t" style={{ height: `${Math.max(height * 6, 4)}px` }} />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>{t('dashboard.analytics.days.mon')}</span>
                      <span>{t('dashboard.analytics.days.tue')}</span>
                      <span>{t('dashboard.analytics.days.wed')}</span>
                      <span>{t('dashboard.analytics.days.thu')}</span>
                      <span>{t('dashboard.analytics.days.fri')}</span>
                      <span>{t('dashboard.analytics.days.sat')}</span>
                      <span>{t('dashboard.analytics.days.sun')}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
      <ChatInterface 
        open={chatOpen} 
        onOpenChange={setChatOpen}
        presetText={presetText}
        onPresetTextUsed={() => setPresetText('')}
      />
      <PaywallModal 
        open={showPlanModal} 
        onOpenChange={setShowPlanModal}
        onPaymentSuccess={handlePaymentSuccess}
      />
      <Dialog open={showDeletePaymentModal} onOpenChange={setShowDeletePaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dashboard.billing.deletePaymentModal.title')}</DialogTitle>
            <DialogDescription>
              {t('dashboard.billing.deletePaymentModal.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-6">
            <Button 
              onClick={handleDeletePayment}
              disabled={isDeletingPayment}
              variant="destructive"
              className="flex-1"
            >
              {isDeletingPayment ? t('dashboard.billing.deletePaymentModal.deleting') : t('dashboard.billing.deletePaymentModal.confirm')}
            </Button>
            <Button 
              onClick={() => setShowDeletePaymentModal(false)}
              variant="outline"
              className="flex-1"
            >
              {t('dashboard.billing.deletePaymentModal.cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
function mapPlanNameToId(planName: string): string {
  const mapping: Record<string, string> = {
    'Week': 'week',
    'Month': 'month', 
    'Quarter': 'quarter'
  };
  return mapping[planName] || planName.toLowerCase();
}
