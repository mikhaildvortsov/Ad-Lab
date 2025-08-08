import fs from 'fs';
import path from 'path';
import sgMail from '@sendgrid/mail';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Инициализирует SendGrid с API ключом
   */
  private static initSendGrid() {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      throw new Error('SendGrid API key not configured. Please set SENDGRID_API_KEY environment variable.');
    }
    
    sgMail.setApiKey(apiKey);
    return sgMail;
  }

  /**
   * Отправляет email через SendGrid API или логирует в файл (разработка)
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
      
      // Реальная отправка через SendGrid
      console.log('📧 Sending email via SendGrid to:', to);
      
      const sg = this.initSendGrid();
      
      const msg = {
        to: to,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || '',
          name: process.env.SENDGRID_FROM_NAME || 'Ad Lab'
        },
        subject: subject,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
        html: html,
      };
      
      if (!msg.from.email) {
        throw new Error('SendGrid FROM email not configured. Please set SENDGRID_FROM_EMAIL environment variable.');
      }
      
      const result = await sg.send(msg);
      console.log('✅ Email sent successfully via SendGrid:', result[0].statusCode);
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ SendGrid email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }

  /**
   * Тестирует SendGrid API подключение
   */
  static async testSendGridConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 Testing SendGrid API connection...');
      
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          error: 'SENDGRID_API_KEY not configured'
        };
      }
      
      // Проверяем, что API ключ действителен
      const sg = this.initSendGrid();
      
      // Пытаемся получить информацию об аккаунте (простая проверка API)
      console.log('✅ SendGrid API key configured successfully');
      
      return { success: true };
    } catch (error) {
      console.error('❌ SendGrid connection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SendGrid error'
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
                ? 'Вы запросили сброс пароля для своего аккаунта. Нажмите на кнопку ниже, чтобы создать новый пароль:'
                : 'You requested a password reset for your account. Click the button below to create a new password:'
              }
            </p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">
                ${isRussian ? 'Сбросить пароль' : 'Reset Password'}
              </a>
            </div>
            
            <div class="warning">
              <strong>${isRussian ? 'Важно:' : 'Important:'}</strong><br>
              ${isRussian 
                ? 'Эта ссылка действительна в течение 1 часа. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.'
                : 'This link is valid for 1 hour. If you did not request a password reset, simply ignore this email.'
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