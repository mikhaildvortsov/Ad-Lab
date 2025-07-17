"use client"

export interface User {
  id: string
  name: string
  email: string
  image?: string
}

// Инициализация: очищаем застрявшие logout флаги при загрузке модуля
if (typeof window !== 'undefined') {
  // Запускаем очистку через небольшую задержку, чтобы позволить другим скриптам загрузиться
  setTimeout(() => {
    try {
      const logoutInProgress = window.localStorage.getItem('logout_in_progress')
      const lastLogoutTime = window.localStorage.getItem('last_logout_time')
      
      if (logoutInProgress === 'true') {
        if (lastLogoutTime) {
          const logoutTime = parseInt(lastLogoutTime)
          const timeSinceLogout = Date.now() - logoutTime
          // Очищаем если прошло больше 10 секунд с момента начала logout
          if (timeSinceLogout > 10000) {
            window.localStorage.removeItem('logout_in_progress')
            console.log('Cleared stuck logout_in_progress flag on module load')
          }
        } else {
          // Если нет времени - безусловно очищаем
          window.localStorage.removeItem('logout_in_progress')
          console.log('Cleared logout_in_progress flag without timestamp on module load')
        }
      }
    } catch (e) {
      console.warn('Could not clear logout flags on module load:', e)
    }
  }, 100)
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
        
        // НЕ восстанавливаем logout_in_progress - он должен очиститься
        // Восстанавливаем только время logout для временной блокировки  
        if (lastLogoutTime) window.localStorage.setItem('last_logout_time', lastLogoutTime)
        
        console.log('Local storage cleared, only logout time preserved')
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
    
    // ПРИНУДИТЕЛЬНАЯ очистка всех cookies на клиенте
    if (typeof window !== 'undefined') {
      try {
        console.log('Force clearing all cookies on client...')
        
        // Удаляем все cookies для текущего домена
        const cookies = document.cookie.split(';')
        for (let cookie of cookies) {
          const eqPos = cookie.indexOf('=')
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
          
          // Особенно важно удалить session cookie
          if (name === 'session' || name === 'logout_flag' || name.includes('auth') || name.includes('token')) {
            console.log('Force deleting cookie:', name)
            
            // Удаляем с разными вариантами настроек
            const deletionOptions = [
              '',
              '; path=/',
              '; path=/; domain=' + window.location.hostname,
              '; path=/; domain=.' + window.location.hostname,
              '; expires=Thu, 01 Jan 1970 00:00:00 GMT',
              '; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/',
              '; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + window.location.hostname
            ]
            
            for (const options of deletionOptions) {
              document.cookie = name + '=' + options
            }
          }
        }
        
        console.log('Client-side cookie clearing completed')
      } catch (e) {
        console.warn('Could not clear cookies on client:', e)
      }
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
    
    // Убираем флаг блокировки ВСЕГДА в конце процесса logout
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('logout_in_progress')
        console.log('Logout blocking flag removed after logout process')
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
        
        // НЕ восстанавливаем logout_in_progress - он должен очиститься при ошибке тоже
        // Восстанавливаем только время logout для временной блокировки
        if (lastLogoutTime) window.localStorage.setItem('last_logout_time', lastLogoutTime)
        
        console.log('Local storage cleared despite API error, only logout time preserved')
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

// Функция очистки застрявших logout флагов
export function clearStuckLogoutFlags(): void {
  if (typeof window === 'undefined') return
  
  try {
    const logoutInProgress = window.localStorage.getItem('logout_in_progress')
    const lastLogoutTime = window.localStorage.getItem('last_logout_time')
    
    if (logoutInProgress === 'true') {
      // Если флаг logout_in_progress установлен больше 30 секунд назад, очищаем его
      if (lastLogoutTime) {
        const logoutTime = parseInt(lastLogoutTime)
        const timeSinceLogout = Date.now() - logoutTime
        if (timeSinceLogout > 30000) { // 30 секунд
          console.log('Clearing stuck logout flags after', timeSinceLogout, 'ms')
          window.localStorage.removeItem('logout_in_progress')
          window.localStorage.removeItem('last_logout_time')
        }
      } else {
        // Если logout_in_progress установлен без времени, очищаем
        console.log('Clearing logout_in_progress flag without timestamp')
        window.localStorage.removeItem('logout_in_progress')
      }
    }
  } catch (e) {
    console.warn('Could not clear stuck logout flags:', e)
  }
}

// ЭКСТРЕННАЯ функция для полной очистки всех данных авторизации
export async function emergencyAuthClear(): Promise<void> {
  if (typeof window === 'undefined') return
  
  try {
    console.log('EMERGENCY: Clearing ALL auth data...')
    
    // 1. Полная очистка локального хранилища
    try {
      window.localStorage.clear()
      window.sessionStorage.clear()
      console.log('EMERGENCY: Local storage cleared')
    } catch (e) {
      console.warn('EMERGENCY: Could not clear local storage:', e)
    }
    
    // 2. Принудительная очистка всех cookies
    try {
      const cookies = document.cookie.split(';')
      for (let cookie of cookies) {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        
        console.log('EMERGENCY: Deleting cookie:', name)
        
        // Множественное удаление с разными настройками
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
    
    // 3. Вызов API logout для серверной очистки
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      console.log('EMERGENCY: Logout API called')
    } catch (e) {
      console.warn('EMERGENCY: Logout API failed:', e)
    }
    
    // 4. Устанавливаем долгосрочную блокировку
    try {
      window.localStorage.setItem('emergency_logout', 'true')
      window.localStorage.setItem('last_logout_time', Date.now().toString())
      console.log('EMERGENCY: Long-term auth blocking enabled')
    } catch (e) {
      console.warn('EMERGENCY: Could not set blocking flags:', e)
    }
    
    console.log('EMERGENCY: Auth clear completed')
    
    // 5. Принудительная перезагрузка страницы
    setTimeout(() => {
      window.location.href = '/'
    }, 1000)
    
  } catch (error) {
    console.error('EMERGENCY: Failed to clear auth data:', error)
    // В крайнем случае - просто перезагружаем страницу
    window.location.reload()
  }
}

// Функция проверки блокировки авторизации
export function isAuthBlocked(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    // Сначала очищаем застрявшие флаги
    clearStuckLogoutFlags()
    
    // ПРОВЕРЯЕМ флаг экстренной очистки
    const emergencyLogout = window.localStorage.getItem('emergency_logout')
    if (emergencyLogout === 'true') {
      console.log('Auth blocked: emergency logout flag detected')
      return true
    }
    
    const logoutInProgress = window.localStorage.getItem('logout_in_progress')
    const lastLogoutTime = window.localStorage.getItem('last_logout_time')
    
    if (logoutInProgress === 'true') {
      console.log('Auth blocked: logout in progress')
      return true
    }
    
    // УВЕЛИЧИВАЕМ блокировку авторизации до 60 секунд после logout
    if (lastLogoutTime) {
      const logoutTime = parseInt(lastLogoutTime)
      const timeSinceLogout = Date.now() - logoutTime
      if (timeSinceLogout < 60000) { // 60 секунд вместо 5
        console.log('Auth blocked: recent logout detected, time since logout:', timeSinceLogout, 'ms')
        return true
      } else {
        // Очищаем старый флаг (но НЕ очищаем emergency_logout)
        window.localStorage.removeItem('last_logout_time')
      }
    }
    
    return false
  } catch (e) {
    console.warn('Could not check auth blocking:', e)
    return false
  }
} 

// Функция для сброса экстренной блокировки (для случаев когда пользователь хочет снова войти)
export function clearEmergencyBlock(): void {
  if (typeof window === 'undefined') return
  
  try {
    window.localStorage.removeItem('emergency_logout')
    window.localStorage.removeItem('last_logout_time')
    window.localStorage.removeItem('logout_in_progress')
    console.log('Emergency auth block cleared - user can login again')
  } catch (e) {
    console.warn('Could not clear emergency block:', e)
  }
} 