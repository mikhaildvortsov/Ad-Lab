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
   */
  static async createResetToken(userId: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      
      // Генерируем криптографически безопасный токен
      const token = crypto.randomBytes(32).toString('hex');
      
      // Токен действует 1 час
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      // Удаляем старые неиспользованные токены для этого пользователя
      await query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL',
        [userId]
      );
      
      // Создаем новый токен
      const result = await query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
         VALUES ($1, $2, $3) RETURNING token`,
        [userId, token, expiresAt]
      );
      
      if (result.rows.length > 0) {
        return {
          success: true,
          token: result.rows[0].token
        };
      } else {
        return {
          success: false,
          error: 'Failed to create reset token'
        };
      }
    } catch (error) {
      console.error('Error creating reset token:', error);
      return {
        success: false,
        error: 'Database error'
      };
    }
  }

  /**
   * Проверяет валидность токена сброса пароля
   */
  static async validateResetToken(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const result = await query(
        `SELECT user_id, expires_at, used_at 
         FROM password_reset_tokens 
         WHERE token = $1`,
        [token]
      );
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Invalid reset token'
        };
      }
      
      const tokenData = result.rows[0];
      
      // Проверяем, не был ли токен уже использован
      if (tokenData.used_at) {
        return {
          success: false,
          error: 'Reset token has already been used'
        };
      }
      
      // Проверяем, не истек ли токен
      if (new Date() > new Date(tokenData.expires_at)) {
        return {
          success: false,
          error: 'Reset token has expired'
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
        error: 'Database error'
      };
    }
  }

  /**
   * Отмечает токен как использованный
   */
  static async markTokenAsUsed(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      await query(
        'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = $1',
        [token]
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