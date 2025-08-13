import { query } from '@/lib/database';
import crypto from 'crypto';

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export class PasswordResetService {
  /**
   * Создает токен для сброса пароля
   * Генерируется ТОЛЬКО при отправке email
   */
  static async createResetToken(userId: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      // Генерируем криптографически безопасный токен (увеличил до 64 байт для большей безопасности)
      const token = crypto.randomBytes(64).toString('hex');
      
      // Токен действует 1 час (сокращено время для большей безопасности)
      const resetTokenExpiryHours = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_HOURS || '1', 10);
      const expiresAt = new Date(Date.now() + resetTokenExpiryHours * 60 * 60 * 1000);
      
      // УДАЛЯЕМ ВСЕ старые токены для этого пользователя (для предотвращения спама)
      await query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1',
        [userId]
      );
      
      // Создаем новый токен
      const result = await query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
         VALUES ($1, $2, $3) RETURNING token, id, expires_at`,
        [userId, token, expiresAt]
      );
      
      if (result.rows.length > 0) {
        const createdToken = result.rows[0].token;
        
        // Проверка целостности
        if (createdToken !== token) {
          console.error('Password reset token mismatch detected');
          return {
            success: false,
            error: 'Token creation error'
          };
        }
        
        // Логируем создание токена
        console.log(`🔑 Password reset token created for user ${userId.substring(0, 8)}..., expires in ${resetTokenExpiryHours} hour(s) at ${expiresAt.toISOString()}`);
        
        return {
          success: true,
          token: createdToken
        };
      } else {
        return {
          success: false,
          error: 'Failed to create reset token'
        };
      }
    } catch (error) {
      console.error('Error creating password reset token:', error);
      return {
        success: false,
        error: 'Database error'
      };
    }
  }

  /**
   * Проверяет валидность токена сброса пароля
   * ВАЖНО: Этот метод НИКОГДА не отмечает токен как использованный!
   * Токен отмечается как использованный только через markTokenAsUsed()
   */
  static async validateResetToken(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const result = await query(
        `SELECT user_id, expires_at, used_at, created_at 
         FROM password_reset_tokens 
         WHERE token = $1`,
        [token]
      );
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Ссылка для сброса пароля недействительна. Запросите новую ссылку.'
        };
      }
      
      const tokenData = result.rows[0];
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);
      
      // Проверяем, не был ли токен уже использован
      if (tokenData.used_at) {
        return {
          success: false,
          error: 'Эта ссылка уже была использована. Если вам нужно снова сбросить пароль, запросите новую ссылку.'
        };
      }
      
      // Проверяем, не истек ли токен
      if (now > expiresAt) {
        return {
          success: false,
          error: 'Срок действия ссылки истек. Запросите новую ссылку для сброса пароля.'
        };
      }
      
      return {
        success: true,
        userId: tokenData.user_id
      };
    } catch (error) {
      console.error('Error validating reset token:', error);
      return {
        success: false,
        error: 'Произошла ошибка при проверке ссылки. Попробуйте снова.'
      };
    }
  }

  /**
   * Отмечает токен как использованный (только если он ещё не использован)
   * Токен МОМЕНТАЛЬНО истекает после успешной смены пароля
   */
  static async markTokenAsUsed(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await query(
        'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = $1 AND used_at IS NULL RETURNING token, user_id',
        [token]
      );
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Token was already used or does not exist'
        };
      }
      
      const { user_id } = result.rows[0];
      
      // Дополнительная очистка: удаляем ВСЕ токены для этого пользователя (для безопасности)
      await query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1 AND token != $2',
        [user_id, token]
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error marking token as used:', error);
      return {
        success: false,
        error: 'Database error'
      };
    }
  }

  /**
   * Очищает истекшие токены (можно вызывать периодически)
   */
  static async cleanupExpiredTokens(): Promise<{ success: boolean; error?: string }> {
    try {
      await query(
        'DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP'
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return {
        success: false,
        error: 'Database error'
      };
    }
  }
}