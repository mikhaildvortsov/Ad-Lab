#!/usr/bin/env ts-node

/**
 * Скрипт проверки готовности Tribute к продакшену
 * Запуск: npx ts-node scripts/check-tribute-production.ts
 */

import { config } from 'dotenv';

// Загружаем переменные окружения из .env.local (приоритет) и .env
config({ path: '.env.local' });
config();

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

class TributeProductionChecker {
  private results: CheckResult[] = [];

  check(name: string, condition: boolean, passMessage: string, failMessage: string): void {
    this.results.push({
      name,
      status: condition ? 'pass' : 'fail',
      message: condition ? passMessage : failMessage
    });
  }

  warn(name: string, message: string): void {
    this.results.push({
      name,
      status: 'warning',
      message
    });
  }

  async runChecks(): Promise<void> {
    console.log('🔍 Проверка готовности Tribute к продакшену...\n');

    // Проверка основных переменных окружения
    this.check(
      'TRIBUTE_API_KEY',
      !!process.env.TRIBUTE_API_KEY,
      'API ключ Tribute настроен',
      'TRIBUTE_API_KEY не установлен - получите ключ от Tribute'
    );

    this.check(
      'TRIBUTE_API_URL',
      !!process.env.TRIBUTE_API_URL,
      'URL API Tribute настроен',
      'TRIBUTE_API_URL не установлен - используется значение по умолчанию'
    );

    this.check(
      'TRIBUTE_WEBHOOK_SECRET',
      !!process.env.TRIBUTE_WEBHOOK_SECRET,
      'Webhook секрет Tribute настроен',
      'TRIBUTE_WEBHOOK_SECRET не установлен - КРИТИЧНО для безопасности в продакшене!'
    );

    // Проверка базовых настроек
    this.check(
      'NEXTAUTH_URL',
      !!process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('localhost'),
      'Production URL настроен',
      'NEXTAUTH_URL не настроен для продакшена или содержит localhost'
    );

    this.check(
      'NODE_ENV',
      process.env.NODE_ENV === 'production',
      'NODE_ENV установлен в production',
      'NODE_ENV не установлен в production'
    );

    // Проверка базы данных
    this.check(
      'DATABASE_URL',
      !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost'),
      'Production база данных настроена',
      'DATABASE_URL не настроена для продакшена'
    );

    // Проверка безопасности
    const webhookSecret = process.env.TRIBUTE_WEBHOOK_SECRET;
    if (webhookSecret) {
      this.check(
        'Webhook Secret Length',
        webhookSecret.length >= 32,
        'Webhook секрет достаточно длинный',
        'Webhook секрет слишком короткий (минимум 32 символа)'
      );
    }

    // Проверка SSL/HTTPS
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    if (nextAuthUrl) {
      this.check(
        'HTTPS Configuration',
        nextAuthUrl.startsWith('https://'),
        'HTTPS настроен',
        'NEXTAUTH_URL должен использовать HTTPS в продакшене'
      );
    }

    // Дополнительные рекомендации
    if (!process.env.TRIBUTE_MIN_AMOUNT) {
      this.warn('TRIBUTE_MIN_AMOUNT', 'Рекомендуется установить минимальную сумму платежа');
    }

    if (!process.env.TRIBUTE_MAX_AMOUNT) {
      this.warn('TRIBUTE_MAX_AMOUNT', 'Рекомендуется установить максимальную сумму платежа');
    }

    this.displayResults();
  }

  private displayResults(): void {
    console.log('📊 Результаты проверки:\n');

    let passCount = 0;
    let failCount = 0;
    let warningCount = 0;

    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      console.log(`${icon} ${result.name}: ${result.message}`);

      if (result.status === 'pass') passCount++;
      else if (result.status === 'fail') failCount++;
      else warningCount++;
    });

    console.log('\n📈 Статистика:');
    console.log(`✅ Пройдено: ${passCount}`);
    console.log(`❌ Ошибки: ${failCount}`);
    console.log(`⚠️  Предупреждения: ${warningCount}`);

    if (failCount === 0) {
      console.log('\n🎉 Tribute готов к развертыванию в продакшене!');
    } else {
      console.log('\n🚨 Исправьте ошибки перед развертыванием в продакшене!');
    }

    console.log('\n📚 Дополнительные рекомендации для продакшена:');
    console.log('1. Настройте мониторинг webhook эндпоинтов');
    console.log('2. Проверьте логирование для отладки платежей');
    console.log('3. Настройте алерты на неудачные платежи');
    console.log('4. Протестируйте полный цикл платежей в тестовой среде');
    console.log('5. Убедитесь, что у вас есть бэкап базы данных');
    console.log('6. Проверьте rate limiting для API эндпоинтов');
  }
}

// Запуск проверки
async function main() {
  const checker = new TributeProductionChecker();
  await checker.runChecks();
}

if (require.main === module) {
  main().catch(console.error);
}

export default TributeProductionChecker; 