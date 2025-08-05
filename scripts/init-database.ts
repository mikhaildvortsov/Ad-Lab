#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { readFileSync } from 'fs';
import { join } from 'path';
import { query, healthCheck, initializeDatabase } from '@/lib/database';

async function runSQLFile(filename: string): Promise<void> {
  console.log(`📄 Running SQL file: ${filename}`);

  try {
    const sqlPath = join(process.cwd(), 'lib', filename);
    const sql = readFileSync(sqlPath, 'utf8');

    await query(sql);

    console.log(`✅ Successfully executed ${filename}`);
  } catch (error) {
    console.error(`❌ Error executing ${filename}:`, error);
    throw error;
  }
}

async function checkDatabaseConnection(): Promise<void> {
  console.log('🔗 Checking database connection...');
  console.log('📊 DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  if (process.env.DATABASE_URL) {

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
  console.log('📋 Checking if tables exist...');

  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const tables = result.rows.map(row => row.table_name);
    const requiredTables = [
      'users',
      'subscription_plans', 
      'user_subscriptions',
      'payments',
      'query_history',
      'usage_statistics'
    ];

    const missingTables = requiredTables.filter(table => !tables.includes(table));

    if (missingTables.length > 0) {
      console.log('❌ Missing tables:', missingTables.join(', '));
      return false;
    }

    console.log('✅ All required tables exist');
    return true;
  } catch (error) {
    console.log('❌ Error checking tables:', error);
    return false;
  }
}

async function seedDefaultData(): Promise<void> {
  console.log('🌱 Seeding default data...');

  try {

    const plansResult = await query('SELECT COUNT(*) as count FROM subscription_plans');
    const plansCount = parseInt(plansResult.rows[0].count);

    if (plansCount === 0) {
      console.log('📦 Creating default subscription plans...');

      await query(`
        INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, currency, features, max_queries_per_month, max_tokens_per_query, is_active)
        VALUES 
        (gen_random_uuid(), 'Week', 'Недельный доступ ко всем функциям', 1990, NULL, 'RUB',
         '["Полный доступ на 7 дней", "Неограниченные улучшения", "Все функции приложения", "Поддержка 24/7"]'::jsonb,
         NULL, NULL, true),
        (gen_random_uuid(), 'Month', 'Месячная подписка со скидкой', 2990, 29900, 'RUB',
         '["Полный доступ на 30 дней", "Неограниченные улучшения", "Все функции приложения", "Приоритетная поддержка", "Экономия 57%"]'::jsonb,
         NULL, NULL, true),
        (gen_random_uuid(), 'Quarter', 'Квартальная подписка с максимальной экономией', 9990, 99900, 'RUB',
         '["Полный доступ на 90 дней", "Неограниченные улучшения", "Все функции приложения", "VIP поддержка", "Максимальная экономия"]'::jsonb,
         NULL, NULL, true)
      `);

      console.log('✅ Default subscription plans created');
    } else {
      console.log('📦 Subscription plans already exist, skipping...');
    }

  } catch (error) {
    console.error('❌ Error seeding default data:', error);
    throw error;
  }
}

async function createIndexes(): Promise<void> {
  console.log('🗂️  Creating database indexes...');

  try {
    const indexes = [

      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id)',
      'CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)',

      'CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_query_history_session_id ON query_history(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_query_history_created_at ON query_history(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_query_history_success ON query_history(success)',

      'CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status)',
      'CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period ON user_subscriptions(started_at, expires_at)',

      'CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)',
      'CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)',

      'CREATE INDEX IF NOT EXISTS idx_usage_statistics_user_period ON usage_statistics(user_id, period_start, period_end)',
    ];

    for (const indexSQL of indexes) {
      await query(indexSQL);
    }

    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
}

async function main(): Promise<void> {
  try {
    console.log('🚀 Starting database initialization...\n');

    await checkDatabaseConnection();

    const tablesExist = await checkTablesExist();

    if (tablesExist) {
      console.log('📋 All tables already exist, skipping schema creation');
    } else {
      console.log('📋 Creating database schema...');
      await runSQLFile('database-schema.sql');
    }

    await createIndexes();

    await seedDefaultData();

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

main();
