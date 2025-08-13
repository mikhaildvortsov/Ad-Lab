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
  static async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
    const shouldSendRealEmails = process.env.SEND_REAL_EMAILS === 'true';
    
    if (shouldSendRealEmails) {
      return this.sendRealEmail(options);
    } else {
      return this.logEmailToFile(options);
    }
  }

  /**
   * Отправляет реальный email через Resend
   */
  private static async sendRealEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      const resend = this.initResend();
      
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@adlab.guru';
      const fromName = process.env.RESEND_FROM_NAME || 'Ad Lab';
      
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        console.error('Resend email error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send email via Resend'
        };
      }

      console.log('Email sent successfully via Resend:', data?.id);
      return {
        success: true,
        messageId: data?.id
      };

    } catch (error) {
      console.error('Error sending email via Resend:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while sending email'
      };
    }
  }

  /**
   * Логирует email в файл для разработки
   */
  private static async logEmailToFile(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const timestamp = new Date().toISOString();
      const logData = {
        timestamp,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      // Создаем директорию для логов если её нет
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Записываем в файл
      const logFile = path.join(logsDir, `email-${new Date().toISOString().split('T')[0]}.json`);
      
      let existingLogs = [];
      if (fs.existsSync(logFile)) {
        const existingContent = fs.readFileSync(logFile, 'utf8');
        try {
          existingLogs = JSON.parse(existingContent);
        } catch (e) {
          existingLogs = [];
        }
      }

      existingLogs.push(logData);
      fs.writeFileSync(logFile, JSON.stringify(existingLogs, null, 2));

      console.log(`📧 Email logged to file: ${logFile}`);
      console.log(`📨 Subject: ${options.subject}`);
      console.log(`📬 To: ${options.to}`);

      return { success: true };

    } catch (error) {
      console.error('Error logging email to file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while logging email'
      };
    }
  }

  /**
   * Создает HTML для сброса пароля с кодом
   */
  static createPasswordResetEmail(resetCode: string, locale: string = 'ru'): { html: string; text: string; subject: string } {
    const isRussian = locale === 'ru';
    
    const subject = isRussian ? 'Код для сброса пароля - Ad Lab' : 'Password Reset Code - Ad Lab';
    
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
          .code-box { 
            background: #2563eb; 
            color: white; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center; 
            margin: 25px 0;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 4px;
          }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .warning { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .instructions { background: #e0f2fe; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">✨ Ad Lab</div>
          </div>
          
          <div class="content">
            <h2>${isRussian ? 'Код для сброса пароля' : 'Password Reset Code'}</h2>
            <p>
              ${isRussian 
                ? 'Вы запросили сброс пароля для своего аккаунта. Используйте этот код:'
                : 'You requested a password reset for your account. Use this code:'
              }
            </p>
            
            <div class="code-box">
              ${resetCode}
            </div>
            
            <div class="instructions">
              <strong>${isRussian ? '📋 Инструкция:' : '📋 Instructions:'}</strong><br>
              ${isRussian 
                ? '1. Перейдите на страницу сброса пароля<br>2. Введите ваш email и этот код<br>3. Создайте новый пароль'
                : '1. Go to the password reset page<br>2. Enter your email and this code<br>3. Create a new password'
              }
            </div>
            
            <div class="warning">
              <strong>${isRussian ? '⚠️ Важно:' : '⚠️ Important:'}</strong><br>
              ${isRussian 
                ? 'Код действителен 15 минут и может быть использован только один раз. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.'
                : 'This code is valid for 15 minutes and can only be used once. If you did not request a password reset, simply ignore this email.'
              }
            </div>
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
${subject}

${isRussian 
  ? 'Вы запросили сброс пароля для своего аккаунта в Ad Lab.'
  : 'You requested a password reset for your Ad Lab account.'
}

${isRussian 
  ? 'Ваш код для сброса пароля:'
  : 'Your password reset code:'
}

${resetCode}

${isRussian 
  ? 'Код действителен 15 минут. Введите его на странице сброса пароля вместе с вашим email.'
  : 'This code is valid for 15 minutes. Enter it on the password reset page along with your email.'
}

${isRussian 
  ? 'Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.'
  : 'If you did not request a password reset, please ignore this email.'
}

${isRussian 
  ? 'С уважением, команда Ad Lab'
  : 'Best regards, Ad Lab Team'
}
`;

    return { html, text, subject };
  }
}
