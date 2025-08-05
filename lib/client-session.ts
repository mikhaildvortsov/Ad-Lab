"use client"
export interface User {
  id: string
  name: string
  email: string
  image?: string
}
export async function getClientSession(): Promise<{ user: User } | null> {
  try {
    if (isAuthBlocked()) {
      console.log('getClientSession: Auth blocked, returning null')
      return null
    }
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
      cache: 'no-store'
    })
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    if (isAuthBlocked() && data.user) {
      console.log('getClientSession: Auth blocked after response, ignoring user data')
      return null
    }
    return data.user ? { user: data.user } : null
  } catch (error) {
    console.error('Failed to get client session:', error)
    return null
  }
}
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
export async function clientLogout(): Promise<void> {
  try {
    console.log('Starting logout process...')
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.clear()
        window.sessionStorage.clear()
        console.log('Local storage and session storage cleared')
      } catch (e) {
        console.warn('Could not clear browser storage:', e)
      }
    }
    console.log('Calling logout API...')
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    if (response.ok) {
      console.log('Logout API call successful - server should have set logout_flag')
      let logoutFlagSet = false
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 200)) 
        const logoutFlag = document.cookie
          .split(';')
          .find(cookie => cookie.trim().startsWith('logout_flag='))
          ?.split('=')[1]
        if (logoutFlag === 'true') {
          console.log('Logout flag confirmed after', (i + 1) * 200, 'ms')
          logoutFlagSet = true
          break
        }
      }
      if (!logoutFlagSet) {
        console.warn('Logout flag not detected after 1 second - proceeding anyway')
      }
    } else {
      console.warn('Logout API returned non-ok status:', response.status)
    }
    if (typeof window !== 'undefined') {
      try {
        console.log('Force clearing session cookies on client...')
        const cookies = document.cookie.split(';')
        for (let cookie of cookies) {
          const eqPos = cookie.indexOf('=')
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
          if (name === 'session' || (name.includes('auth') || name.includes('token')) && name !== 'logout_flag') {
            console.log('Force deleting cookie:', name)
            const expireDate = 'expires=Thu, 01 Jan 1970 00:00:00 GMT'
            document.cookie = `${name}=; ${expireDate}; path=/`
            document.cookie = `${name}=; ${expireDate}; path=/; domain=${window.location.hostname}`
            document.cookie = `${name}=; ${expireDate}; path=/; domain=.${window.location.hostname}`
          }
        }
        console.log('Client cookie cleanup completed')
      } catch (e) {
        console.warn('Could not clear cookies on client:', e)
      }
    }
    console.log('Client logout completed successfully')
  } catch (error) {
    console.error('Client logout failed:', error)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.clear()
        window.sessionStorage.clear()
        console.log('Emergency cleanup completed')
      } catch (e) {
        console.warn('Emergency cleanup failed:', e)
      }
    }
    throw error
  }
}
export function clearStuckLogoutFlags(): void {
  console.log('clearStuckLogoutFlags: No longer needed - using cookie-based blocking')
}
export async function emergencyAuthClear(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    console.log('EMERGENCY: Clearing ALL auth data...')
    try {
      window.localStorage.clear()
      window.sessionStorage.clear()
      console.log('EMERGENCY: Local storage cleared')
    } catch (e) {
      console.warn('EMERGENCY: Could not clear local storage:', e)
    }
    try {
      const cookies = document.cookie.split(';')
      for (let cookie of cookies) {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        console.log('EMERGENCY: Deleting cookie:', name)
        const deletionOptions = [
          '',
          '; path=/',
          '; path=/; domain=' + window.location.hostname,
          '; path=/; domain=.' + window.location.hostname,
          '; expires=Thu, 01 Jan 1970 00:00:00 GMT',
          '; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/',
          '; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + window.location.hostname,
          '; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.' + window.location.hostname
        ]
        for (const options of deletionOptions) {
          document.cookie = name + '=' + options
        }
      }
      console.log('EMERGENCY: All cookies cleared')
    } catch (e) {
      console.warn('EMERGENCY: Could not clear cookies:', e)
    }
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      console.log('EMERGENCY: Logout API called')
    } catch (e) {
      console.warn('EMERGENCY: Logout API failed:', e)
    }
    try {
      window.localStorage.setItem('emergency_logout', 'true')
      window.localStorage.setItem('last_logout_time', Date.now().toString())
      console.log('EMERGENCY: Long-term auth blocking enabled')
    } catch (e) {
      console.warn('EMERGENCY: Could not set blocking flags:', e)
    }
    console.log('EMERGENCY: Auth clear completed')
    setTimeout(() => {
      window.location.href = '/'
    }, 1000)
  } catch (error) {
    console.error('EMERGENCY: Failed to clear auth data:', error)
    window.location.reload()
  }
}
export function isAuthBlocked(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const logoutFlag = document.cookie
      .split(';')
      .find(cookie => cookie.trim().startsWith('logout_flag='))
      ?.split('=')[1]
    if (logoutFlag === 'true') {
      console.log('Auth blocked: logout_flag cookie detected')
      return true
    }
    return false
  } catch (e) {
    console.warn('Could not check auth blocking:', e)
    return false
  }
} 
export function clearEmergencyBlock(): void {
  console.log('clearEmergencyBlock: No longer needed - using cookie-based blocking')
}
