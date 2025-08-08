import * as dotenv from 'dotenv';
import { query } from '@/lib/database';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

async function addPromoTables() {
  console.log('🔧 Adding promo code tables...');
  
  try {
    
    // Проверяем, существует ли таблица promo_codes
    const promoCodesTableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'promo_codes'
      );
    `);
    
    if (!promoCodesTableExists.rows[0].exists) {
      console.log('📝 Creating promo_codes table...');
      
      // Создаем таблицу promo_codes
      await query(`
        CREATE TABLE promo_codes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          code VARCHAR(50) UNIQUE NOT NULL,
          description TEXT,
          max_uses INTEGER DEFAULT 1,
          current_uses INTEGER DEFAULT 0,
          expires_at TIMESTAMP WITH TIME ZONE,
          access_duration_days INTEGER DEFAULT 30,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Создаем индексы для promo_codes
      await query(`
        CREATE INDEX idx_promo_codes_code ON promo_codes(code);
      `);
      
      await query(`
        CREATE INDEX idx_promo_codes_active ON promo_codes(is_active);
      `);
      
      console.log('✅ Successfully created promo_codes table with indexes');
    } else {
      console.log('✅ Table promo_codes already exists');
    }
    
    // Проверяем, существует ли таблица user_promo_activations
    const userPromoActivationsTableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_promo_activations'
      );
    `);
    
    if (!userPromoActivationsTableExists.rows[0].exists) {
      console.log('📝 Creating user_promo_activations table...');
      
      // Создаем таблицу user_promo_activations
      await query(`
        CREATE TABLE user_promo_activations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
          activated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          UNIQUE(user_id, promo_code_id)
        );
      `);
      
      // Создаем индексы для user_promo_activations
      await query(`
        CREATE INDEX idx_user_promo_activations_user_id ON user_promo_activations(user_id);
      `);
      
      await query(`
        CREATE INDEX idx_user_promo_activations_expires ON user_promo_activations(expires_at);
      `);
      
      console.log('✅ Successfully created user_promo_activations table with indexes');
    } else {
      console.log('✅ Table user_promo_activations already exists');
    }
    
    // Добавляем тестовые промо-коды
    console.log('🌱 Seeding default promo codes...');
    
    const promoCodesResult = await query('SELECT COUNT(*) as count FROM promo_codes');
    const promoCodesCount = parseInt(promoCodesResult.rows[0].count);
    
    if (promoCodesCount === 0) {
      await query(`
        INSERT INTO promo_codes (code, description, max_uses, access_duration_days) VALUES
        ('WELCOME2024', 'Добро пожаловать! Бесплатный доступ на 7 дней', 1000, 7),
        ('TESTFULL', 'Тестовый код с полным доступом на 30 дней', 100, 30),
        ('BETA2024', 'Бета-тестирование - доступ на 14 дней', 500, 14);
      `);
      
      console.log('✅ Default promo codes created');
    } else {
      console.log('✅ Promo codes already exist, skipping...');
    }
    
  } catch (error) {
    console.error('❌ Error adding promo tables:', error);
    throw error;
  }
}

// Запускаем если файл вызван напрямую
if (require.main === module) {
  addPromoTables()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { addPromoTables };