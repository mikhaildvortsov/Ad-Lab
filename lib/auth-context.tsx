"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getClientSession, clientLogout, refreshToken, User } from '@/lib/client-session'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: () => void
  logout: () => void
  isAuthenticated: boolean
  updateUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const updateUser = useCallback((newUser: User | null) => {
    console.log('AuthContext: updateUser called with:', newUser)
    setUser(newUser)
  }, [])

  const login = useCallback(() => {
    // Редиректим на Google OAuth
    window.location.href = '/api/auth/google'
  }, [])

  const logout = useCallback(async () => {
    try {
      setUser(null)
      await clientLogout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Всегда сбрасываем loading состояние после logout
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Проверяем сессию при загрузке
    const checkSession = async () => {
      try {
        console.log('AuthContext: Checking session...')
        const session = await getClientSession()
        console.log('AuthContext: Session result:', session)
        if (session) {
          setUser(session.user)
          console.log('AuthContext: setting user from session:', session.user)
        } else {
          console.log('AuthContext: No session found')
        }
      } catch (error) {
        console.error('AuthContext: Error checking session:', error)
      } finally {
        console.log('AuthContext: Setting loading to false')
        setLoading(false)
      }
    }

    // Add timeout fallback to ensure loading state is cleared
    const timeoutId = setTimeout(() => {
      console.log('AuthContext: Timeout reached, forcing loading to false')
      setLoading(false)
    }, 5000) // 5 second timeout

    checkSession().finally(() => {
      clearTimeout(timeoutId)
    })

    return () => clearTimeout(timeoutId)
  }, [])

  // Автоматическое обновление токена каждые 5 минут
  useEffect(() => {
    if (!user) return

    const interval = setInterval(async () => {
      try {
        const success = await refreshToken()
        if (!success) {
          console.log('Token refresh failed, logging out')
          setUser(null)
          // Let middleware handle redirect instead of forcing it here
        }
      } catch (error) {
        console.error('Token refresh error:', error)
        // Let middleware handle redirect instead of forcing it here
        setUser(null)
      }
    }, 5 * 60 * 1000) // 5 минут

    return () => clearInterval(interval)
  }, [user])

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    updateUser
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