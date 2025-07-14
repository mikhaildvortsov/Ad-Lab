"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPreferredLocale } from '@/lib/locale-storage'
import { useAuth } from '@/lib/auth-context'

export default function DashboardRedirect() {
  const router = useRouter()
  const { loading } = useAuth()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Wait for auth loading to complete and avoid multiple redirects
    if (!loading && !hasRedirected) {
      const preferredLocale = getPreferredLocale()
      setHasRedirected(true)
      router.replace(`/${preferredLocale}/dashboard`)
    }
  }, [loading, hasRedirected, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
