import { NextRequest, NextResponse } from 'next/server';
import { setSession } from '@/lib/session';

// In-memory storage for demo purposes
const registeredUsers = new Map<string, { email: string, password: string, name: string }>();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = registeredUsers.get(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session
    const sessionUser = {
      id: email, // Using email as ID for simplicity
      email: user.email,
      name: user.name,
      image: null
    };

    await setSession(sessionUser);

    return NextResponse.json({ 
      message: 'Login successful',
      user: sessionUser 
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 