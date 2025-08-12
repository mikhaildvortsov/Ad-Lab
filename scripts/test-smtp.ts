import * as dotenv from 'dotenv';
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
  };

  console.log('📋 Environment variables:');
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    console.log(`${status} ${key}: ${value || 'NOT SET'}`);
  });

  console.log('\n🔧 Testing Resend API connection...');
  
  try {
    const connectionResult = await EmailService.testResendConnection();
    
    if (connectionResult.success) {
      console.log('✅ Resend API connection successful!');
      
      // Спрашиваем пользователя, хочет ли он отправить тестовое письмо
      const testEmail = process.argv[2];
      if (testEmail) {
        console.log(`\n📧 Sending test email to: ${testEmail}`);
        
        const emailResult = await EmailService.sendEmail({
          to: testEmail,
          subject: '✅ Resend API Test - Ad Lab',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h1 style="color: #2563eb;">🎉 Resend Test Successful!</h1>
        <p>Поздравляем! Ваша настройка Resend API работает корректно.</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Детали теста:</h3>
                <ul>
                            <li><strong>API:</strong> Resend</li>
          <li><strong>От:</strong> ${process.env.RESEND_FROM_EMAIL}</li>
                  <li><strong>Время отправки:</strong> ${new Date().toLocaleString()}</li>
                </ul>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Это письмо отправлено автоматически для тестирования Resend настроек Ad Lab.
              </p>
            </div>
          `,
          text: `
Resend Test Successful!

Поздравляем! Ваша настройка Resend API работает корректно.

API: Resend
От: ${process.env.RESEND_FROM_EMAIL}
Время отправки: ${new Date().toLocaleString()}

Это письмо отправлено автоматически для тестирования Resend настроек Ad Lab.
          `
        });

        if (emailResult.success) {
          console.log('✅ Test email sent successfully!');
          console.log('📬 Check your inbox (and spam folder)');
        } else {
          console.error('❌ Failed to send test email:', emailResult.error);
        }
      } else {
        console.log('\n💡 To send a test email, run:');
        console.log('npx tsx scripts/test-resend.ts your@email.com');
      }
      
    } else {
      console.error('❌ Resend connection failed:', connectionResult.error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
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