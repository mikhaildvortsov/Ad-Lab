"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, CheckCircle, Loader2 } from "lucide-react"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface User {
  id: string
  name: string
  email: string
  image?: string
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const userParam = searchParams.get('user')
    
    if (userParam) {
      try {
        const user: User = JSON.parse(userParam)
        
        // Сохраняем пользователя в localStorage
        localStorage.setItem('user', JSON.stringify(user))
        
        // Небольшая задержка для показа успешного состояния
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
        
      } catch (error) {
        console.error('Error parsing user data:', error)
        router.push('/auth?error=invalid_user_data')
      }
    } else {
      // Если нет данных пользователя, редиректим на страницу авторизации
      router.push('/auth?error=no_user_data')
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm sm:max-w-md">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <span className="text-xl sm:text-2xl font-bold text-gray-900">Ad Lab</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl">
            Авторизация успешна!
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Выполняется вход в систему...
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4 px-4 sm:px-6 pb-6">
          <div className="flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-500 mr-3" />
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
          
          <p className="text-sm text-gray-600">
            Перенаправление на дашборд...
          </p>
          
          <Button 
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="w-full"
          >
            Перейти вручную
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 