"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
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
  const isProcessingRef = useRef(false)

  const handleCallback = useCallback(async () => {
    // Prevent multiple simultaneous processing
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    try {
      const errorParam = searchParams.get('error')
      
      if (errorParam) {
        setError('Ошибка авторизации: ' + errorParam)
        setTimeout(() => router.push('/auth?error=' + errorParam), 2000)
        return
      }

      // Проверяем сессию из cookies
      console.log('Callback: Checking session...')
      const session = await getClientSession()
      console.log('Callback: Session result:', session)
      
      if (session) {
        console.log('Callback: Session found, updating user:', session.user)
        updateUser(session.user)
        router.push('/dashboard')
      } else {
        console.log('Callback: No session found, retrying...')
        // Wait a bit and try again before showing error
        await new Promise(resolve => setTimeout(resolve, 1000))
        const retrySession = await getClientSession()
        console.log('Callback: Retry session result:', retrySession)
        
        if (retrySession) {
          console.log('Callback: Retry session found, updating user:', retrySession.user)
          updateUser(retrySession.user)
          router.push('/dashboard')
        } else {
          console.log('Callback: No session found after retry')
          setError('Не удалось получить данные пользователя.')
          setTimeout(() => router.push('/auth?error=no_session'), 2000)
        }
      }
    } catch (e) {
      setError('Ошибка обработки данных пользователя: ' + (e as Error).message)
      setTimeout(() => router.push('/auth?error=session_error'), 2000)
    } finally {
      isProcessingRef.current = false
    }
  }, [searchParams, router, updateUser])

  useEffect(() => {
    handleCallback()
  }, []) // Empty dependency array - only run once on mount

  if (error) {
    return <div style={{ color: 'red', padding: 32 }}>{error}</div>
  }
  return <div>Авторизация...</div>
} 