import * as dotenv from 'dotenv';
import { EmailService } from '@/lib/services/email-service';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

async function testSendGrid() {
  console.log('🧪 Testing SendGrid configuration...\n');
  
  // Проверяем наличие необходимых переменных
  const requiredEnvVars = {
    'SENDGRID_API_KEY': process.env.SENDGRID_API_KEY ? '***' + process.env.SENDGRID_API_KEY.slice(-10) : undefined,
    'SENDGRID_FROM_EMAIL': process.env.SENDGRID_FROM_EMAIL,
    'SENDGRID_FROM_NAME': process.env.SENDGRID_FROM_NAME,
    'SEND_REAL_EMAILS': process.env.SEND_REAL_EMAILS,
  };

  console.log('📋 Environment variables:');
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    console.log(`${status} ${key}: ${value || 'NOT SET'}`);
  });

  console.log('\n🔧 Testing SendGrid API connection...');
  
  try {
    const connectionResult = await EmailService.testSendGridConnection();
    
    if (connectionResult.success) {
      console.log('✅ SendGrid API connection successful!');
      
      // Спрашиваем пользователя, хочет ли он отправить тестовое письмо
      const testEmail = process.argv[2];
      if (testEmail) {
        console.log(`\n📧 Sending test email to: ${testEmail}`);
        
        const emailResult = await EmailService.sendEmail({
          to: testEmail,
          subject: '✅ SendGrid API Test - Ad Lab',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">🎉 SendGrid Test Successful!</h1>
              <p>Поздравляем! Ваша настройка SendGrid API работает корректно.</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Детали теста:</h3>
                <ul>
                  <li><strong>API:</strong> SendGrid</li>
                  <li><strong>От:</strong> ${process.env.SENDGRID_FROM_EMAIL}</li>
                  <li><strong>Время отправки:</strong> ${new Date().toLocaleString()}</li>
                </ul>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Это письмо отправлено автоматически для тестирования SendGrid настроек Ad Lab.
              </p>
            </div>
          `,
          text: `
SendGrid Test Successful!

Поздравляем! Ваша настройка SendGrid API работает корректно.

API: SendGrid
От: ${process.env.SENDGRID_FROM_EMAIL}
Время отправки: ${new Date().toLocaleString()}

Это письмо отправлено автоматически для тестирования SendGrid настроек Ad Lab.
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
        console.log('npx tsx scripts/test-sendgrid.ts your@email.com');
      }
      
    } else {
      console.error('❌ SendGrid connection failed:', connectionResult.error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Запускаем тест
testSendGrid()
  .then(() => {
    console.log('\n🏁 SendGrid test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 SendGrid test failed:', error);
    process.exit(1);
  });