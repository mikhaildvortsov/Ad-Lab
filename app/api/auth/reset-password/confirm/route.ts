import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user-service';
import { PasswordResetService } from '@/lib/services/password-reset-service';
import { getTranslation } from '@/lib/translations';
import type { Locale } from '@/lib/i18n';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, code, password, locale } = await request.json();
    console.log(`🔍 [CONFIRM API] Received password reset request for email: ${email}, code: ${code}`);

    if (!email || !code || !password) {
      return NextResponse.json(
        { success: false, error: 'Email, code and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Проверяем валидность кода
    const codeValidation = await PasswordResetService.validateResetCode(email, code);
    if (!codeValidation.success) {
      console.log(`❌ [CONFIRM API] Code validation failed: ${codeValidation.error}`);
      return NextResponse.json(
        { success: false, error: codeValidation.error },
        { status: 400 }
      );
    }

    // Получаем пользователя по email
    const userResult = await UserService.getUserByEmail(email);
    if (!userResult.success || !userResult.data) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = userResult.data.id;
    const user = userResult.data;

    // Проверяем, не совпадает ли новый пароль со старым
    if (user.password_hash) {
      const isSamePassword = await bcrypt.compare(password, user.password_hash);
      if (isSamePassword) {
        const errorMessage = getTranslation(locale as Locale || 'ru', 'auth.errors.samePassword');
        return NextResponse.json(
          { success: false, error: errorMessage },
          { status: 400 }
        );
      }
    }

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

    // Только после успешной смены пароля отмечаем код как использованный
    const markResult = await PasswordResetService.markCodeAsUsed(email, code);
    if (!markResult.success) {
      console.error(`⚠️ [CONFIRM API] Failed to mark code as used: ${markResult.error}`);
      // НЕ возвращаем ошибку, так как пароль уже изменен успешно
    }

    // Очищаем истекшие коды
    await PasswordResetService.cleanupExpiredCodes();

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