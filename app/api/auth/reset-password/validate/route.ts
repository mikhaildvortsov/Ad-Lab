import { NextRequest, NextResponse } from 'next/server';
import { PasswordResetService } from '@/lib/services/password-reset-service';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    console.log(`🔍 [VALIDATE API] Received request for token: ${token?.substring(0, 10)}...`);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Проверяем валидность токена
    const tokenValidation = await PasswordResetService.validateResetToken(token);
    
    if (!tokenValidation.success) {
      console.log(`❌ [VALIDATE API] Token validation failed: ${tokenValidation.error}`);
      return NextResponse.json(
        { success: false, error: tokenValidation.error },
        { status: 400 }
      );
    }

    console.log(`✅ [VALIDATE API] Token validation successful for ${token?.substring(0, 10)}...`);
    return NextResponse.json({
      success: true,
      message: 'Token is valid'
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}