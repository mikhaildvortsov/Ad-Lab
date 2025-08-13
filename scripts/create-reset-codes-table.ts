require('dotenv').config({ path: '.env.local' });
import { query } from '@/lib/database';

async function createResetCodesTable() {
  console.log('🔧 Creating password_reset_codes table...');
  
  try {
    // Удаляем старую таблицу токенов
    await query('DROP TABLE IF EXISTS password_reset_tokens CASCADE');
    console.log('🗑️ Dropped old password_reset_tokens table');
    
    // Создаем новую таблицу для кодов
    await query(`
      CREATE TABLE password_reset_codes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Создаем индексы
    await query(`
      CREATE INDEX idx_password_reset_codes_email ON password_reset_codes(email);
    `);
    
    await query(`
      CREATE INDEX idx_password_reset_codes_code ON password_reset_codes(code);
    `);
    
    await query(`
      CREATE INDEX idx_password_reset_codes_expires_at ON password_reset_codes(expires_at);
    `);
    
    console.log('✅ Successfully created password_reset_codes table with indexes');
    
  } catch (error) {
    console.error('❌ Error creating reset codes table:', error);
    throw error;
  }
}

// Запускаем если файл вызван напрямую
if (require.main === module) {
  createResetCodesTable().catch(console.error);
}

export { createResetCodesTable };
