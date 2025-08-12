require('dotenv').config({ path: '.env.local' });
import { query } from '@/lib/database';

async function debugTokenCreation() {
  const testEmail = 'dvortsov.mish@yandex.ru';
  
  console.log('🔍 Debug token creation process...\n');

  try {
    // Шаг 1: Проверим текущие токены
    console.log('📊 Step 1: Current tokens before creation');
    const beforeResult = await query(
      `SELECT token, user_id, expires_at, used_at, created_at 
       FROM password_reset_tokens 
       WHERE user_id = (SELECT id FROM users WHERE email = $1)
       ORDER BY created_at DESC 
       LIMIT 3`,
      [testEmail]
    );
    
    console.log(`Found ${beforeResult.rows.length} existing tokens:`);
    beforeResult.rows.forEach(row => {
      console.log(`- Token: ${row.token.substring(0, 10)}... | Used: ${row.used_at ? '✅' : '❌'} | Created: ${new Date(row.created_at).toLocaleTimeString()}`);
    });

    // Шаг 2: Создаем новый токен через API
    console.log('\n🔧 Step 2: Creating new token via API...');
    const response = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'debug-token', // Может понадобиться реальный токен
      },
      body: JSON.stringify({ email: testEmail, locale: 'ru' }),
    });

    const data = await response.json();
    console.log('API Response:', data);

    // Шаг 3: Проверяем токены после создания
    console.log('\n📊 Step 3: Tokens after creation');
    const afterResult = await query(
      `SELECT token, user_id, expires_at, used_at, created_at 
       FROM password_reset_tokens 
       WHERE user_id = (SELECT id FROM users WHERE email = $1)
       ORDER BY created_at DESC 
       LIMIT 3`,
      [testEmail]
    );
    
    console.log(`Found ${afterResult.rows.length} tokens after creation:`);
    afterResult.rows.forEach(row => {
      const createdTime = new Date(row.created_at);
      const usedTime = row.used_at ? new Date(row.used_at) : null;
      console.log(`- Token: ${row.token.substring(0, 10)}...`);
      console.log(`  Created: ${createdTime.toLocaleString()}`);
      console.log(`  Used: ${usedTime ? usedTime.toLocaleString() : 'NO'}`);
      console.log(`  Status: ${row.used_at ? '❌ USED' : '✅ VALID'}`);
      
      if (!row.used_at) {
        console.log(`  🔗 URL: http://localhost:3000/ru/auth/reset-password?token=${row.token}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

debugTokenCreation();