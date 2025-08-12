require('dotenv').config({ path: '.env.local' });

async function diagnoseEmailProduction() {
  console.log('🔍 Диагностика email в продакшене...\n');
  
  // 1. Проверяем переменные окружения
  console.log('📋 1. Переменные окружения:');
  
  const vars = {
    'RESEND_API_KEY': process.env.RESEND_API_KEY,
    'RESEND_FROM_EMAIL': process.env.RESEND_FROM_EMAIL,
    'RESEND_FROM_NAME': process.env.RESEND_FROM_NAME,
    'SEND_REAL_EMAILS': process.env.SEND_REAL_EMAILS,
    'NODE_ENV': process.env.NODE_ENV,
    'NEXTAUTH_URL': process.env.NEXTAUTH_URL
  };
  
  const issues = [];
  
  Object.entries(vars).forEach(([key, value]) => {
    if (value) {
      if (key === 'RESEND_API_KEY') {
        const isValid = value.startsWith('re_');
        console.log(`   ✅ ${key}: ${isValid ? 'настроено корректно' : '❌ неверный формат'}`);
        if (!isValid) issues.push(`${key} должен начинаться с "re_"`);
      } else if (key === 'RESEND_FROM_EMAIL') {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        console.log(`   ✅ ${key}: ${value} ${isValid ? '(корректный формат)' : '❌ (неверный формат)'}`);
        if (!isValid) issues.push(`${key} имеет неверный формат email`);
      } else {
        console.log(`   ✅ ${key}: ${value}`);
      }
    } else {
      console.log(`   ❌ ${key}: НЕ НАСТРОЕНО`);
      issues.push(`${key} не настроен`);
    }
  });
  
  // 2. Проверяем API endpoint
  console.log('\n📡 2. Проверка API конфигурации:');
  
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/test-email-config`);
    const data = await response.json();
    
    console.log(`   Статус: ${response.status}`);
    console.log(`   Настроено: ${data.configured ? '✅ Да' : '❌ Нет'}`);
    
    if (data.errors && data.errors.length > 0) {
      console.log('   Ошибки:');
      data.errors.forEach(error => {
        console.log(`     - ${error}`);
      });
    }
    
  } catch (error) {
    console.log(`   ❌ Ошибка проверки API: ${error.message}`);
    issues.push('Не удается подключиться к API');
  }
  
  // 3. Тестируем отправку email
  console.log('\n📧 3. Тест отправки email:');
  
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const testResponse = await fetch(`${baseUrl}/api/test-resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: process.env.RESEND_FROM_EMAIL, // отправляем на тот же email
          subject: 'Test email from production'
        }),
      });
      
      const testData = await testResponse.json();
      console.log(`   Статус теста: ${testResponse.status}`);
      console.log(`   Результат: ${testData.success ? '✅ Успешно' : '❌ Ошибка'}`);
      
      if (!testData.success) {
        console.log(`   Ошибка: ${testData.error}`);
        issues.push(`Тест отправки email: ${testData.error}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Ошибка теста: ${error.message}`);
      issues.push(`Не удается протестировать отправку email: ${error.message}`);
    }
  } else {
    console.log('   ⏭️ Пропущен (нет конфигурации)');
  }
  
  // 4. Итоговый отчет
  console.log('\n' + '='.repeat(60));
  console.log('📋 ИТОГОВЫЙ ДИАГНОСТИЧЕСКИЙ ОТЧЕТ:');
  console.log('='.repeat(60));
  
  if (issues.length === 0) {
    console.log('🎉 Все проверки пройдены! Email должен работать в продакшене.');
  } else {
    console.log(`❌ Найдено ${issues.length} проблем:`);
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    
    console.log('\n💡 Рекомендации по исправлению:');
    console.log('   1. Проверьте настройки в Resend dashboard');
    console.log('   2. Убедитесь, что домен верифицирован');
    console.log('   3. Проверьте переменные окружения в production');
    console.log('   4. Перезапустите приложение после изменения переменных');
  }
  
  console.log('\n📖 Подробная документация: PRODUCTION_SETUP.md');
}

diagnoseEmailProduction().catch(console.error);