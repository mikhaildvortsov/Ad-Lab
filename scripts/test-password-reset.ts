import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

async function testPasswordReset() {
  console.log('🧪 Testing Password Reset functionality...\n');
  
  const testEmail = process.argv[2] || 'dvortsov.mish@yandex.ru';
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('📧 Testing password reset for:', testEmail);
    
    // Получаем CSRF токен
    console.log('🔐 Getting CSRF token...');
    const csrfResponse = await fetch(`${baseUrl}/api/csrf-token`);
    const csrfData = await csrfResponse.json();
    
    if (!csrfData.csrfToken) {
      throw new Error('Failed to get CSRF token');
    }
    
    console.log('✅ CSRF token received');
    
    // Тестируем запрос сброса пароля
    const response = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfData.csrfToken,
      },
      body: JSON.stringify({
        email: testEmail,
        locale: 'ru'
      })
    });

    const data = await response.json();
    
    console.log('\n📊 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Password reset request successful!');
      console.log('📧 Email sent to:', testEmail);
      console.log('💡 Check your email for the reset link');
    } else {
      console.log('\n❌ Password reset failed:', data.error);
    }

  } catch (error) {
    console.error('\n💥 Test failed:', error);
  }
}

// Запускаем тест
testPasswordReset()
  .then(() => {
    console.log('\n🏁 Password reset test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Password reset test failed:', error);
    process.exit(1);
  });