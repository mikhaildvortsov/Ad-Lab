import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user-service';
import { createSession } from '@/lib/session';
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json(
        { success: false, error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' },
        { status: 400 }
      );
    }
    if (name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Name must be at least 2 characters long' },
        { status: 400 }
      );
    }
    const existingUserResult = await UserService.userExistsByEmail(email);
    if (existingUserResult.success && existingUserResult.data) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Пользователь с таким email уже зарегистрирован',
          errorCode: 'USER_EXISTS',
          suggestion: 'Попробуйте войти в аккаунт вместо регистрации'
        },
        { status: 409 }
      );
    }
    const userResult = await UserService.createUser({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password: password, 
      provider: 'local',
      email_verified: false,
      preferred_language: 'ru'
    });
    if (!userResult.success || !userResult.data) {
      return NextResponse.json(
        { success: false, error: userResult.error || 'Failed to create user' },
        { status: 500 }
      );
    }
    const user = userResult.data;
    const sessionData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatar_url || undefined
      },
      accessToken: 'local-auth-token',
      refreshToken: 'local-refresh-token',
      expiresAt: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) 
    };
    await createSession(sessionData);
    return NextResponse.json({
      success: true,
      message: 'User registered successfully and logged in',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        email_verified: user.email_verified,
        image: user.avatar_url
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
