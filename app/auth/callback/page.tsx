"use client"

import { useEffect } from 'react'
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
  
  useEffect(() => {
    const userParam = searchParams.get('user')
    if (userParam) {
      try {
        const user: User = JSON.parse(userParam)
        updateUser(user)
        localStorage.setItem('user', userParam)
        router.push('/dashboard')
      } catch (error) {
        router.push('/auth?error=invalid_user_data')
      }
    } else {
      router.push('/auth?error=no_user_data')
    }
  }, [searchParams, router, updateUser])

  return null
} 