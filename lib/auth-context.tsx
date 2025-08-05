"use client"
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getClientSession, clientLogout, refreshToken, User } from '@/lib/client-session'
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
  const [isLoggingOut, setIsLoggingOut] = useState(false) 
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  const updateUser = useCallback((newUser: User | null) => {
    console.log('AuthContext: updateUser called with:', newUser)
    setUser(newUser)
    setError(null) 
    if (newUser && typeof window !== 'undefined') {
      document.cookie = 'logout_flag=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      console.log('AuthContext: Cleared logout_flag cookie for immediate access')
    }
  }, [])
  const login = useCallback(() => {
    console.log('AuthContext: login() called - redirecting to auth page')
    try {
      const currentPath = window.location.pathname
      const localeMatch = currentPath.match(/^\/([a-z]{2})(\/|$)/)
      const locale = localeMatch ? localeMatch[1] : ''
      const authPath = locale && locale !== 'en' ? `/${locale}/auth?force_login=true` : '/auth?force_login=true'
      console.log('AuthContext: redirecting to:', authPath)
      window.location.href = authPath
    } catch (error) {
      console.error('AuthContext: Login redirect error:', error)
      setError('Ошибка при переходе к авторизации')
    }
  }, [])
  const logout = useCallback(async () => {
    let shouldRedirect = false
    let redirectPath = '/'
    try {
      console.log('AuthContext: Starting logout...')
      setIsLoggingOut(true)
      setUser(null)
      setLoading(false) 
      setError(null)
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        const isOnDashboard = currentPath.includes('dashboard')
        if (isOnDashboard) {
          console.log('AuthContext: On dashboard, will redirect to home after cleanup')
          shouldRedirect = true
        }
      }
      await clientLogout()
      console.log('AuthContext: Logout completed successfully, user state cleared')
    } catch (error) {
      console.error('AuthContext: Logout error:', error)
      setError('Ошибка при выходе из системы')
      setUser(null)
      setLoading(false)
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        const isOnDashboard = currentPath.includes('dashboard')
        if (isOnDashboard) {
          console.log('AuthContext: On dashboard with error, will redirect to home')
          shouldRedirect = true
        }
      }
      console.log('AuthContext: Logout completed with error, user state cleared')
    } finally {
      setIsLoggingOut(false)
      if (shouldRedirect && typeof window !== 'undefined') {
        console.log('AuthContext: Performing redirect to:', redirectPath)
        window.location.href = redirectPath
      }
    }
  }, [])
  const [isCheckingSession, setIsCheckingSession] = useState(false)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let isMounted = true
    const logoutFlag = typeof document !== 'undefined' 
      ? document.cookie.split(';').find(cookie => cookie.trim().startsWith('logout_flag='))?.split('=')[1]
      : null
    if (logoutFlag === 'true') {
      console.log('AuthContext: Logout flag detected, not loading user')
      setUser(null)
      setLoading(false)
      return
    }
    if (isLoggingOut) {
      console.log('AuthContext: Skipping session check during logout')
      setLoading(false)
      return
    }
    if (isCheckingSession) {
      console.log('AuthContext: Session check already in progress, skipping')
      return
    }
    const checkSession = async () => {
      try {
        setIsCheckingSession(true)
        console.log('AuthContext: Checking session...') 
        const currentLogoutFlag = typeof document !== 'undefined' 
          ? document.cookie.split(';').find(cookie => cookie.trim().startsWith('logout_flag='))?.split('=')[1]
          : null
        if (currentLogoutFlag === 'true') {
          console.log('AuthContext: Logout flag detected during session check, aborting')
          if (isMounted) {
            setUser(null)
            setError(null)
            setLoading(false)
          }
          return
        }
        const sessionData = await getClientSession()
        if (isMounted) {
          if (sessionData) {
            console.log('AuthContext: Session found:', sessionData.user.email)
            setUser(sessionData.user)
            setError(null)
          } else {
            console.log('AuthContext: No session found')
            setUser(null)
            setError(null)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('AuthContext: Session check failed:', error)
        if (isMounted) {
          setUser(null)
          setError('Ошибка при проверке сессии')
          setLoading(false)
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false)
        }
      }
    }
    const timeoutMs = process.env.NODE_ENV === 'production' ? 10000 : 5000
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log('AuthContext: Timeout reached, forcing loading to false')
        setLoading(false)
        setIsCheckingSession(false)
        if (!user) {
          setError('Время ожидания авторизации истекло. Попробуйте обновить страницу.')
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
  }, []) 
  useEffect(() => {
    if (typeof window === 'undefined') return
    const checkLogoutFlag = () => {
      const logoutFlag = document.cookie
        .split(';')
        .find(cookie => cookie.trim().startsWith('logout_flag='))
        ?.split('=')[1]
      if (logoutFlag === 'true' && user) {
        console.log('AuthContext: Logout flag detected in real-time, clearing user')
        setUser(null)
        setError(null)
      }
    }
    const interval = setInterval(checkLogoutFlag, 500)
    return () => clearInterval(interval)
  }, [user]) 
  useEffect(() => {
    if (!user) return
    const refreshInterval = process.env.NODE_ENV === 'production' 
      ? 60 * 60 * 1000   
      : 15 * 60 * 1000   
    const interval = setInterval(async () => {
      try {
        const success = await refreshToken()
        if (!success) {
          console.log('Token refresh failed, logging out')
          setUser(null)
          setError('Сессия истекла, требуется повторная авторизация')
        }
      } catch (error) {
        console.error('Token refresh error:', error)
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
