import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user-service';
import { PasswordResetService } from '@/lib/services/password-reset-service';
import { EmailService } from '@/lib/services/email-service';

export async function POST(request: NextRequest) {
  console.log('🔥 Password reset API called')
  try {
    const { email, locale } = await request.json();
    console.log('📧 Reset requested for email:', email, 'locale:', locale)

    if (!email) {
      console.log('❌ No email provided in request')
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
    console.log('🔍 Looking up user by email:', email)
    const userResult = await UserService.getUserByEmail(email);
    console.log('👤 User lookup result:', { success: userResult.success, hasData: !!userResult.data })
    
    if (!userResult.success || !userResult.data) {
      console.log('⚠️ User not found, returning success for security')
      // Возвращаем успех даже если пользователь не найден (безопасность)
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a reset link has been sent.'
      });
    }

    const user = userResult.data;
    console.log('✅ User found:', user.id)

    // Создаем токен для сброса пароля
    console.log('🔑 Creating reset token for user:', user.id)
    const tokenResult = await PasswordResetService.createResetToken(user.id);
    if (!tokenResult.success) {
      console.error('❌ Failed to create reset token:', tokenResult.error)
      return NextResponse.json(
        { success: false, error: 'Failed to create reset token' },
        { status: 500 }
      );
    }

    // Формируем URL для сброса пароля
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/${locale || 'ru'}/auth/reset-password?token=${tokenResult.token}`;

    console.log('📧 Creating email for:', email)
    // Создаем email
    const emailData = EmailService.createPasswordResetEmail(resetUrl, locale || 'ru');

    console.log('📤 Attempting to send email...')
    // Отправляем email
    const emailResult = await EmailService.sendEmail({
      to: email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    });

    console.log('📧 Email send result:', emailResult)

    if (!emailResult.success) {
      console.error('❌ Failed to send reset email:', emailResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to send reset email' },
        { status: 500 }
      );
    }

    console.log(`✅ Password reset email sent to: ${email}`);
    console.log(`🔗 Reset URL: ${resetUrl}`);
    
    return NextResponse.json({
      success: true,
      message: 'Password reset link has been sent to your email.',
      // В режиме разработки возвращаем ссылку для удобства
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}