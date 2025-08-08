import { query } from '@/lib/database';
import { DatabaseResult, PromoCode, UserPromoActivation } from '@/lib/database-types';

export class PromoService {
  /**
   * Активировать промо-код для пользователя
   */
  static async activatePromoCode(userId: string, code: string): Promise<DatabaseResult<UserPromoActivation>> {
    try {
      // Проверяем существование и валидность промо-кода
      const promoResult = await query(`
        SELECT * FROM promo_codes 
        WHERE code = $1 AND is_active = true
      `, [code]);

      if (promoResult.rows.length === 0) {
        return { success: false, error: 'Промо-код не найден или неактивен' };
      }

      const promoCode = promoResult.rows[0] as PromoCode;

      // Проверяем срок действия
      if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
        return { success: false, error: 'Срок действия промо-кода истек' };
      }

      // Проверяем лимит использований
      if (promoCode.current_uses >= promoCode.max_uses) {
        return { success: false, error: 'Промо-код исчерпал лимит использований' };
      }

      // Проверяем, не использовал ли пользователь уже этот код
      const existingActivation = await query(`
        SELECT * FROM user_promo_activations 
        WHERE user_id = $1 AND promo_code_id = $2
      `, [userId, promoCode.id]);

      if (existingActivation.rows.length > 0) {
        return { success: false, error: 'Вы уже использовали этот промо-код' };
      }

      // Начинаем транзакцию
      await query('BEGIN');

      try {
        // Увеличиваем счетчик использований
        await query(`
          UPDATE promo_codes 
          SET current_uses = current_uses + 1 
          WHERE id = $1
        `, [promoCode.id]);

        // Создаем активацию
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + promoCode.access_duration_days);

        const activationResult = await query(`
          INSERT INTO user_promo_activations (user_id, promo_code_id, expires_at)
          VALUES ($1, $2, $3)
          RETURNING *
        `, [userId, promoCode.id, expiresAt]);

        await query('COMMIT');

        return {
          success: true,
          data: activationResult.rows[0] as UserPromoActivation
        };
      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error activating promo code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Проверить, есть ли у пользователя активные промо-коды
   */
  static async getUserActivePromoAccess(userId: string): Promise<DatabaseResult<UserPromoActivation | null>> {
    try {
      const result = await query(`
        SELECT upa.*, pc.description
        FROM user_promo_activations upa
        JOIN promo_codes pc ON upa.promo_code_id = pc.id
        WHERE upa.user_id = $1 
          AND upa.is_active = true 
          AND upa.expires_at > NOW()
        ORDER BY upa.expires_at DESC
        LIMIT 1
      `, [userId]);

      return {
        success: true,
        data: result.rows.length > 0 ? result.rows[0] as UserPromoActivation : null
      };
    } catch (error) {
      console.error('Error checking user promo access:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Получить все активные промо-коды пользователя
   */
  static async getUserPromoActivations(userId: string): Promise<DatabaseResult<UserPromoActivation[]>> {
    try {
      const result = await query(`
        SELECT upa.*, pc.code, pc.description, pc.access_duration_days
        FROM user_promo_activations upa
        JOIN promo_codes pc ON upa.promo_code_id = pc.id
        WHERE upa.user_id = $1
        ORDER BY upa.activated_at DESC
      `, [userId]);

      return {
        success: true,
        data: result.rows as UserPromoActivation[]
      };
    } catch (error) {
      console.error('Error getting user promo activations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Деактивировать промо-код пользователя
   */
  static async deactivateUserPromoCode(userId: string, activationId: string): Promise<DatabaseResult<boolean>> {
    try {
      const result = await query(`
        UPDATE user_promo_activations 
        SET is_active = false 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `, [activationId, userId]);

      return {
        success: true,
        data: result.rows.length > 0
      };
    } catch (error) {
      console.error('Error deactivating promo code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Проверить валидность промо-кода без активации
   */
  static async validatePromoCode(code: string): Promise<DatabaseResult<PromoCode>> {
    try {
      const result = await query(`
        SELECT * FROM promo_codes 
        WHERE code = $1 AND is_active = true
      `, [code]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Промо-код не найден' };
      }

      const promoCode = result.rows[0] as PromoCode;

      // Проверяем срок действия
      if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
        return { success: false, error: 'Срок действия промо-кода истек' };
      }

      // Проверяем лимит использований
      if (promoCode.current_uses >= promoCode.max_uses) {
        return { success: false, error: 'Промо-код исчерпал лимит использований' };
      }

      return {
        success: true,
        data: promoCode
      };
    } catch (error) {
      console.error('Error validating promo code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}