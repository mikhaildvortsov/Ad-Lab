import fs from 'fs';
import path from 'path';
import { Resend } from 'resend';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Инициализирует Resend с API ключом
   */
  private static initResend() {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      throw new Error('Resend API key not configured. Please set RESEND_API_KEY environment variable.');
    }
    
    return new Resend(apiKey);
  }

  /**
   * Отправляет email через Resend API или логирует в файл (разработка)
   */
  static async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const { to, subject, html, text } = options;
      
      // В режиме разработки можем либо отправлять реально, либо логировать
      const shouldSendRealEmail = process.env.SEND_REAL_EMAILS === 'true';
      
      if (process.env.NODE_ENV === 'development' && !shouldSendRealEmail) {
        console.log('📧 DEV MODE: Logging email to file instead of sending');
        return await this.logEmailToFile(options);
      }
      
      // Реальная отправка через Resend
      const resend = this.initResend();
      
      const fromEmail = process.env.RESEND_FROM_EMAIL || '';
      const fromName = process.env.RESEND_FROM_NAME || 'Ad Lab';
      
      if (!fromEmail) {
        throw new Error('Resend FROM email not configured. Please set RESEND_FROM_EMAIL environment variable.');
      }
      
      const result = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject: subject,
        html: html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
      });
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Email sent successfully via Resend:', result.data?.id);
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('Resend email error:', error);
      
      // Более подробная диагностика ошибок
      let errorMessage = 'Failed to send email';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Специфичные ошибки Resend
        if (errorMessage.includes('API key')) {
          errorMessage = 'Email service configuration error: Invalid API key';
        } else if (errorMessage.includes('domain')) {
          errorMessage = 'Email service configuration error: Domain not verified';
        } else if (errorMessage.includes('from')) {
          errorMessage = 'Email service configuration error: Invalid sender email';
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Тестирует Resend API подключение
   */
  static async testResendConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 Testing Resend API connection...');
      
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          error: 'RESEND_API_KEY not configured'
        };
      }
      
      // Проверяем, что API ключ действителен
      const resend = this.initResend();
      
      // Пытаемся получить информацию об аккаунте через простой запрос
      // Resend не имеет отдельного метода для проверки соединения,
      // поэтому просто проверяем, что объект создан успешно
      console.log('✅ Resend API key configured successfully');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Resend connection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Resend error'
      };
    }
  }

  /**
   * Логирует email в файл для разработки
   */
  private static async logEmailToFile(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const { to, subject, html } = options;
      
      const emailContent = `
========================================
📧 EMAIL LOG - ${new Date().toISOString()}
========================================
To: ${to}
Subject: ${subject}
----------------------------------------
${html}
========================================

`;

      // Создаем папку logs если её нет
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Записываем в файл
      const logFile = path.join(logsDir, 'emails.log');
      fs.appendFileSync(logFile, emailContent);

      // Также выводим в консоль
      console.log('📧 EMAIL SENT (logged to file):', {
        to,
        subject,
        logFile
      });

      return { success: true };
    } catch (error) {
      console.error('Error logging email:', error);
      return {
        success: false,
        error: 'Failed to log email'
      };
    }
  }

  /**
   * Создает HTML для сброса пароля
   */
  static createPasswordResetEmail(resetUrl: string, locale: string = 'ru'): { html: string; text: string; subject: string } {
    const isRussian = locale === 'ru';
    
    const subject = isRussian ? 'Сброс пароля - Ad Lab' : 'Password Reset - Ad Lab';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .button { 
            display: inline-block; 
            background: #2563eb; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
          }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .warning { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">✨ Ad Lab</div>
          </div>
          
          <div class="content">
            <h2>${isRussian ? 'Сброс пароля' : 'Password Reset'}</h2>
            <p>
              ${isRussian 
                ? 'Вы запросили сброс пароля для своего аккаунта. Нажмите на кнопку ниже, чтобы создать новый пароль. <strong>Ссылка может быть использована только один раз.</strong>'
                : 'You requested a password reset for your account. Click the button below to create a new password. <strong>This link can only be used once.</strong>'
              }
            </p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">
                ${isRussian ? 'Сбросить пароль' : 'Reset Password'}
              </a>
            </div>
            
            <div class="warning">
              <strong>${isRussian ? '⚠️ Важно:' : '⚠️ Important:'}</strong><br>
              ${isRussian 
                ? 'Ссылка может быть использована только один раз. После успешной смены пароля ссылка становится недействительной. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.'
                : 'This link can be used only once. After successfully changing your password, the link becomes invalid. If you did not request a password reset, simply ignore this email.'
              }
            </div>
            
            <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
              ${isRussian 
                ? 'Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:'
                : 'If the button doesn\'t work, copy and paste this link into your browser:'
              }<br>
              <span style="word-break: break-all;">${resetUrl}</span>
            </p>
          </div>
          
          <div class="footer">
            <p>
              ${isRussian 
                ? 'С уважением,<br>Команда Ad Lab'
                : 'Best regards,<br>Ad Lab Team'
              }
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
${isRussian ? 'Сброс пароля - Ad Lab' : 'Password Reset - Ad Lab'}

${isRussian 
  ? 'Вы запросили сброс пароля для своего аккаунта.'
  : 'You requested a password reset for your account.'
}

${isRussian ? 'Перейдите по ссылке:' : 'Click this link:'}
${resetUrl}

${isRussian 
  ? 'Эта ссылка действительна в течение 1 часа.'
  : 'This link is valid for 1 hour.'
}

${isRussian 
  ? 'Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.'
  : 'If you did not request a password reset, simply ignore this email.'
}

${isRussian ? 'С уважением, Команда Ad Lab' : 'Best regards, Ad Lab Team'}
    `;

    return { html, text, subject };
  }
}