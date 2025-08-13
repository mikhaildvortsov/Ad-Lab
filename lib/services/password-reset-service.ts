import { query } from '@/lib/database';

export interface PasswordResetCode {
  id: string;
  email: string;
  code: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export class PasswordResetService {
  /**
   * Создает 6-значный код для сброса пароля
   */
  static async createResetCode(email: string): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
      // Генерируем 6-значный код
      const code = Math.random().toString().slice(2, 8).padStart(6, '0');
      
      // Код действует 15 минут
      const resetCodeExpiryMinutes = parseInt(process.env.PASSWORD_RESET_CODE_EXPIRY_MINUTES || '15', 10);
      const expiresAt = new Date(Date.now() + resetCodeExpiryMinutes * 60 * 1000);
      
      console.log(`Creating reset code for ${email}, expires at: ${expiresAt.toISOString()}`);
      
      // УДАЛЯЕМ ВСЕ старые коды для этого email
      await query(
        'DELETE FROM password_reset_codes WHERE email = $1',
        [email.toLowerCase()]
      );
      
      // Создаем новый код
      const result = await query(
        `INSERT INTO password_reset_codes (email, code, expires_at) 
         VALUES ($1, $2, $3) RETURNING code, id, expires_at`,
        [email.toLowerCase(), code, expiresAt]
      );
      
      if (result.rows.length > 0) {
        const createdCode = result.rows[0].code;
        
        console.log(`Password reset code created for ${email}, expires in ${resetCodeExpiryMinutes} minutes`);
        
        return {
          success: true,
          code: createdCode
        };
      } else {
        return {
          success: false,
          error: 'Failed to create reset code'
        };
      }
    } catch (error) {
      console.error('Error creating password reset code:', error);
      return {
        success: false,
        error: 'Database error'
      };
    }
  }

  /**
   * Проверяет валидность кода сброса пароля
   */
  static async validateResetCode(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await query(
        `SELECT email, expires_at, used_at, created_at 
         FROM password_reset_codes 
         WHERE email = $1 AND code = $2`,
        [email.toLowerCase(), code]
      );
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Неверный код или email. Проверьте правильность ввода.'
        };
      }
      
      const codeData = result.rows[0];
      
      // Проверяем, не был ли код уже использован
      if (codeData.used_at) {
        return {
          success: false,
          error: 'Этот код уже был использован. Запросите новый код.'
        };
      }
      
      // Проверяем, не истек ли код
      const now = new Date();
      const expiresAt = new Date(codeData.expires_at);
      
      if (now > expiresAt) {
        return {
          success: false,
          error: 'Срок действия кода истек. Запросите новый код.'
        };
      }
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error validating reset code:', error);
      return {
        success: false,
        error: 'Произошла ошибка при проверке кода. Попробуйте снова.'
      };
    }
  }

  /**
   * Отмечает код как использованный
   */
  static async markCodeAsUsed(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await query(
        'UPDATE password_reset_codes SET used_at = CURRENT_TIMESTAMP WHERE email = $1 AND code = $2 AND used_at IS NULL RETURNING code',
        [email.toLowerCase(), code]
      );
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Code was already used or does not exist'
        };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error marking code as used:', error);
      return {
        success: false,
        error: 'Database error'
      };
    }
  }

  /**
   * Очищает истекшие коды
   */
  static async cleanupExpiredCodes(): Promise<{ success: boolean; error?: string }> {
    try {
      await query(
        'DELETE FROM password_reset_codes WHERE expires_at < CURRENT_TIMESTAMP'
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error cleaning up expired codes:', error);
      return {
        success: false,
        error: 'Database error'
      };
    }
  }
}