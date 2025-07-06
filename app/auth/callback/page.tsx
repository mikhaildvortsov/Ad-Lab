"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from "@/lib/auth-context"
import { getClientSession } from "@/lib/client-session"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updateUser } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const errorParam = searchParams.get('error')
      
      if (errorParam) {
        setError('Ошибка авторизации: ' + errorParam)
        setTimeout(() => router.push('/auth?error=' + errorParam), 2000)
        return
      }

      try {
        // Проверяем сессию из cookies
        const session = await getClientSession()
        if (session) {
          updateUser(session.user)
          router.push('/dashboard')
        } else {
          setError('Не удалось получить данные пользователя.')
          setTimeout(() => router.push('/auth?error=no_session'), 2000)
        }
      } catch (e) {
        setError('Ошибка обработки данных пользователя: ' + (e as Error).message)
        setTimeout(() => router.push('/auth?error=session_error'), 2000)
      }
    }

    handleCallback()
  }, [searchParams, router, updateUser])

  if (error) {
    return <div style={{ color: 'red', padding: 32 }}>{error}</div>
  }
  return <div>Авторизация...</div>
} 