import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user-service';
import { PasswordResetService } from '@/lib/services/password-reset-service';
import { EmailService } from '@/lib/services/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email, locale } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
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

    // Проверяем, существует ли пользователь
    const userResult = await UserService.getUserByEmail(email);
    
    if (!userResult.success || !userResult.data) {
      // Возвращаем успех даже если пользователь не найден (безопасность)
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a reset link has been sent.'
      });
    }

    const user = userResult.data;

    // Создаем токен для сброса пароля
    const tokenResult = await PasswordResetService.createResetToken(user.id);
    if (!tokenResult.success) {
      console.error('Failed to create reset token:', tokenResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to create reset token' },
        { status: 500 }
      );
    }

    // Формируем URL для сброса пароля
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/${locale || 'ru'}/auth/reset-password?token=${tokenResult.token}`;
    // Создаем email
    const emailData = EmailService.createPasswordResetEmail(resetUrl, locale || 'ru');

    // Отправляем email
    const emailResult = await EmailService.sendEmail({
      to: email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    });

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to send reset email' },
        { status: 500 }
      );
    }

    // Логируем успешную отправку для мониторинга
    console.log(`Password reset email sent to ${email}`);
    
    return NextResponse.json({
      success: true,
      message: 'Password reset link has been sent to your email.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}