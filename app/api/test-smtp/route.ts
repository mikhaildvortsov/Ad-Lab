import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/email-service';

export async function GET(request: NextRequest) {
  console.log('🧪 SendGrid Test API called');
  
  try {
    // Тестируем подключение
    const connectionTest = await EmailService.testSendGridConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: 'SendGrid connection failed',
        details: connectionTest.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'SendGrid connection successful',
      config: {
        apiKey: process.env.SENDGRID_API_KEY ? '***' + process.env.SENDGRID_API_KEY.slice(-10) : 'not set',
        fromName: process.env.SENDGRID_FROM_NAME,
        fromEmail: process.env.SENDGRID_FROM_EMAIL,
        sendRealEmails: process.env.SEND_REAL_EMAILS
      }
    });

  } catch (error) {
    console.error('SendGrid test error:', error);
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
        <h1>🎉 SendGrid Test Successful!</h1>
        <p>Если вы получили это письмо, значит настройка SendGrid API работает корректно.</p>
        <p><strong>Время отправки:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p><em>Ad Lab Team</em></p>
      `,
      text: `
SendGrid Test Successful!

Если вы получили это письмо, значит настройка SendGrid API работает корректно.

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