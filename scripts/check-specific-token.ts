require('dotenv').config({ path: '.env.local' });
import { query } from '@/lib/database';
import { PasswordResetService } from '@/lib/services/password-reset-service';

async function checkSpecificToken() {
  try {
    const token = 'af106d267e39be03ae5dff2cfbf7f3ab29b055b3df63dbfa3257bf659c85e0f6304a57b011487e7164b7f92a4463afdade96d7c4bc56da5ff5e8de79741bdc61';
    
    console.log('🔍 Checking specific token...\n');
    console.log(`Token: ${token.substring(0, 16)}...`);
    
    // Проверяем токен в базе данных
    const result = await query(
      `SELECT user_id, expires_at, used_at, created_at 
       FROM password_reset_tokens 
       WHERE token = $1`,
      [token]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Token not found in database');
      return;
    }
    
    const tokenData = result.rows[0];
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    const createdAt = new Date(tokenData.created_at);
    const isExpired = now > expiresAt;
    const isUsed = !!tokenData.used_at;
    
    console.log('📊 Token details:');
    console.log(`👤 User ID: ${tokenData.user_id}`);
    console.log(`📅 Created: ${createdAt.toISOString()} (${createdAt.toLocaleString()})`);
    console.log(`⏰ Expires: ${expiresAt.toISOString()} (${expiresAt.toLocaleString()})`);
    console.log(`🕒 Current: ${now.toISOString()} (${now.toLocaleString()})`);
    console.log(`✅ Used: ${isUsed ? 'YES at ' + tokenData.used_at : 'NO'}`);
    console.log(`📅 Status: ${isUsed ? '🔴 Used' : isExpired ? '🟡 Expired' : '🟢 Valid'}`);
    
    if (!isUsed && !isExpired) {
      const timeRemaining = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60));
      console.log(`⏱️  Time remaining: ${timeRemaining} minutes`);
    } else if (isExpired) {
      const timeExpired = Math.round((now.getTime() - expiresAt.getTime()) / (1000 * 60));
      console.log(`⏱️  Expired: ${timeExpired} minutes ago`);
    }
    
    console.log('\n🔬 Validation test:');
    
    // Тестируем валидацию через сервис
    const validation = await PasswordResetService.validateResetToken(token);
    console.log(`Result: ${validation.success ? '✅ Valid' : '❌ Invalid'}`);
    if (!validation.success) {
      console.log(`Error: ${validation.error}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSpecificToken();
