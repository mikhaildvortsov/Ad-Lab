import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Редиректим на главную страницу
  return NextResponse.redirect(new URL('/', request.url))
} 