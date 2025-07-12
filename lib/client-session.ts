"use client"

export interface User {
  id: string
  name: string
  email: string
  image?: string
}

// Client-side session helper
export async function getClientSession(): Promise<{ user: User } | null> {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.user ? { user: data.user } : null
  } catch (error) {
    console.error('Failed to get client session:', error)
    return null
  }
}

// Refresh token on client side
export async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    })
    
    return response.ok
  } catch (error) {
    console.error('Failed to refresh token:', error)
    return false
  }
}

// Logout on client side
export async function clientLogout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    console.log('Logout API call successful')
  } catch (error) {
    console.error('Failed to logout:', error)
    throw error
  }
} 