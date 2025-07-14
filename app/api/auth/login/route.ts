import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { UserService } from '@/lib/services/user-service';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Get user from database
    const userResult = await UserService.getUserByEmail(email);
    
    if (!userResult.success || !userResult.data) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = userResult.data;

    // Verify password against hash
    if (!user.password_hash) {
      return NextResponse.json(
        { success: false, error: 'Account not properly configured. Please contact support.' },
        { status: 500 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await UserService.updateLastLogin(user.id);

    // Create session
    const sessionData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatar_url || undefined
      },
      accessToken: 'local-auth-token',
      refreshToken: 'local-refresh-token',
      expiresAt: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
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