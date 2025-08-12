require('dotenv').config({ path: '.env.local' });
import { query } from '@/lib/database';

async function debugResetTokenIssue() {
  try {
    console.log('🔍 Debugging password reset token issues...\n');
    
    // 1. Показать все токены с их статусом
    const allTokens = await query(
      `SELECT token, user_id, expires_at, used_at, created_at 
       FROM password_reset_tokens 
       ORDER BY created_at DESC`
    );
    
    console.log(`📊 Total tokens in database: ${allTokens.rows.length}\n`);
    
    let validCount = 0;
    let usedCount = 0;
    let expiredCount = 0;
    
    for (const row of allTokens.rows) {
      const now = new Date();
      const expiresAt = new Date(row.expires_at);
      const isExpired = now > expiresAt;
      const isUsed = !!row.used_at;
      
      if (isUsed) {
        usedCount++;
      } else if (isExpired) {
        expiredCount++;
      } else {
        validCount++;
      }
    }
    
    console.log(`📈 Token Statistics:`);
    console.log(`   ✅ Used tokens: ${usedCount}`);
    console.log(`   ❌ Expired tokens: ${expiredCount}`);
    console.log(`   🟢 Valid tokens: ${validCount}\n`);
    
    // 2. Показать недавние использованные токены
    const recentUsedTokens = await query(
      `SELECT token, user_id, used_at, created_at 
       FROM password_reset_tokens 
       WHERE used_at IS NOT NULL 
       ORDER BY used_at DESC 
       LIMIT 5`
    );
    
    console.log(`🔒 Recently used tokens (last 5):`);
    for (const row of recentUsedTokens.rows) {
      const timeDiff = new Date().getTime() - new Date(row.used_at).getTime();
      const minutesAgo = Math.floor(timeDiff / (1000 * 60));
      
      console.log(`   Token: ${row.token.substring(0, 10)}...`);
      console.log(`   User ID: ${row.user_id}`);
      console.log(`   Used: ${minutesAgo} minutes ago`);
      console.log(`   ─`.repeat(30));
    }
    
    // 3. Найти пользователей с множественными токенами
    const multipleTokens = await query(
      `SELECT user_id, COUNT(*) as token_count
       FROM password_reset_tokens 
       GROUP BY user_id 
       HAVING COUNT(*) > 1
       ORDER BY token_count DESC`
    );
    
    if (multipleTokens.rows.length > 0) {
      console.log(`\n🔄 Users with multiple tokens:`);
      for (const row of multipleTokens.rows) {
        console.log(`   User ${row.user_id}: ${row.token_count} tokens`);
      }
    }
    
    // 4. Показать токены, созданные недавно, но уже использованные
    const quicklyUsedTokens = await query(
      `SELECT token, user_id, created_at, used_at,
              EXTRACT(EPOCH FROM (used_at - created_at))/60 as minutes_to_use
       FROM password_reset_tokens 
       WHERE used_at IS NOT NULL 
       AND EXTRACT(EPOCH FROM (used_at - created_at)) < 300 -- менее 5 минут
       ORDER BY created_at DESC 
       LIMIT 5`
    );
    
    if (quicklyUsedTokens.rows.length > 0) {
      console.log(`\n⚡ Tokens used very quickly (< 5 minutes):`);
      for (const row of quicklyUsedTokens.rows) {
        console.log(`   Token: ${row.token.substring(0, 10)}...`);
        console.log(`   Used in: ${Math.round(row.minutes_to_use * 100) / 100} minutes`);
        console.log(`   ─`.repeat(30));
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging tokens:', error);
  }
}

// Функция для "восстановления" токена (снятия метки использования)
async function resetTokenUsage(tokenPrefix: string) {
  try {
    console.log(`🔧 Searching for token starting with: ${tokenPrefix}...`);
    
    const result = await query(
      `SELECT token, user_id, used_at 
       FROM password_reset_tokens 
       WHERE token LIKE $1 AND used_at IS NOT NULL`,
      [`${tokenPrefix}%`]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ No used tokens found with that prefix');
      return;
    }
    
    if (result.rows.length > 1) {
      console.log('⚠️ Multiple tokens match this prefix:');
      result.rows.forEach(row => {
        console.log(`   ${row.token.substring(0, 15)}... (User: ${row.user_id})`);
      });
      console.log('Please provide a longer prefix to match exactly one token');
      return;
    }
    
    const token = result.rows[0].token;
    console.log(`✅ Found token: ${token.substring(0, 15)}...`);
    console.log(`👤 User ID: ${result.rows[0].user_id}`);
    
    // Снимаем метку использования
    await query(
      'UPDATE password_reset_tokens SET used_at = NULL WHERE token = $1',
      [token]
    );
    
    console.log('✅ Token usage reset! Token can now be used again.');
    
  } catch (error) {
    console.error('❌ Error resetting token:', error);
  }
}

// Запуск функций
debugResetTokenIssue().then(() => {
  console.log('\n' + '='.repeat(60));
  console.log('💡 To reset a used token, run:');
  console.log('   node -r ts-node/register scripts/debug-reset-token-issue.ts reset <token_prefix>');
  console.log('   Example: node -r ts-node/register scripts/debug-reset-token-issue.ts reset abc123def4');
});

// Проверка аргументов командной строки для сброса токена
if (process.argv[2] === 'reset' && process.argv[3]) {
  resetTokenUsage(process.argv[3]);
}