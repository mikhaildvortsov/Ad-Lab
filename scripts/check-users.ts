import dotenv from 'dotenv';
import { UserService } from '@/lib/services/user-service';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

async function checkUsers() {
  console.log('👥 Checking users in database...\n');
  
  const testEmail = 'dvortsov.mish@yandex.ru';
  
  try {
    // Проверяем пользователя
    console.log('🔍 Looking for user:', testEmail);
    const userResult = await UserService.getUserByEmail(testEmail);
    
    if (userResult.success && userResult.data) {
      console.log('✅ User found!');
      console.log('📊 User data:', {
        id: userResult.data.id,
        email: userResult.data.email,
        role: userResult.data.role,
        created_at: userResult.data.created_at
      });
    } else {
      console.log('❌ User not found in database');
      console.log('💡 You need to register this user first');
      console.log('🔗 Go to: http://localhost:3000/auth and register');
    }
    
  } catch (error) {
    console.error('💥 Error checking user:', error);
  }
}

// Запускаем проверку
checkUsers()
  .then(() => {
    console.log('\n🏁 User check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 User check failed:', error);
    process.exit(1);
  });