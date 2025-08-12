import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/email-service';

export async function GET(request: NextRequest) {
  console.log('🧪 Resend Test API called');
  
  try {
    // Тестируем подключение
    const connectionTest = await EmailService.testResendConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: 'Resend connection failed',
        details: connectionTest.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
              message: 'Resend connection successful',
      config: {
        apiKey: process.env.RESEND_API_KEY ? '***' + process.env.RESEND_API_KEY.slice(-10) : 'not set',
        fromName: process.env.RESEND_FROM_NAME,
        fromEmail: process.env.RESEND_FROM_EMAIL,
        sendRealEmails: process.env.SEND_REAL_EMAILS
      }
    });

  } catch (error) {
    console.error('Resend test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('📧 Test email send API called');
  
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 });
    }

    // Отправляем тестовое письмо
    const emailResult = await EmailService.sendEmail({
      to: email,
      subject: '✅ Test Email from Ad Lab',
      html: `
        <h1>🎉 Resend Test Successful!</h1>
        <p>Если вы получили это письмо, значит настройка Resend API работает корректно.</p>
        <p><strong>Время отправки:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p><em>Ad Lab Team</em></p>
      `,
      text: `
Resend Test Successful!

Если вы получили это письмо, значит настройка Resend API работает корректно.

Время отправки: ${new Date().toLocaleString()}

Ad Lab Team
      `
    });

    if (!emailResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to send test email',
        details: emailResult.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully'
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}