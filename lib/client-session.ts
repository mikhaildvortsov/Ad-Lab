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
    // КРИТИЧЕСКИ ВАЖНО: проверяем блокировку авторизации перед запросом сессии
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
    
    // Еще одна проверка блокировки после получения ответа
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
    console.log('Starting logout process...')
    
    // КРИТИЧЕСКИ ВАЖНО: устанавливаем флаг блокировки авторизации В ПЕРВУЮ ОЧЕРЕДЬ
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('logout_in_progress', 'true')
        window.localStorage.setItem('last_logout_time', Date.now().toString())
        console.log('Logout blocking flags set in localStorage')
      } catch (e) {
        console.warn('Could not set logout flags:', e)
      }
    }
    
    // Принудительно очищаем локальные данные
    if (typeof window !== 'undefined') {
      try {
        // Сохраняем важные флаги
        const logoutInProgress = window.localStorage.getItem('logout_in_progress')
        const lastLogoutTime = window.localStorage.getItem('last_logout_time')
        
        window.localStorage.clear()
        window.sessionStorage.clear()
        
        // Восстанавливаем флаги блокировки
        if (logoutInProgress) window.localStorage.setItem('logout_in_progress', logoutInProgress)
        if (lastLogoutTime) window.localStorage.setItem('last_logout_time', lastLogoutTime)
        
        console.log('Local storage cleared, logout flags preserved')
      } catch (e) {
        console.warn('Could not clear browser storage:', e)
      }
    }
    
    // Вызываем API logout
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    
    if (response.ok) {
      console.log('Logout API call successful')
    } else {
      console.warn('Logout API returned non-ok status:', response.status)
    }
    
    // Очищаем Google OAuth сессию через скрытый iframe
    if (typeof window !== 'undefined') {
      try {
        console.log('Clearing Google OAuth session...')
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.src = 'https://accounts.google.com/logout'
        document.body.appendChild(iframe)
        
        // Удаляем iframe через 2 секунды
        setTimeout(() => {
          try {
            document.body.removeChild(iframe)
            console.log('Google OAuth session cleared')
          } catch (e) {
            console.warn('Could not remove Google logout iframe:', e)
          }
        }, 2000)
      } catch (e) {
        console.warn('Could not clear Google session:', e)
      }
    }
    
    // Даем время на обработку cookie на сервере
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Проверяем что сессия действительно удалена
    let sessionCleared = false
    for (let i = 0; i < 5; i++) {
      const sessionCheck = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store'
      })
      
      const sessionData = await sessionCheck.json()
      
      if (!sessionData.user) {
        sessionCleared = true
        console.log('Session successfully cleared after', i + 1, 'attempts')
        break
      }
      
      console.log('Session still exists, waiting and retrying...', i + 1)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Убираем флаг блокировки только после успешного logout
    if (sessionCleared && typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('logout_in_progress')
        console.log('Logout blocking flag removed after successful logout')
      } catch (e) {
        console.warn('Could not remove logout flag:', e)
      }
    }
    
    if (!sessionCleared) {
      console.warn('Session still exists after logout attempts, forcing page reload')
      // Принудительная перезагрузка как последний резерв
      if (typeof window !== 'undefined') {
        window.location.href = '/'
        return
      }
    }
    
    console.log('Logout completed successfully')
    
  } catch (error) {
    console.error('Failed to logout:', error)
    
    // Даже при ошибке API пытаемся очистить локальные данные
    if (typeof window !== 'undefined') {
      try {
        const logoutInProgress = window.localStorage.getItem('logout_in_progress')
        const lastLogoutTime = window.localStorage.getItem('last_logout_time')
        
        window.localStorage.clear()
        window.sessionStorage.clear()
        
        // Восстанавливаем флаги блокировки
        if (logoutInProgress) window.localStorage.setItem('logout_in_progress', logoutInProgress)
        if (lastLogoutTime) window.localStorage.setItem('last_logout_time', lastLogoutTime)
        
        console.log('Local storage cleared despite API error, logout flags preserved')
      } catch (e) {
        console.warn('Could not clear browser storage:', e)
      }
      
      // При ошибке принудительно перезагружаем страницу
      console.log('Forcing page reload due to logout error')
      window.location.href = '/'
      return
    }
    
    throw error
  }
}

// Функция проверки блокировки авторизации
export function isAuthBlocked(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const logoutInProgress = window.localStorage.getItem('logout_in_progress')
    const lastLogoutTime = window.localStorage.getItem('last_logout_time')
    
    if (logoutInProgress === 'true') {
      console.log('Auth blocked: logout in progress')
      return true
    }
    
    // Блокируем авторизацию в течение 10 секунд после logout
    if (lastLogoutTime) {
      const logoutTime = parseInt(lastLogoutTime)
      const timeSinceLogout = Date.now() - logoutTime
      if (timeSinceLogout < 10000) { // 10 секунд
        console.log('Auth blocked: recent logout detected, time since logout:', timeSinceLogout, 'ms')
        return true
      } else {
        // Очищаем старый флаг
        window.localStorage.removeItem('last_logout_time')
      }
    }
    
    return false
  } catch (e) {
    console.warn('Could not check auth blocking:', e)
    return false
  }
} 