"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Sparkles, History, CreditCard, Settings, LogOut, FileText, Calendar, TrendingUp, User } from "lucide-react"
import { MobileNav } from "@/components/ui/mobile-nav"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface User {
  id: string
  name: string
  email: string
  image?: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
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
    // Проверяем localStorage при загрузке
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        localStorage.removeItem('user')
        router.push('/auth')
      }
    } else {
      // Если пользователь не авторизован, перенаправляем на страницу авторизации
      router.push('/auth')
    }
  }, [router])

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
    router.push('/api/auth/logout')
  }

  if (!user) {
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
              <Link href="/">
                <Button size="sm" className="w-full sm:w-auto">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Новый скрипт
                </Button>
              </Link>
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
                  <CardTitle className="text-base sm:text-lg text-blue-900">Базовый план</CardTitle>
                  <CardDescription className="text-blue-700 text-sm sm:text-base">
                    ₽299/месяц • Следующее списание: 15 февраля 2024
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div>✓ 10 улучшений в месяц (использовано: 2/10)</div>
                    <div>✓ История запросов</div>
                    <div>✓ Базовая аналитика</div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">Изменить план</Button>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">Отменить подписку</Button>
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
                        <div className="font-medium">Базовый план</div>
                        <div className="text-sm text-gray-500">15 января 2024</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₽299</div>
                        <Badge variant="secondary" className="text-xs">Оплачено</Badge>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="font-medium">Базовый план</div>
                        <div className="text-sm text-gray-500">15 декабря 2023</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₽299</div>
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
    </div>
  )
}
