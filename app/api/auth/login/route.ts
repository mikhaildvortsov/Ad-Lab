import { NextRequest, NextResponse } from 'next/server'
import { createSession, SessionData } from '@/lib/session'

// Simple in-memory storage for demo purposes
// In production, this would be a database
const registeredUsers = new Map<string, { email: string, password: string, name: string }>()

export async function POST(request: NextRequest) {
  try {
    const { email, password, isRegistration } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email и пароль обязательны' 
      }, { status: 400 })
    }

    // Проверка валидности email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Некорректный формат email' 
      }, { status: 400 })
    }

    if (isRegistration) {
      // Регистрация нового пользователя
      if (registeredUsers.has(email)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Пользователь с таким email уже существует' 
        }, { status: 409 })
      }

      // Регистрируем нового пользователя
      const userName = email.split('@')[0]
      registeredUsers.set(email, { 
        email, 
        password, 
        name: userName 
      })

      // Создаем демо-пользователя
      const user = {
        id: Date.now().toString(),
        name: userName,
        email: email,
        image: null
      }
      
      // Создаем сессию с демо-токенами
      const sessionData: SessionData = {
        user,
        accessToken: 'demo-access-token-' + user.id,
        refreshToken: 'demo-refresh-token-' + user.id,
        expiresAt: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 дней
      }
      
      await createSession(sessionData)
      
      console.log('Email registration: created session for user:', user)
      
      return NextResponse.json({ 
        success: true, 
        user: user,
        message: 'Аккаунт успешно создан'
      })
    } else {
      // Авторизация существующего пользователя
      const existingUser = registeredUsers.get(email)
      
      if (!existingUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'Пользователь не найден' 
        }, { status: 404 })
      }

      if (existingUser.password !== password) {
        return NextResponse.json({ 
          success: false, 
          error: 'Неверный пароль' 
        }, { status: 401 })
      }

      // Создаем демо-пользователя из существующих данных
      const user = {
        id: Date.now().toString(),
        name: existingUser.name,
        email: existingUser.email,
        image: null
      }
      
      // Создаем сессию с демо-токенами
      const sessionData: SessionData = {
        user,
        accessToken: 'demo-access-token-' + user.id,
        refreshToken: 'demo-refresh-token-' + user.id,
        expiresAt: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 дней
      }
      
      await createSession(sessionData)
      
      console.log('Email login: created session for user:', user)
      
      return NextResponse.json({ 
        success: true, 
        user: user,
        message: 'Успешная авторизация'
      })
    }
  } catch (error) {
    console.error('Email auth error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера' 
    }, { status: 500 })
  }
} 