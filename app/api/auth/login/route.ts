import { NextRequest, NextResponse } from 'next/server'
import { createSession, SessionData } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // Простая демо-авторизация (в реальном приложении здесь была бы проверка в базе данных)
    if (email && password) {
      // Создаем демо-пользователя
      const user = {
        id: Date.now().toString(), // Используем timestamp для уникальности
        name: email.split('@')[0], // Используем часть email как имя
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
      
      // Создаем защищенную сессию
      await createSession(sessionData)
      
      console.log('Email auth: created session for user:', user)
      
      return NextResponse.json({ 
        success: true, 
        user: user 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Email и пароль обязательны' 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Email auth error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера' 
    }, { status: 500 })
  }
} 