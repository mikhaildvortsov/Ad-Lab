import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Редиректим на главную страницу с параметром logout
  const redirectUrl = new URL('/', request.url)
  redirectUrl.searchParams.set('logout', 'true')
  
  return NextResponse.redirect(redirectUrl.toString())
} 