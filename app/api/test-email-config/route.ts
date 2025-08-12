import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Проверяем переменные окружения для email
    const config = {
      hasResendApiKey: !!process.env.RESEND_API_KEY,
      hasFromEmail: !!process.env.RESEND_FROM_EMAIL,
      hasFromName: !!process.env.RESEND_FROM_NAME,
      nodeEnv: process.env.NODE_ENV,
      sendRealEmails: process.env.SEND_REAL_EMAILS,
      resendApiKeyFormat: process.env.RESEND_API_KEY ? 
        (process.env.RESEND_API_KEY.startsWith('re_') ? 'valid' : 'invalid') : 'missing',
      fromEmailFormat: process.env.RESEND_FROM_EMAIL ? 
        (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.RESEND_FROM_EMAIL) ? 'valid' : 'invalid') : 'missing'
    };

    // Проверяем основные требования
    const errors = [];
    
    if (!config.hasResendApiKey) {
      errors.push('RESEND_API_KEY not configured');
    } else if (config.resendApiKeyFormat === 'invalid') {
      errors.push('RESEND_API_KEY format invalid (should start with "re_")');
    }
    
    if (!config.hasFromEmail) {
      errors.push('RESEND_FROM_EMAIL not configured');
    } else if (config.fromEmailFormat === 'invalid') {
      errors.push('RESEND_FROM_EMAIL format invalid');
    }
    
    const isConfigured = errors.length === 0;
    
    return NextResponse.json({
      configured: isConfigured,
      config: {
        ...config,
        // Не показываем реальные значения в целях безопасности
        resendApiKey: config.hasResendApiKey ? '***configured***' : 'not set',
        fromEmail: config.hasFromEmail ? process.env.RESEND_FROM_EMAIL : 'not set',
        fromName: config.hasFromName ? process.env.RESEND_FROM_NAME : 'not set'
      },
      errors: errors,
      recommendations: [
        'Set RESEND_API_KEY from your Resend dashboard',
        'Set RESEND_FROM_EMAIL to a verified domain email',
        'Set RESEND_FROM_NAME to your app name',
        'Set SEND_REAL_EMAILS=true for production'
      ]
    });
    
  } catch (error) {
    console.error('Error checking email configuration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check email configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}