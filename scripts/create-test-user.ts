import dotenv from 'dotenv';
import { UserService } from '@/lib/services/user-service';
import bcrypt from 'bcryptjs';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

async function createTestUser() {
  console.log('👤 Creating test user...\n');
  
  const email = 'dvortsov.mish@yandex.ru';
  const password = 'testpassword123';
  const name = 'Test User';
  
  try {
    // Проверяем, существует ли пользователь
    console.log('🔍 Checking if user exists:', email);
    const existingUser = await UserService.getUserByEmail(email);
    
    if (existingUser.success && existingUser.data) {
      console.log('✅ User already exists!');
      console.log('📊 User data:', {
        id: existingUser.data.id,
        email: existingUser.data.email,
        role: existingUser.data.role
      });
      return;
    }
    
    // Хешируем пароль
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Создаем пользователя
    console.log('👤 Creating user...');
    const userResult = await UserService.createUser({
      email: email,
      password_hash: passwordHash,
      name: name,
      role: 'user'
    });
    
    if (userResult.success) {
      console.log('✅ Test user created successfully!');
      console.log('📊 User data:', {
        id: userResult.data?.id,
        email: email,
        name: name,
        role: 'user'
      });
      console.log('\n🔑 Credentials:');
      console.log('   Email:', email);
      console.log('   Password:', password);
    } else {
      console.log('❌ Failed to create user:', userResult.error);
    }
    
  } catch (error) {
    console.error('💥 Error creating user:', error);
  }
}

// Запускаем создание пользователя
createTestUser()
  .then(() => {
    console.log('\n🏁 Test user creation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test user creation failed:', error);
    process.exit(1);
  });