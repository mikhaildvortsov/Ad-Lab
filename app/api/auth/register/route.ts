import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user-service';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Input validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Additional password requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' },
        { status: 400 }
      );
    }

    // Name validation
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUserResult = await UserService.userExistsByEmail(email);
    if (existingUserResult.success && existingUserResult.data) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const userResult = await UserService.createUser({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password: password, // Will be hashed in UserService
      provider: 'local',
      email_verified: false,
      preferred_language: 'ru'
    });

    if (!userResult.success || !userResult.data) {
      return NextResponse.json(
        { error: userResult.error || 'Failed to create user' },
        { status: 500 }
      );
    }

    const user = userResult.data;

    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        email_verified: user.email_verified
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 