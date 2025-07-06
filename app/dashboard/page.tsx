"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sparkles, History, CreditCard, Settings, LogOut, FileText, Calendar, TrendingUp, User, Check, X } from "lucide-react"
import { MobileNav } from "@/components/ui/mobile-nav"
import { useAuth } from "@/lib/auth-context"
import { getClientSession } from "@/lib/client-session"
import { ChatInterface } from "@/components/chat-interface"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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

export default function Dashboard() {
  const { user, loading, logout, updateUser } = useAuth()
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<Plan>(plans[0])
  const [isLoading, setIsLoading] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

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
  const [requests] = useState([
    {
      id: 1,
      originalText: "Купите наш продукт. Он очень хороший и недорогой.",
      improvedText:
        "Откройте для себя революционное решение, которое изменит вашу жизнь! Наш продукт сочетает в себе премиальное качество и доступную цену...",
      date: "2024-01-15",
      status: "completed",
    },
    {
      id: 2,
      originalText: "Скидка 50% на все товары. Торопитесь!",
      improvedText:
        "⚡ ВНИМАНИЕ! Невероятная возможность сэкономить 50% на ВСЕХ товарах! Но это предложение действует ограниченное время...",
      date: "2024-01-14",
      status: "completed",
    },
  ])
  
  const router = useRouter()
  
  useEffect(() => {
    // Если пользователь не авторизован и загрузка завершена, перенаправляем на авторизацию
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  const handleLogout = () => {
    logout()
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
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user && typeof window !== 'undefined') {
    window.location.replace('/');
    return <div>Перенаправление на главную страницу...</div>;
  }
  if (!user) {
    return <div>Для доступа к этой странице требуется авторизация.</div>;
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
            <Link href="/">
              <Button variant="ghost" size="sm">Главная</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Выйти
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <MobileNav user={user} onLogout={handleLogout} t={(key: string) => key} />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Личный кабинет</h1>
          <p className="text-gray-600 text-sm sm:text-base">Управляйте своими скриптами и подпиской</p>
        </div>

        <Tabs defaultValue="history" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="history" className="flex items-center gap-2 text-xs sm:text-sm py-2">
              <History className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">История</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2 text-xs sm:text-sm py-2">
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Биллинг</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs sm:text-sm py-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Аналитика</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg sm:text-xl font-semibold">История запросов</h2>
              <Button 
                size="sm" 
                className="w-full sm:w-auto"
                onClick={() => setChatOpen(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Новый скрипт
              </Button>
            </div>

            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-base sm:text-lg">Запрос #{request.id}</CardTitle>
                        <CardDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">{new Date(request.date).toLocaleDateString("ru-RU")}</span>
                          </div>
                          <Badge variant="secondary" className="w-fit">
                            {request.status === "completed" ? "Завершен" : "В процессе"}
                          </Badge>
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <FileText className="h-4 w-4 mr-2" />
                        Скачать
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Исходный текст:</h4>
                      <p className="text-sm bg-gray-50 p-3 rounded border">{request.originalText}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Улучшенный текст:</h4>
                      <p className="text-sm bg-blue-50 p-3 rounded border border-blue-200">{request.improvedText}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Текущий план</h2>
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg text-blue-900">{currentPlan.name} план</CardTitle>
                  <CardDescription className="text-blue-700 text-sm sm:text-base">
                    ₽{currentPlan.price}/месяц • Следующее списание: 15 февраля 2024
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div>✓ {currentPlan.improvements === -1 ? 'Неограниченные' : currentPlan.improvements} улучшений в месяц (использовано: 2/{currentPlan.improvements === -1 ? '∞' : currentPlan.improvements})</div>
                    {currentPlan.features.map((feature, index) => (
                      <div key={index}>✓ {feature}</div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          Изменить план
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Выберите новый тариф</DialogTitle>
                          <DialogDescription>
                            Выберите подходящий план для ваших потребностей
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                          {plans.map((plan) => (
                            <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                              {plan.popular && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                  <Badge className="bg-blue-500 text-white">Популярный</Badge>
                                </div>
                              )}
                              <CardHeader className="text-center">
                                <CardTitle className="text-lg">{plan.name}</CardTitle>
                                <div className="text-2xl font-bold">₽{plan.price}<span className="text-sm font-normal text-gray-500">/месяц</span></div>
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
                                  {isLoading ? "Загрузка..." : currentPlan.id === plan.id ? "Текущий план" : "Выбрать план"}
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
                          Отменить подписку
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Отменить подписку?</DialogTitle>
                          <DialogDescription>
                            Вы уверены, что хотите отменить подписку? Вы потеряете доступ к премиум функциям.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-2 mt-6">
                          <Button 
                            onClick={handleCancelSubscription}
                            disabled={isLoading}
                            variant="destructive"
                            className="flex-1"
                          >
                            {isLoading ? "Отмена..." : "Да, отменить"}
                          </Button>
                          <Button 
                            onClick={() => setShowCancelModal(false)}
                            variant="outline"
                            className="flex-1"
                          >
                            Нет, оставить
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-4">История платежей</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="font-medium">{currentPlan.name} план</div>
                        <div className="text-sm text-gray-500">15 января 2024</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₽{currentPlan.price}</div>
                        <Badge variant="secondary" className="text-xs">Оплачено</Badge>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="font-medium">{currentPlan.name} план</div>
                        <div className="text-sm text-gray-500">15 декабря 2023</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₽{currentPlan.price}</div>
                        <Badge variant="secondary" className="text-xs">Оплачено</Badge>
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
                  <CardTitle className="text-sm font-medium text-gray-600">Всего запросов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">24</div>
                  <p className="text-xs text-green-600">+12% за месяц</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Средняя длина текста</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">156</div>
                  <p className="text-xs text-gray-500">символов</p>
                </CardContent>
              </Card>

              <Card className="sm:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Улучшение качества</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">+340%</div>
                  <p className="text-xs text-blue-600">в среднем</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Активность по дням</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 sm:h-64 flex items-end justify-between gap-1 sm:gap-2">
                  {[3, 7, 2, 8, 5, 12, 4].map((height, index) => (
                    <div key={index} className="flex-1 bg-blue-200 rounded-t" style={{ height: `${height * 6}px` }} />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Пн</span>
                  <span>Вт</span>
                  <span>Ср</span>
                  <span>Чт</span>
                  <span>Пт</span>
                  <span>Сб</span>
                  <span>Вс</span>
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
