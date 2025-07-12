#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { healthCheck, query } from '@/lib/database';

async function testNeonConnection() {
  console.log('🔗 Тестирование подключения к neon.tech...\n');
  
  try {
    // 1. Проверка переменной окружения
    console.log('1. Проверка DATABASE_URL...');
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL не найден в переменных окружения');
    }
    
    console.log('✅ DATABASE_URL найден');
    console.log(`   Полный URL: ${dbUrl.substring(0, 50)}...`);
    
    // Парсинг URL для детального анализа
    try {
      const url = new URL(dbUrl);
      console.log(`   Протокол: ${url.protocol}`);
      console.log(`   Хост: ${url.hostname}`);
      console.log(`   Порт: ${url.port || '5432'}`);
      console.log(`   База данных: ${url.pathname.substring(1)}`);
      console.log(`   Пользователь: ${url.username}`);
      console.log(`   Параметры: ${url.search}`);
      
      // Проверка на neon.tech
      if (!url.hostname.includes('neon.tech')) {
        console.log('❌ ПРОБЛЕМА: URL не содержит neon.tech!');
        console.log('   Это объясняет ошибку подключения.');
        console.log('   Проверьте правильность DATABASE_URL в .env.local');
        return;
      }
      
      // Проверка на localhost
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        console.log('❌ ПРОБЛЕМА: URL указывает на localhost!');
        console.log('   Замените на connection string от neon.tech');
        return;
      }
      
      console.log('✅ URL выглядит корректно для neon.tech');
      
    } catch (urlError) {
      console.log('❌ Ошибка парсинга URL:', urlError);
      console.log('   Проверьте формат DATABASE_URL');
      return;
    }

    // 2. Проверка подключения к базе данных
    console.log('\n2. Проверка подключения к базе данных...');
    const isHealthy = await healthCheck();
    
    if (!isHealthy) {
      console.log('❌ Ошибка подключения к neon.tech:');
      console.log('Не удалось подключиться к базе данных');
      console.log('\n💡 Проверьте:');
      console.log('   1. Правильность DATABASE_URL в .env.local');
      console.log('   2. Наличие доступа к интернету');
      console.log('   3. Корректность настроек neon.tech');
      console.log('   4. Формат должен быть: postgresql://user:pass@host.neon.tech/db?sslmode=require');
      return;
    }
    
    console.log('✅ Подключение к neon.tech успешно!');

    // 3. Тестирование базовых операций
    console.log('\n3. Тестирование базовых операций...');
    
    // Получение версии PostgreSQL
    const versionResult = await query('SELECT version()');
    console.log('✅ Базовые операции работают');
    console.log(`   PostgreSQL версия: ${versionResult.rows[0].version.split(' ')[0]} ${versionResult.rows[0].version.split(' ')[1]}`);
    
    // Получение информации о базе данных
    const dbInfoResult = await query('SELECT current_database(), current_user');
    console.log(`   База данных: ${dbInfoResult.rows[0].current_database}`);
    console.log(`   Пользователь: ${dbInfoResult.rows[0].current_user}`);

    // 4. Проверка существования таблиц
    console.log('\n4. Проверка существования таблиц...');
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  Таблицы не найдены. Запустите: npm run db:init');
    } else {
      console.log('✅ Найдены таблицы:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }

    // 5. Проверка расширений
    console.log('\n5. Проверка расширений PostgreSQL...');
    const extensionsResult = await query(`
      SELECT extname 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'pgcrypto')
    `);
    
    const extensions = extensionsResult.rows.map(row => row.extname);
    if (extensions.includes('uuid-ossp')) {
      console.log('✅ Расширение uuid-ossp установлено');
    } else {
      console.log('⚠️  Расширение uuid-ossp не найдено');
    }

    console.log('\n🎉 Подключение к neon.tech настроено успешно!');
    
  } catch (error) {
    console.log('❌ Ошибка подключения к neon.tech:');
    console.log(error instanceof Error ? error.message : String(error));
    console.log('\n💡 Проверьте:');
    console.log('   1. Правильность DATABASE_URL в .env.local');
    console.log('   2. Наличие доступа к интернету');
    console.log('   3. Корректность настроек neon.tech');
    console.log('   4. Формат должен быть: postgresql://user:pass@host.neon.tech/db?sslmode=require');
  }
}

// Запуск теста
testNeonConnection(); 