"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getPreferredLocale } from '@/lib/locale-storage'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    const preferredLocale = getPreferredLocale()
    router.replace(`/${preferredLocale}/dashboard`)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
