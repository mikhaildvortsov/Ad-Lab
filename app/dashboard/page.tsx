"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPreferredLocale } from '@/lib/locale-storage'
import { useAuth } from '@/lib/auth-context'

export default function DashboardRedirect() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [hasRedirected, setHasRedirected] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      console.log(`[${new Date().toISOString()}] DashboardRedirect:`, {
        user: user ? `${user.email}` : 'null',
        loading,
        hasRedirected,
        pathname: window.location.pathname
      })
    }
  }, [user, loading, hasRedirected, isClient])

  useEffect(() => {

    if (!isClient) return

    const logoutFlag = document.cookie
      .split(';')
      .find(cookie => cookie.trim().startsWith('logout_flag='))
      ?.split('=')[1]

    if (logoutFlag === 'true') {
      console.log('DashboardRedirect: Logout flag detected, redirecting to home page immediately')
      const preferredLocale = getPreferredLocale()
      router.replace(`/${preferredLocale}`)
      return
    }

    if (!loading && user && !hasRedirected) {
      const preferredLocale = getPreferredLocale()
      console.log(`DashboardRedirect: User found, redirecting to /${preferredLocale}/dashboard`)
      setHasRedirected(true)
      router.replace(`/${preferredLocale}/dashboard`)
      return
    }

    if (!loading && !user) {
      console.log('DashboardRedirect: No user found, redirecting to auth')
      const preferredLocale = getPreferredLocale()
      router.replace(`/${preferredLocale}/auth`)
      return
    }
  }, [isClient, loading, user, hasRedirected, router])

  useEffect(() => {
    if (!isClient) return

    const timeoutId = setTimeout(() => {
      if (loading || !user) {
        console.log('DashboardRedirect: Loading timeout, forcing redirect to auth')
        const preferredLocale = getPreferredLocale()
        router.replace(`/${preferredLocale}/auth`)
      }
    }, 15000) 

    return () => clearTimeout(timeoutId)
  }, [isClient, loading, user, router])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">
          {loading ? 'Loading user data...' : 
           user ? 'Redirecting to dashboard...' :
           'Waiting for authentication...'}
        </p>
      </div>
    </div>
  )
}
