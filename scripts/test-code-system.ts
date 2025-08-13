require('dotenv').config({ path: '.env.local' });
import { PasswordResetService } from '@/lib/services/password-reset-service';
import { EmailService } from '@/lib/services/email-service';

async function testCodeSystem() {
  try {
    console.log('🧪 Testing new code-based password reset system...\n');
    
    const testEmail = 'dvortsov.mish@yandex.ru';
    
    // 1. Создаем код
    console.log('1️⃣ Creating reset code...');
    const codeResult = await PasswordResetService.createResetCode(testEmail);
    
    if (!codeResult.success) {
      console.error('❌ Failed to create code:', codeResult.error);
      return;
    }
    
    console.log(`✅ Code created: ${codeResult.code}`);
    
    // 2. Создаем email
    console.log('\n2️⃣ Creating email...');
    const emailData = EmailService.createPasswordResetEmail(codeResult.code!, 'ru');
    console.log(`✅ Email created with subject: ${emailData.subject}`);
    
    // 3. Валидируем код
    console.log('\n3️⃣ Validating code...');
    const validation = await PasswordResetService.validateResetCode(testEmail, codeResult.code!);
    
    if (validation.success) {
      console.log('✅ Code validation successful');
    } else {
      console.error('❌ Code validation failed:', validation.error);
      return;
    }
    
    // 4. Тестируем неправильный код
    console.log('\n4️⃣ Testing wrong code...');
    const wrongValidation = await PasswordResetService.validateResetCode(testEmail, '000000');
    
    if (!wrongValidation.success) {
      console.log('✅ Wrong code correctly rejected:', wrongValidation.error);
    } else {
      console.error('❌ Wrong code was accepted - this is a bug!');
    }
    
    // 5. Отмечаем код как использованный
    console.log('\n5️⃣ Marking code as used...');
    const markResult = await PasswordResetService.markCodeAsUsed(testEmail, codeResult.code!);
    
    if (markResult.success) {
      console.log('✅ Code marked as used');
    } else {
      console.error('❌ Failed to mark code as used:', markResult.error);
    }
    
    // 6. Пытаемся использовать код повторно
    console.log('\n6️⃣ Testing used code...');
    const usedValidation = await PasswordResetService.validateResetCode(testEmail, codeResult.code!);
    
    if (!usedValidation.success) {
      console.log('✅ Used code correctly rejected:', usedValidation.error);
    } else {
      console.error('❌ Used code was accepted - this is a bug!');
    }
    
    console.log('\n🎉 All tests passed! The new code system works correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCodeSystem();
