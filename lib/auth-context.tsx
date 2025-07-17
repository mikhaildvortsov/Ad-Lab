"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getClientSession, clientLogout, refreshToken, User, isAuthBlocked, clearStuckLogoutFlags } from '@/lib/client-session'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: () => void
  logout: () => void
  isAuthenticated: boolean
  updateUser: (user: User | null) => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false) // Флаг процесса logout

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const updateUser = useCallback((newUser: User | null) => {
    console.log('AuthContext: updateUser called with:', newUser)
    setUser(newUser)
    setError(null) // Clear any errors when user is updated
  }, [])

  const login = useCallback(() => {
    console.log('AuthContext: login() called - redirecting to auth page')
    
    try {
      // Переадресация на страницу авторизации с множественными вариантами входа
      window.location.href = '/auth'
    } catch (error) {
      console.error('AuthContext: Login redirect error:', error)
      setError('Ошибка при переходе к авторизации')
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      console.log('AuthContext: Starting logout...')
      
      // Устанавливаем флаг logout процесса
      setIsLoggingOut(true)
      
      // Сначала очищаем локальное состояние
      setUser(null)
      setLoading(true)
      setError(null)
      
      // Вызываем улучшенный clientLogout, который сам проверит успешность
      await clientLogout()
      
      console.log('AuthContext: Logout completed successfully')
      
      // Добавляем задержку чтобы logout flag успел обработаться на сервере
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error('AuthContext: Logout error:', error)
      setError('Ошибка при выходе из системы')
      
      // При ошибке все равно очищаем состояние
      setUser(null)
    } finally {
      // Всегда сбрасываем loading состояние и флаг logout
      setLoading(false)
      setIsLoggingOut(false)
    }
  }, [])

  // Добавляем состояние для отслеживания текущей проверки сессии
  const [isCheckingSession, setIsCheckingSession] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let isMounted = true

    // Очищаем застрявшие logout флаги при инициализации
    clearStuckLogoutFlags()

    // КРИТИЧЕСКИ ВАЖНО: проверяем блокировку авторизации в первую очередь
    if (isAuthBlocked()) {
      console.log('AuthContext: Auth blocked by logout flags, skipping session check')
      setUser(null)
      setLoading(false)
      return
    }

    // Не проверяем сессию во время logout процесса
    if (isLoggingOut) {
      console.log('AuthContext: Skipping session check during logout')
      setLoading(false)
      return
    }

    // ИСПРАВЛЕНИЕ: предотвращаем множественные одновременные проверки сессии
    if (isCheckingSession) {
      console.log('AuthContext: Session check already in progress, skipping')
      return
    }

    // Проверяем сессию при загрузке
    const checkSession = async () => {
      try {
        setIsCheckingSession(true)
        console.log('AuthContext: Checking session...')
        
        // Двойная проверка блокировки перед сетевым запросом
        if (isAuthBlocked()) {
          console.log('AuthContext: Auth blocked before session check, aborting')
          if (isMounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }
        
        const session = await getClientSession()
        console.log('AuthContext: Session result:', session)
        
        if (!isMounted) return // Component unmounted

        if (session) {
          setUser(session.user)
          setError(null)
          console.log('AuthContext: setting user from session:', session.user)
        } else {
          console.log('AuthContext: No session found')
          setUser(null)
          // Don't set error here - no session might be normal
        }
      } catch (error) {
        console.error('AuthContext: Error checking session:', error)
        if (!isMounted) return
        
        setUser(null)
        setError('Ошибка проверки авторизации')
      } finally {
        if (isMounted) {
          console.log('AuthContext: Setting loading to false')
          setLoading(false)
          setIsCheckingSession(false)
        }
      }
    }

    // Add timeout fallback to ensure loading state is cleared
    // Shorter timeout for development, longer for production
    const timeoutMs = process.env.NODE_ENV === 'production' ? 10000 : 3000
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log('AuthContext: Timeout reached, forcing loading to false')
        setLoading(false)
        setIsCheckingSession(false)
        if (!user) {
          setError('Время ожидания авторизации истекло')
        }
      }
    }, timeoutMs)

    checkSession().finally(() => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    })

    return () => {
      isMounted = false
      setIsCheckingSession(false)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isLoggingOut]) // Убираем isCheckingSession из зависимостей - он используется только внутри эффекта

  // Автоматическое обновление токена
  // ИСПРАВЛЕНИЕ: увеличиваем интервалы для предотвращения частых запросов
  useEffect(() => {
    if (!user) return

    const refreshInterval = process.env.NODE_ENV === 'production' 
      ? 60 * 60 * 1000   // 1 час для продакшена
      : 15 * 60 * 1000   // 15 минут для разработки (было 5)

    const interval = setInterval(async () => {
      try {
        const success = await refreshToken()
        if (!success) {
          console.log('Token refresh failed, logging out')
          setUser(null)
          setError('Сессия истекла, требуется повторная авторизация')
          // Let middleware handle redirect instead of forcing it here
        }
      } catch (error) {
        console.error('Token refresh error:', error)
        // Let middleware handle redirect instead of forcing it here
        setUser(null)
        setError('Ошибка обновления токена')
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [user])

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
    updateUser,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 