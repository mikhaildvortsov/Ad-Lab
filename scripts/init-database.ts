#!/usr/bin/env ts-node

/**
 * Database Initialization Script
 * 
 * This script initializes the PostgreSQL database with the required schema
 * and seed data for the Ad Lab application.
 * 
 * Usage:
 * - Development: npm run db:init
 * - Production: Use this script during deployment
 */

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { query, healthCheck, initializeDatabase } from '@/lib/database';

async function runSQLFile(filename: string): Promise<void> {
  try {
    const sqlPath = path.join(process.cwd(), 'lib', filename);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log(`Executing ${filename}...`);
    await query(sql);
    console.log(`✅ ${filename} executed successfully`);
  } catch (error) {
    console.error(`❌ Error executing ${filename}:`, error);
    throw error;
  }
}

async function checkDatabaseConnection(): Promise<void> {
  console.log('🔗 Checking database connection...');
  console.log('📊 DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  if (process.env.DATABASE_URL) {
    // Show only the host part for security
    const url = new URL(process.env.DATABASE_URL);
    console.log('🌐 Host:', url.hostname);
    console.log('🔌 Port:', url.port);
  }
  
  const isHealthy = await healthCheck();
  if (!isHealthy) {
    throw new Error('Database connection failed');
  }
  
  console.log('✅ Database connection successful');
}

async function checkTablesExist(): Promise<boolean> {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'subscription_plans', 'user_subscriptions', 'payments', 'query_history', 'usage_statistics')
    `);
    
    const existingTables = result.rows.map(row => row.table_name);
    console.log('📋 Existing tables:', existingTables);
    
    return existingTables.length === 6; // All 6 tables exist
  } catch (error) {
    console.log('⚠️  Error checking tables (probably none exist yet):', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

async function seedDefaultData(): Promise<void> {
  console.log('🌱 Seeding default data...');
  
  try {
    // Check if subscription plans already exist
    const plansResult = await query('SELECT COUNT(*) as count FROM subscription_plans');
    const plansCount = parseInt(plansResult.rows[0].count);
    
    if (plansCount > 0) {
      console.log('📦 Subscription plans already exist, skipping seed data');
      return;
    }
    
    // Insert default subscription plans
    await query(`
      INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, max_queries_per_month, max_tokens_per_query) VALUES
      ('Week', 'Недельный доступ ко всем функциям', 1990.00, NULL, '["Полный доступ на 7 дней", "Неограниченные улучшения", "Все функции приложения", "Поддержка 24/7"]', -1, -1),
      ('Month', 'Месячный доступ со скидкой', 2990.00, NULL, '["Полный доступ на 30 дней", "Неограниченные улучшения", "Все функции приложения", "Приоритетная поддержка", "Экономия 57%"]', -1, -1),
      ('Quarter', 'Максимальная экономия на 3 месяца', 9990.00, NULL, '["Полный доступ на 90 дней", "Неограниченные улучшения", "Все функции приложения", "VIP поддержка", "Максимальная экономия"]', -1, -1);
    `);
    
    console.log('✅ Default subscription plans created');
  } catch (error) {
    console.error('❌ Error seeding default data:', error);
    throw error;
  }
}

async function createIndexes(): Promise<void> {
  console.log('🔍 Creating database indexes...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
    'CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider, provider_id);',
    'CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);',
    'CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);',
    'CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_payment_id);',
    'CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_query_history_session_id ON query_history(session_id);',
    'CREATE INDEX IF NOT EXISTS idx_query_history_created_at ON query_history(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_usage_statistics_user_period ON usage_statistics(user_id, period_start);'
  ];
  
  for (const indexSql of indexes) {
    try {
      await query(indexSql);
    } catch (error) {
      console.log(`⚠️  Index already exists or error:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  console.log('✅ Database indexes created');
}

async function main(): Promise<void> {
  try {
    console.log('🚀 Starting database initialization...\n');
    
    // Step 1: Check database connection
    await checkDatabaseConnection();
    
    // Step 2: Check if tables already exist
    const tablesExist = await checkTablesExist();
    
    if (tablesExist) {
      console.log('📋 All tables already exist, skipping schema creation');
    } else {
      console.log('📋 Creating database schema...');
      await runSQLFile('database-schema.sql');
    }
    
    // Step 3: Create indexes (if not exist)
    await createIndexes();
    
    // Step 4: Seed default data
    await seedDefaultData();
    
    // Step 5: Final initialization
    await initializeDatabase();
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update your .env.local with the correct DATABASE_URL');
    console.log('   2. Make sure your PostgreSQL server is running');
    console.log('   3. Test the connection by running your Next.js app');
    
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  main().then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  }).catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
}

export { main as initDatabase }; 