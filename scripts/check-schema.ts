#!/usr/bin/env ts-node
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { query, healthCheck, closePool } from '@/lib/database';
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
async function checkUsersTableSchema(): Promise<boolean> {
  console.log('📋 Checking users table schema...');
  try {
    const result = await query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log('\nCurrent users table structure:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    const hasPasswordHash = result.rows.some(row => row.column_name === 'password_hash');
    console.log(`\npassword_hash column exists: ${hasPasswordHash}`);
    return hasPasswordHash;
  } catch (error) {
    console.error('❌ Error checking users table schema:', error);
    return false;
  }
}
async function addMissingPasswordHashColumn(): Promise<void> {
  console.log('🔧 Adding missing password_hash column...');
  try {
    await query('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)');
    console.log('✅ password_hash column added successfully');
  } catch (error) {
    console.error('❌ Error adding password_hash column:', error);
    throw error;
  }
}
async function main(): Promise<void> {
  try {
    console.log('🚀 Starting database schema check...\n');
    await checkDatabaseConnection();
    const hasPasswordHash = await checkUsersTableSchema();
    if (!hasPasswordHash) {
      console.log('\n⚠️  password_hash column is missing. This will cause registration to fail.');
      await addMissingPasswordHashColumn();
      console.log('\n🔍 Verifying the fix...');
      const nowHasPasswordHash = await checkUsersTableSchema();
      if (nowHasPasswordHash) {
        console.log('✅ Schema fix successful!');
      } else {
        throw new Error('Failed to add password_hash column');
      }
    } else {
      console.log('\n✅ Database schema looks good!');
    }
    console.log('\n🎉 Schema check completed successfully!');
  } catch (error) {
    console.error('\n❌ Schema check failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}
main();
