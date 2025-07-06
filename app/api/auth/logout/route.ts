import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    // Удаляем сессию
    await deleteSession()
    
    console.log('Logout endpoint called - session deleted')
    
    // Редиректим на главную страницу
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export async function POST(request: NextRequest) {
  try {
    // Удаляем сессию
    await deleteSession()
    
    console.log('Logout endpoint called - session deleted')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Logout failed' 
    }, { status: 500 })
  }
} 