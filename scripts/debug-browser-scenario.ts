require('dotenv').config({ path: '.env.local' });

async function debugBrowserScenario() {
  const { query } = require('../lib/database');
  
  console.log('🔍 Debugging browser scenario step by step...\n');

  // Получаем последний созданный токен
  const result = await query(
    'SELECT token, user_id, created_at, expires_at, used_at FROM password_reset_tokens WHERE used_at IS NULL ORDER BY created_at DESC LIMIT 1'
  );
  
  if (result.rows.length === 0) {
    console.log('❌ No unused tokens found. Creating new one...');
    
    // Создаем новый токен
    const createResponse = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: 'dvortsov.mish@yandex.ru',
        locale: 'ru'
      }),
    });

    const createData = await createResponse.json();
    if (!createData.success) {
      console.log('❌ Failed to create token');
      return;
    }

    // Получаем новый токен
    const newResult = await query(
      'SELECT token, user_id, created_at, expires_at, used_at FROM password_reset_tokens WHERE used_at IS NULL ORDER BY created_at DESC LIMIT 1'
    );
    
    if (newResult.rows.length === 0) {
      console.log('❌ Still no tokens found after creation');
      return;
    }
    
    result.rows = newResult.rows;
  }

  const tokenData = result.rows[0];
  const testToken = tokenData.token;
  
  console.log('🔑 Working with token:', testToken.substring(0, 10) + '...');
  console.log('👤 User ID:', tokenData.user_id);
  console.log('⏰ Created:', new Date(tokenData.created_at).toLocaleString());
  console.log('⏳ Expires:', new Date(tokenData.expires_at).toLocaleString());
  console.log('📅 Status:', tokenData.used_at ? '✅ Used' : '🟢 Unused');
  console.log('');

  try {
    // Симуляция: пользователь открывает ссылку в браузере
    console.log('📱 Step 1: User opens reset link in browser (page loads)...');
    console.log('   🔍 Frontend calls /api/auth/reset-password/validate');
    
    const validateResponse1 = await fetch('http://localhost:3000/api/auth/reset-password/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: testToken }),
    });

    const validateData1 = await validateResponse1.json();
    console.log(`   📊 Response: ${validateResponse1.status} - ${validateData1.success ? 'SUCCESS' : 'FAILED'}`);
    if (!validateData1.success) {
      console.log(`   ❌ Error: ${validateData1.error}`);
      return;
    }

    // Проверяем состояние токена после первой валидации
    console.log('\n🔍 Checking token status after first validation...');
    const checkResult1 = await query(
      'SELECT used_at FROM password_reset_tokens WHERE token = $1',
      [testToken]
    );
    
    if (checkResult1.rows.length > 0) {
      const usedAt = checkResult1.rows[0].used_at;
      console.log(`   📅 Token status: ${usedAt ? '❌ MARKED AS USED!' : '✅ Still valid'}`);
      
      if (usedAt) {
        console.log(`   ⏰ Marked as used at: ${new Date(usedAt).toLocaleString()}`);
        console.log('\n🚨 ISSUE FOUND: Token marked as used after validation!');
        return;
      }
    }

    // Симуляция: пользователь обновляет страницу (React.StrictMode может вызвать двойной useEffect)
    console.log('\n📱 Step 2: User refreshes page or React.StrictMode double effect...');
    console.log('   🔍 Second call to /api/auth/reset-password/validate');
    
    const validateResponse2 = await fetch('http://localhost:3000/api/auth/reset-password/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: testToken }),
    });

    const validateData2 = await validateResponse2.json();
    console.log(`   📊 Response: ${validateResponse2.status} - ${validateData2.success ? 'SUCCESS' : 'FAILED'}`);
    if (!validateData2.success) {
      console.log(`   ❌ Error: ${validateData2.error}`);
      console.log('\n🚨 ISSUE FOUND: Token failed on second validation!');
      return;
    }

    // Симуляция: пользователь заполняет форму
    console.log('\n📱 Step 3: User fills out the password form (waiting 2 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Проверяем токен перед отправкой формы
    console.log('\n🔍 Checking token status before form submission...');
    const checkResult2 = await query(
      'SELECT used_at FROM password_reset_tokens WHERE token = $1',
      [testToken]
    );
    
    if (checkResult2.rows.length > 0) {
      const usedAt = checkResult2.rows[0].used_at;
      console.log(`   📅 Token status: ${usedAt ? '❌ MARKED AS USED!' : '✅ Still valid'}`);
      
      if (usedAt) {
        console.log(`   ⏰ Marked as used at: ${new Date(usedAt).toLocaleString()}`);
        console.log('\n🚨 ISSUE FOUND: Token marked as used before form submission!');
        return;
      }
    }

    // Симуляция: пользователь отправляет форму
    console.log('\n📱 Step 4: User submits password reset form...');
    console.log('   🔍 Frontend calls /api/auth/reset-password/confirm');
    
    const confirmResponse = await fetch('http://localhost:3000/api/auth/reset-password/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        token: testToken,
        password: 'NewSecurePassword123!',
        locale: 'ru'
      }),
    });

    const confirmData = await confirmResponse.json();
    console.log(`   📊 Response: ${confirmResponse.status} - ${confirmData.success ? 'SUCCESS' : 'FAILED'}`);
    if (!confirmData.success) {
      console.log(`   ❌ Error: ${confirmData.error}`);
      
      if (confirmData.error === 'Reset token has already been used') {
        console.log('\n🚨 CONFIRMED: This is the "token already used" error we are investigating!');
      }
      return;
    }

    console.log('\n🎉 SUCCESS: Full browser scenario completed without issues!');
    console.log('   ✅ Token remained valid through multiple validations');
    console.log('   ✅ Password was successfully reset');

  } catch (error) {
    console.error('\n❌ Error during browser scenario test:', error);
  }

  console.log('\n🏁 Browser scenario debugging completed!');
}

debugBrowserScenario();