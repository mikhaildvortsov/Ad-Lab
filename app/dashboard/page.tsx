"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPreferredLocale } from '@/lib/locale-storage'
import { useAuth } from '@/lib/auth-context'

export default function DashboardRedirect() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [hasRedirected, setHasRedirected] = useState(false)
  const [hasClearedFlags, setHasClearedFlags] = useState(false)
  const [isInitialCheck, setIsInitialCheck] = useState(true)

  console.log(`[${new Date().toISOString()}] DashboardRedirect:`, {
    user: user ? `${user.email}` : 'null',
    loading,
    hasRedirected,
    hasClearedFlags,
    isInitialCheck,
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'server'
  })

  useEffect(() => {
    // Отмечаем что начальная проверка завершена после первого рендера
    const timer = setTimeout(() => {
      setIsInitialCheck(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Не выполняем логику до завершения начальной проверки
    if (isInitialCheck) return

    // Проверяем флаг logout - если он установлен, НЕ очищаем флаги!
    if (typeof window !== 'undefined') {
      // Проверяем logout_flag из cookie (это серверный флаг)
      const logoutFlag = document.cookie.split(';').find(cookie => cookie.trim().startsWith('logout_flag='))?.split('=')[1]
      
      // Если есть серверный logout флаг, просто перенаправляем на auth без очистки
      if (logoutFlag === 'true') {
        console.log('DashboardRedirect: Logout flag detected, redirecting to auth without clearing flags')
        router.replace('/auth')
        return
      }
    }
    
    // Проверяем был ли недавний logout (последние 5 минут)
    const recentLogout = typeof window !== 'undefined' && 
      window.localStorage.getItem('last_logout_time')
    
    if (recentLogout) {
      const logoutTime = parseInt(recentLogout)
      const now = Date.now()
      const fiveMinutes = 5 * 60 * 1000
      
      if (now - logoutTime < fiveMinutes) {
        console.log('DashboardRedirect: Recent logout detected, redirecting to auth')
        router.replace('/auth')
        return
      }
    }
    
    // Check if we already tried to clear flags recently (prevent infinite reloads)
    const recentlyClearedFlags = typeof window !== 'undefined' && 
      window.sessionStorage.getItem('dashboard_flags_cleared')
    
    // ИСПРАВЛЕННАЯ ЛОГИКА: четкие условия без пересечений
    if (!loading && !user && !hasClearedFlags && !recentlyClearedFlags && !recentLogout) {
      console.log('DashboardRedirect: Clearing stuck logout flags (no recent logout detected)')
      
      // Clear potentially stuck auth blocking flags
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem('logout_in_progress')
          // НЕ удаляем last_logout_time - он нужен для проверки выше
          window.localStorage.removeItem('emergency_logout')
          
          // Clear logout_flag cookie (только если это старый застрявший флаг)
          document.cookie = 'logout_flag=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
          
          // Mark that we cleared flags (expires after 30 seconds)
          window.sessionStorage.setItem('dashboard_flags_cleared', Date.now().toString())
          setTimeout(() => {
            window.sessionStorage.removeItem('dashboard_flags_cleared')
          }, 30000)
          
          console.log('DashboardRedirect: Cleared stuck logout flags')
          setHasClearedFlags(true)
          
          // Force page reload to re-initialize AuthContext without blocking flags
          setTimeout(() => {
            window.location.reload()
          }, 100)
          
        } catch (e) {
          console.warn('DashboardRedirect: Could not clear logout flags:', e)
        }
      }
    } else if (!loading && user && !hasRedirected) {
      // Only redirect if we have a user and haven't redirected yet
      const preferredLocale = getPreferredLocale()
      console.log(`DashboardRedirect: Redirecting to /${preferredLocale}/dashboard`)
      setHasRedirected(true)
      router.replace(`/${preferredLocale}/dashboard`)
    } else if (!loading && !user && (recentlyClearedFlags || recentLogout || hasClearedFlags)) {
      // Если нет пользователя после всех попыток - перенаправляем на auth  
      console.log('DashboardRedirect: No user after processing, redirecting to auth')
      router.replace('/auth')
    }
  }, [loading, user, hasRedirected, hasClearedFlags, router, isInitialCheck])

  // Показать timeout ошибку если загрузка длится слишком долго
  useEffect(() => {
    if (!isInitialCheck) {
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.log('DashboardRedirect: Loading timeout, forcing redirect to auth')
          router.replace('/auth')
        }
      }, 10000) // 10 секунд таймаут

      return () => clearTimeout(timeoutId)
    }
  }, [loading, router, isInitialCheck])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">
          {isInitialCheck ? 'Initializing...' :
           loading ? 'Loading...' : 
           (!user && !hasClearedFlags) ? 'Checking session...' :
           (!user && hasClearedFlags) ? 'Reloading...' :
           'Redirecting...'}
        </p>
      </div>
    </div>
  )
}

