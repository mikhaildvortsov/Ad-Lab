import { NextRequest, NextResponse } from 'next/server';
import { PasswordResetService } from '@/lib/services/password-reset-service';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();
    console.log(`🔍 [VERIFY CODE API] Verifying code for email: ${email}`);

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and code are required' },
        { status: 400 }
      );
    }

    if (code.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Код должен содержать 6 цифр' },
        { status: 400 }
      );
    }

    // Проверяем валидность кода (но НЕ отмечаем как использованный)
    const codeValidation = await PasswordResetService.validateResetCode(email, code);
    if (!codeValidation.success) {
      console.log(`❌ [VERIFY CODE API] Code validation failed: ${codeValidation.error}`);
      return NextResponse.json(
        { success: false, error: codeValidation.error },
        { status: 400 }
      );
    }

    console.log(`✅ [VERIFY CODE API] Code verification successful for ${email}`);
    return NextResponse.json({
      success: true,
      message: 'Code is valid'
    });

  } catch (error) {
    console.error('Code verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
