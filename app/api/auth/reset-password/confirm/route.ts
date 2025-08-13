import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user-service';
import { PasswordResetService } from '@/lib/services/password-reset-service';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password, locale } = await request.json();
    console.log(`🔍 [CONFIRM API] Received password reset request for token: ${token?.substring(0, 10)}...`);

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
      console.log(`❌ [CONFIRM API] Token validation failed: ${tokenValidation.error}`);
      return NextResponse.json(
        { success: false, error: tokenValidation.error },
        { status: 400 }
      );
    }

    const userId = tokenValidation.userId!;

    // Хешируем новый пароль
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // КРИТИЧЕСКИ ВАЖНО: Сначала обновляем пароль, только потом помечаем токен как использованный
    const updateResult = await UserService.updateUserPassword(userId, passwordHash);
    if (!updateResult.success) {
      console.error(`❌ [CONFIRM API] Failed to update password: ${updateResult.error}`);
      return NextResponse.json(
        { success: false, error: 'Не удалось обновить пароль. Попробуйте снова.' },
        { status: 500 }
      );
    }

    // Только после успешной смены пароля отмечаем токен как использованный
    const markResult = await PasswordResetService.markTokenAsUsed(token);
    if (!markResult.success) {
      console.error(`⚠️ [CONFIRM API] Failed to mark token as used: ${markResult.error}`);
      // НЕ возвращаем ошибку, так как пароль уже изменен успешно
    }

    // Очищаем истекшие токены
    await PasswordResetService.cleanupExpiredTokens();

    console.log(`✅ [CONFIRM API] Password successfully reset for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Пароль успешно изменен. Теперь вы можете войти с новым паролем.'
    });

  } catch (error) {
    console.error('Password reset confirmation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}