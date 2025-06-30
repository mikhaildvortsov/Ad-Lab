import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // Простая демо-авторизация (в реальном приложении здесь была бы проверка в базе данных)
    if (email && password) {
      // Создаем демо-пользователя
      const user = {
        id: '1',
        name: email.split('@')[0], // Используем часть email как имя
        email: email,
        image: null
      }
      
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
    return NextResponse.json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера' 
    }, { status: 500 })
  }
} 