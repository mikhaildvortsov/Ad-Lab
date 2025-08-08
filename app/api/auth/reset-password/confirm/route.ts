import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user-service';
import { PasswordResetService } from '@/lib/services/password-reset-service';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password, locale } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Проверяем валидность токена
    const tokenValidation = await PasswordResetService.validateResetToken(token);
    if (!tokenValidation.success) {
      return NextResponse.json(
        { success: false, error: tokenValidation.error },
        { status: 400 }
      );
    }

    const userId = tokenValidation.userId!;

    // Хешируем новый пароль
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Обновляем пароль пользователя
    const updateResult = await UserService.updateUserPassword(userId, passwordHash);
    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Отмечаем токен как использованный
    await PasswordResetService.markTokenAsUsed(token);

    // Очищаем истекшие токены
    await PasswordResetService.cleanupExpiredTokens();

    console.log(`Password successfully reset for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully reset.'
    });

  } catch (error) {
    console.error('Password reset confirmation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}