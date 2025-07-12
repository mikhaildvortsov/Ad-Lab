"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sparkles, History, CreditCard, Settings, LogOut, FileText, Calendar, TrendingUp, User, Check, X, RefreshCw, Copy, Download } from "lucide-react"
import { MobileNav } from "@/components/ui/mobile-nav"
import { useAuth } from "@/lib/auth-context"
import { getClientSession } from "@/lib/client-session"
import { ChatInterface } from "@/components/chat-interface"
import { useLocale } from "@/lib/use-locale"
import { useTranslation } from "@/lib/translations"
import { LanguageSelector } from "@/components/language-selector"

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

interface Request {
  id: number
  originalText: string
  improvedText: string
  date: string
  status: string
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

export default function Dashboard() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)
  const { user, loading, logout, updateUser } = useAuth()
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<Plan>(plans[0])
  const [isLoading, setIsLoading] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [copySuccess, setCopySuccess] = useState<number | null>(null)

  // Fallback: если AuthContext не загрузился, но сессия есть, обновляем контекст
  useEffect(() => {
    const checkAndUpdateSession = async () => {
      if (!loading && !user) {
        try {
          const session = await getClientSession()
          if (session) {
            console.log('Dashboard: Found session, updating AuthContext:', session.user)
            updateUser(session.user)
          }
        } catch (error) {
          console.error('Dashboard: Error checking session:', error)
        }
      }
    }

    checkAndUpdateSession()
  }, [loading, user, updateUser])
  // История запросов пользователя (пустая для новых пользователей)
  const [requests] = useState<Request[]>([])
  
  const router = useRouter()
  
  useEffect(() => {
    // Если пользователь не авторизован и загрузка завершена, перенаправляем на авторизацию
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    try {
      await logout()
      // Принудительно перенаправляем на главную страницу
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      // Даже если есть ошибка, все равно перенаправляем
      router.push('/')
    }
  }

  const handleRegenerateText = (requestId: number, originalText: string) => {
    // Открываем чат с исходным текстом для повторной генерации
    setChatOpen(true)
    // TODO: Передать исходный текст в чат-интерфейс
    console.log('Повторная генерация для запроса:', requestId, originalText)
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

  const handleChangePlan = async (newPlan: Plan) => {
    setIsLoading(true)
    try {
      // Здесь будет API вызов для смены тарифа
      console.log('Смена тарифа на:', newPlan.name)
      
      // Имитация API вызова
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setCurrentPlan(newPlan)
      setShowPlanModal(false)
      
      // Показываем уведомление об успешной смене тарифа
      alert(`Тариф успешно изменен на "${newPlan.name}"`)
    } catch (error) {
      console.error('Ошибка при смене тарифа:', error)
      alert('Произошла ошибка при смене тарифа. Попробуйте позже.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setIsLoading(true)
    try {
      // Здесь будет API вызов для отмены подписки
      console.log('Отмена подписки')
      
      // Имитация API вызова
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setShowCancelModal(false)
      
      // Показываем уведомление об отмене подписки
      alert('Подписка отменена. Вы сможете возобновить её в любое время.')
    } catch (error) {
      console.error('Ошибка при отмене подписки:', error)
      alert('Произошла ошибка при отмене подписки. Попробуйте позже.')
    } finally {
      setIsLoading(false)
    }
  }

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

  if (!user && typeof window !== 'undefined') {
    window.location.replace('/');
    return <div>{t('dashboard.redirecting')}</div>;
  }
  if (!user) {
    return <div>{t('dashboard.authRequired')}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <span className="text-lg sm:text-xl font-bold text-gray-900">Ad Lab</span>
          </Link>
          
          {/* Desktop Navigation */}
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
            <Link href="/">
              <Button variant="ghost" size="sm">{t('dashboard.header.home')}</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              {t('dashboard.header.logout')}
            </Button>
          </div>

          {/* Mobile Navigation */}
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

        <Tabs defaultValue="history" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
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

          <TabsContent value="history" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg sm:text-xl font-semibold">{t('dashboard.history.title')}</h2>
            </div>

            <div className="space-y-4">
              {requests.length === 0 ? (
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
                      onClick={() => setChatOpen(true)}
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
              <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('dashboard.billing.currentPlan')}</h2>
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg text-blue-900">{t('dashboard.billing.plan').replace('{name}', currentPlan.name)}</CardTitle>
                  <CardDescription className="text-blue-700 text-sm sm:text-base">
                    ₽{currentPlan.price}/{locale === 'en' ? 'month' : 'месяц'} • {t('dashboard.billing.nextBilling').replace('{date}', locale === 'en' ? 'February 15, 2024' : '15 февраля 2024')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div>✓ {currentPlan.improvements === -1 ? t('dashboard.billing.unlimited') : currentPlan.improvements} {t('dashboard.billing.improvements')} ({t('dashboard.billing.used')}: 2/{currentPlan.improvements === -1 ? '∞' : currentPlan.improvements})</div>
                    {currentPlan.features.map((feature, index) => (
                      <div key={index}>✓ {feature}</div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          {t('dashboard.billing.changePlan')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{t('dashboard.billing.selectNewPlan')}</DialogTitle>
                          <DialogDescription>
                            {t('dashboard.billing.selectPlanDescription')}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                          {plans.map((plan) => (
                            <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                              {plan.popular && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                  <Badge className="bg-blue-500 text-white">{t('dashboard.billing.popular')}</Badge>
                                </div>
                              )}
                              <CardHeader className="text-center">
                                <CardTitle className="text-lg">{plan.name}</CardTitle>
                                <div className="text-2xl font-bold">₽{plan.price}<span className="text-sm font-normal text-gray-500">/{locale === 'en' ? 'month' : 'месяц'}</span></div>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-2 mb-4">
                                  {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-2 text-sm">
                                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                                <Button 
                                  onClick={() => handleChangePlan(plan)}
                                  disabled={isLoading || currentPlan.id === plan.id}
                                  className="w-full"
                                  variant={currentPlan.id === plan.id ? "secondary" : "default"}
                                >
                                  {isLoading ? t('dashboard.billing.loading') : currentPlan.id === plan.id ? t('dashboard.billing.currentPlanButton') : t('dashboard.billing.selectPlanButton')}
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50">
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
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-4">{t('dashboard.billing.paymentHistory')}</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="font-medium">{t('dashboard.billing.plan').replace('{name}', currentPlan.name)}</div>
                        <div className="text-sm text-gray-500">{locale === 'en' ? 'January 15, 2024' : '15 января 2024'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₽{currentPlan.price}</div>
                        <Badge variant="secondary" className="text-xs">{t('dashboard.billing.paid')}</Badge>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="font-medium">{t('dashboard.billing.plan').replace('{name}', currentPlan.name)}</div>
                        <div className="text-sm text-gray-500">{locale === 'en' ? 'December 15, 2023' : '15 декабря 2023'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₽{currentPlan.price}</div>
                        <Badge variant="secondary" className="text-xs">{t('dashboard.billing.paid')}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{t('dashboard.analytics.totalRequests')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">24</div>
                  <p className="text-xs text-green-600">{t('dashboard.analytics.monthlyGrowth').replace('{percent}', '12')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{t('dashboard.analytics.averageLength')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">156</div>
                  <p className="text-xs text-gray-500">{t('dashboard.analytics.characters')}</p>
                </CardContent>
              </Card>

              <Card className="sm:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{t('dashboard.analytics.qualityImprovement')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">+340%</div>
                  <p className="text-xs text-blue-600">{t('dashboard.analytics.average')}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">{t('dashboard.analytics.dailyActivity')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 sm:h-64 flex items-end justify-between gap-1 sm:gap-2">
                  {[3, 7, 2, 8, 5, 12, 4].map((height, index) => (
                    <div key={index} className="flex-1 bg-blue-200 rounded-t" style={{ height: `${height * 6}px` }} />
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <ChatInterface open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  )
}
