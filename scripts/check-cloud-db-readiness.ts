#!/usr/bin/env ts-node

/**
 * Cloud Database Readiness Check Script
 * 
 * This script checks if your project is ready for cloud database creation
 * and guides you through the setup process.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  action?: string;
}

function checkFile(path: string, description: string): CheckResult {
  const exists = existsSync(path);
  return {
    name: description,
    status: exists ? 'pass' : 'fail',
    message: exists ? `✅ ${description} найден` : `❌ ${description} не найден`,
    action: exists ? undefined : `Создайте файл ${path}`
  };
}

function checkPackageJson(): CheckResult {
  const packagePath = join(process.cwd(), 'package.json');
  
  if (!existsSync(packagePath)) {
    return {
      name: 'package.json',
      status: 'fail',
      message: '❌ package.json не найден',
      action: 'Убедитесь, что вы в корневой папке проекта'
    };
  }

  try {
    const packageContent = JSON.parse(readFileSync(packagePath, 'utf8'));
    const hasDbDependencies = packageContent.dependencies?.['pg'] && packageContent.dependencies?.['@types/pg'];
    const hasDbScripts = packageContent.scripts?.['db:init'] && packageContent.scripts?.['test:neon'];

    if (hasDbDependencies && hasDbScripts) {
      return {
        name: 'package.json конфигурация',
        status: 'pass',
        message: '✅ package.json готов для работы с базой данных'
      };
    } else {
      return {
        name: 'package.json конфигурация',
        status: 'warning',
        message: '⚠️ package.json требует обновления',
        action: 'Установите зависимости: npm install'
      };
    }
  } catch (error) {
    return {
      name: 'package.json валидация',
      status: 'fail',
      message: '❌ Ошибка чтения package.json',
      action: 'Проверьте синтаксис package.json'
    };
  }
}

function checkEnvExample(): CheckResult {
  const envPath = join(process.cwd(), 'env.example');
  
  if (!existsSync(envPath)) {
    return {
      name: 'env.example',
      status: 'fail',
      message: '❌ env.example не найден'
    };
  }

  try {
    const envContent = readFileSync(envPath, 'utf8');
    const hasDatabaseUrl = envContent.includes('DATABASE_URL');
    const hasNeonComment = envContent.includes('Neon Tech');

    if (hasDatabaseUrl && hasNeonComment) {
      return {
        name: 'env.example конфигурация',
        status: 'pass',
        message: '✅ env.example готов для Neon.tech'
      };
    } else {
      return {
        name: 'env.example конфигурация',
        status: 'warning',
        message: '⚠️ env.example требует обновления',
        action: 'Добавьте DATABASE_URL и настройки Neon.tech'
      };
    }
  } catch (error) {
    return {
      name: 'env.example валидация',
      status: 'fail',
      message: '❌ Ошибка чтения env.example'
    };
  }
}

function checkEnvLocal(): CheckResult {
  const envPath = join(process.cwd(), '.env.local');
  
  if (!existsSync(envPath)) {
    return {
      name: '.env.local',
      status: 'warning',
      message: '⚠️ .env.local не найден',
      action: 'Скопируйте env.example в .env.local и заполните переменные'
    };
  }

  try {
    const envContent = readFileSync(envPath, 'utf8');
    const hasDatabaseUrl = envContent.includes('DATABASE_URL=');
    const hasRealUrl = envContent.includes('neon.tech') || envContent.includes('postgresql://');

    if (hasDatabaseUrl && hasRealUrl) {
      return {
        name: '.env.local конфигурация',
        status: 'pass',
        message: '✅ .env.local настроен'
      };
    } else if (hasDatabaseUrl) {
      return {
        name: '.env.local конфигурация',
        status: 'warning',
        message: '⚠️ .env.local требует настройки DATABASE_URL',
        action: 'Добавьте реальную строку подключения из Neon.tech'
      };
    } else {
      return {
        name: '.env.local конфигурация',
        status: 'fail',
        message: '❌ .env.local не содержит DATABASE_URL',
        action: 'Добавьте DATABASE_URL в .env.local'
      };
    }
  } catch (error) {
    return {
      name: '.env.local валидация',
      status: 'fail',
      message: '❌ Ошибка чтения .env.local'
    };
  }
}

async function main(): Promise<void> {
  console.log('🔍 Проверка готовности к созданию облачной базы данных...\n');

  const checks: CheckResult[] = [
    // Проверка основных файлов
    checkFile(join(process.cwd(), 'lib', 'database-schema.sql'), 'Схема базы данных'),
    checkFile(join(process.cwd(), 'scripts', 'init-database.ts'), 'Скрипт инициализации'),
    checkFile(join(process.cwd(), 'lib', 'database.ts'), 'Конфигурация базы данных'),
    checkFile(join(process.cwd(), 'lib', 'database-types.ts'), 'Типы базы данных'),
    
    // Проверка сервисов
    checkFile(join(process.cwd(), 'lib', 'services', 'user-service.ts'), 'Сервис пользователей'),
    checkFile(join(process.cwd(), 'lib', 'services', 'query-service.ts'), 'Сервис запросов'),
    checkFile(join(process.cwd(), 'lib', 'services', 'billing-service.ts'), 'Сервис билинга'),
    
    // Проверка конфигурации
    checkPackageJson(),
    checkEnvExample(),
    checkEnvLocal(),
  ];

  // Подсчет статистики
  const passed = checks.filter(c => c.status === 'pass').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  const warnings = checks.filter(c => c.status === 'warning').length;

  // Вывод результатов
  checks.forEach(check => {
    console.log(check.message);
    if (check.action) {
      console.log(`   👉 ${check.action}`);
    }
  });

  console.log('\n📊 Результаты проверки:');
  console.log(`✅ Пройдено: ${passed}`);
  console.log(`⚠️ Предупреждения: ${warnings}`);
  console.log(`❌ Ошибки: ${failed}`);

  if (failed > 0) {
    console.log('\n🚨 Обнаружены критические ошибки!');
    console.log('Исправьте их перед созданием облачной базы данных.');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️ Обнаружены предупреждения.');
    console.log('Рекомендуется исправить их для оптимальной работы.');
  } else {
    console.log('\n🎉 Все проверки пройдены успешно!');
    console.log('Вы готовы к созданию облачной базы данных.');
  }

  console.log('\n📋 Следующие шаги:');
  console.log('1. Прочитайте инструкцию: md/CLOUD_DATABASE_SETUP.md');
  console.log('2. Создайте аккаунт в Neon.tech: https://neon.tech');
  console.log('3. Получите DATABASE_URL и обновите .env.local');
  console.log('4. Запустите: npm run db:init');
  console.log('5. Протестируйте: npm run test:neon');

  process.exit(0);
}

// Запуск проверки
main().catch(error => {
  console.error('❌ Ошибка при проверке:', error);
  process.exit(1);
}); 