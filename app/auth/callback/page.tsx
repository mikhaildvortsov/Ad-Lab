"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from "@/lib/auth-context"

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
  const { updateUser } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userParam = searchParams.get('user')
    if (userParam) {
      try {
        const decoded = decodeURIComponent(userParam)
        const user: User = JSON.parse(decoded)
        updateUser(user)
        localStorage.setItem('user', JSON.stringify(user))
        router.push('/dashboard')
      } catch (e) {
        setError('Ошибка обработки данных пользователя: ' + (e as Error).message)
        setTimeout(() => router.push('/auth?error=invalid_user_data'), 2000)
      }
    } else {
      setError('Не удалось получить данные пользователя.')
      setTimeout(() => router.push('/auth?error=no_user_data'), 2000)
    }
  }, [searchParams, router, updateUser])

  if (error) {
    return <div style={{ color: 'red', padding: 32 }}>{error}</div>
  }
  return <div>Авторизация...</div>
} 