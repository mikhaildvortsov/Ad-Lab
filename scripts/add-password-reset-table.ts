import * as dotenv from 'dotenv';
import { query } from '@/lib/database';

// Загружаем переменные окружения
dotenv.config();

async function addPasswordResetTable() {
  console.log('🔧 Adding password_reset_tokens table...');
  
  try {
    
    // Проверяем, существует ли таблица
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'password_reset_tokens'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ Table password_reset_tokens already exists');
      return;
    }
    
    // Создаем таблицу
    await query(`
      CREATE TABLE password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Создаем индексы для быстрого поиска
    await query(`
      CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
    `);
    
    await query(`
      CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
    `);
    
    await query(`
      CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
    `);
    
    console.log('✅ Successfully created password_reset_tokens table with indexes');
    
  } catch (error) {
    console.error('❌ Error adding password reset table:', error);
    throw error;
  }
}

// Запускаем если файл вызван напрямую
if (require.main === module) {
  addPasswordResetTable()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { addPasswordResetTable };