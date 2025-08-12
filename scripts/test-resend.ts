import dotenv from 'dotenv';
import { EmailService } from '@/lib/services/email-service';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

async function testResend() {
  console.log('🧪 Testing Resend configuration...\n');
  
  // Проверяем наличие необходимых переменных
  const requiredEnvVars = {
    'RESEND_API_KEY': process.env.RESEND_API_KEY ? '***' + process.env.RESEND_API_KEY.slice(-10) : undefined,
    'RESEND_FROM_EMAIL': process.env.RESEND_FROM_EMAIL,
    'RESEND_FROM_NAME': process.env.RESEND_FROM_NAME,
    'SEND_REAL_EMAILS': process.env.SEND_REAL_EMAILS,
    'NODE_ENV': process.env.NODE_ENV
  };

  console.log('📋 Environment Variables:');
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    console.log(`  ${key}: ${value || '❌ NOT SET'}`);
  });

  console.log('\n🔧 Testing Resend API connection...');
  
  try {
    const connectionResult = await EmailService.testResendConnection();
    
    if (connectionResult.success) {
      console.log('✅ Resend API connection successful!');
    } else {
      console.error('❌ Resend connection failed:', connectionResult.error);
      return;
    }

    // Если передан email в аргументах, отправляем тестовое письмо
    const testEmail = process.argv[2];
    if (testEmail) {
      console.log(`\n📧 Sending test email to: ${testEmail}`);
      
      const emailResult = await EmailService.sendEmail({
        to: testEmail,
        subject: '✅ Resend API Test - Ad Lab',
        html: `
        <h1 style="color: #2563eb;">🎉 Resend Test Successful!</h1>
        <p>Поздравляем! Ваша настройка Resend API работает корректно.</p>
        <h3>Детали конфигурации:</h3>
        <ul>
          <li><strong>API:</strong> Resend</li>
          <li><strong>От:</strong> ${process.env.RESEND_FROM_EMAIL}</li>
          <li><strong>Время:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <hr>
        <p style="color: #666; font-size: 12px;">
        Это письмо отправлено автоматически для тестирования Resend настроек Ad Lab.
        </p>
        `,
        text: `
Resend Test Successful!

Поздравляем! Ваша настройка Resend API работает корректно.

API: Resend
От: ${process.env.RESEND_FROM_EMAIL}
Время: ${new Date().toLocaleString()}

Это письмо отправлено автоматически для тестирования Resend настроек Ad Lab.
        `
      });

      if (emailResult.success) {
        console.log('✅ Test email sent successfully!');
      } else {
        console.error('❌ Failed to send test email:', emailResult.error);
      }
    } else {
      console.log('\n💡 To send a test email, run:');
      console.log('npx tsx scripts/test-resend.ts your@email.com');
    }

  } catch (error) {
    console.error('❌ Resend connection failed:', error);
  }
}

// Запускаем тест
testResend()
  .then(() => {
    console.log('\n🏁 Resend test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Resend test failed:', error);
    process.exit(1);
  });