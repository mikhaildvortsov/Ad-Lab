import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { UserService } from '@/lib/services/user-service';
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
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
    const userResult = await UserService.getUserByEmail(email);
    if (!userResult.success || !userResult.data) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    const user = userResult.data;
    if (!user.password_hash) {
      return NextResponse.json(
        { success: false, error: 'Неверный пароль', errorCode: 'INVALID_PASSWORD' },
        { status: 401 }
      );
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Неверный пароль', errorCode: 'INVALID_PASSWORD' },
        { status: 401 }
      );
    }
    await UserService.updateLastLogin(user.id);
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
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
