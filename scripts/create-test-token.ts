require('dotenv').config({ path: '.env.local' });
import { query } from '@/lib/database';
import { PasswordResetService } from '@/lib/services/password-reset-service';

async function createTestToken() {
  try {
    console.log('🔧 Creating test token...\n');
    
    // Находим пользователя по email (замените на ваш email)
    const userEmail = 'dvortsov.mish@yandex.ru'; // ваш email из базы
    const userResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [userEmail]
    );
    
    if (userResult.rows.length === 0) {
      console.log(`❌ User with email ${userEmail} not found`);
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log(`👤 Found user: ${userId}`);
    
    // Создаем новый токен
    const tokenResult = await PasswordResetService.createResetToken(userId);
    
    if (tokenResult.success) {
      console.log(`✅ Token created successfully!`);
      console.log(`🔑 Token: ${tokenResult.token?.substring(0, 16)}...`);
      console.log(`🔗 Test URL: http://localhost:3000/ru/auth/reset-password?token=${tokenResult.token}`);
      
      // Проверяем валидность сразу
      const validation = await PasswordResetService.validateResetToken(tokenResult.token!);
      console.log(`🔍 Validation result:`, validation);
    } else {
      console.log(`❌ Failed to create token:`, tokenResult.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestToken();
