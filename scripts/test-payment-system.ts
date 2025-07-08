import { testYooKassaConnection, createSBPPayment, getPaymentStatus } from '../lib/yookassa-client';
import { BillingService } from '../lib/services/billing-service';
import { UserService } from '../lib/services/user-service';
import dotenv from 'dotenv';
import path from 'path';

// Загружаем переменные окружения
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration?: number;
}

class PaymentSystemTester {
  private results: TestResult[] = [];

  private async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Запуск теста: ${testName}`);
      await testFn();
      
      const duration = Date.now() - startTime;
      this.results.push({
        test: testName,
        status: 'PASS',
        message: 'Тест прошел успешно',
        duration
      });
      
      console.log(`✅ ${testName} - PASS (${duration}ms)`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.results.push({
        test: testName,
        status: 'FAIL',
        message: error.message || 'Неизвестная ошибка',
        duration
      });
      
      console.log(`❌ ${testName} - FAIL (${duration}ms): ${error.message}`);
    }
  }

  private skipTest(testName: string, reason: string): void {
    this.results.push({
      test: testName,
      status: 'SKIP',
      message: reason
    });
    
    console.log(`⏭️  ${testName} - SKIP: ${reason}`);
  }

  async testEnvironmentSetup(): Promise<void> {
    await this.runTest('Проверка переменных окружения', async () => {
      const requiredVars = [
        'YOOKASSA_SHOP_ID',
        'YOOKASSA_SECRET_KEY',
        'DATABASE_URL',
        'JWT_SECRET'
      ];

      const missing = requiredVars.filter(varName => !process.env[varName]);
      
      if (missing.length > 0) {
        throw new Error(`Отсутствуют переменные окружения: ${missing.join(', ')}`);
      }

      // Проверяем длину JWT_SECRET
      if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET должен быть минимум 32 символа');
      }
    });
  }

  async testYooKassaConfiguration(): Promise<void> {
    await this.runTest('Тестирование подключения к YooKassa', async () => {
      const result = await testYooKassaConnection();
      
      if (!result.success) {
        throw new Error(result.error || 'Ошибка подключения к YooKassa');
      }
      
      if (!result.configured) {
        throw new Error('YooKassa не настроена');
      }
    });
  }

  async testDatabaseConnection(): Promise<void> {
    await this.runTest('Тестирование подключения к базе данных', async () => {
      // Тестируем получение планов подписки
      const plansResult = await BillingService.getSubscriptionPlans();
      
      if (!plansResult.success) {
        throw new Error(plansResult.error || 'Ошибка получения планов из БД');
      }

      if (!plansResult.data || plansResult.data.length === 0) {
        throw new Error('В базе данных нет планов подписки');
      }

      console.log(`   📋 Найдено планов подписки: ${plansResult.data.length}`);
    });
  }

  async testPaymentCreation(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      this.skipTest('Создание тестового платежа', 'Пропущено в production');
      return;
    }

    await this.runTest('Создание тестового платежа', async () => {
      const testOrderId = `test_${Date.now()}`;
      
      const paymentResult = await createSBPPayment({
        amount: 1, // 1 рубль для теста
        description: 'Тестовый платеж системы Ad Lab',
        orderId: testOrderId,
        userId: 'test_user_id',
        planId: 'test_plan',
        metadata: {
          test: true,
          environment: 'test'
        }
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Ошибка создания платежа');
      }

      if (!paymentResult.paymentId) {
        throw new Error('Не получен ID платежа');
      }

      console.log(`   💳 Создан тестовый платеж: ${paymentResult.paymentId}`);
      console.log(`   🔗 QR данные: ${paymentResult.qrData ? 'Получены' : 'Отсутствуют'}`);

      // Тестируем получение статуса
      const statusResult = await getPaymentStatus(paymentResult.paymentId);
      
      if (!statusResult.success) {
        console.warn(`   ⚠️  Не удалось получить статус платежа: ${statusResult.error}`);
      } else {
        console.log(`   📊 Статус платежа: ${statusResult.status}`);
      }
    });
  }

  async testBillingService(): Promise<void> {
    await this.runTest('Тестирование BillingService', async () => {
      // Тестируем получение планов
      const plansResult = await BillingService.getSubscriptionPlans();
      if (!plansResult.success) {
        throw new Error('Ошибка получения планов');
      }

      // Тестируем получение конкретного плана
      if (plansResult.data && plansResult.data.length > 0) {
        const planId = plansResult.data[0].id;
        const planResult = await BillingService.getSubscriptionPlan(planId);
        
        if (!planResult.success) {
          throw new Error('Ошибка получения плана по ID');
        }

        console.log(`   📋 Тестовый план: ${planResult.data?.name} - ₽${planResult.data?.price_monthly}`);
      }
    });
  }

  printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ ПЛАТЕЖНОЙ СИСТЕМЫ');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    console.log(`✅ Прошло успешно: ${passed}`);
    console.log(`❌ Провалилось: ${failed}`);
    console.log(`⏭️  Пропущено: ${skipped}`);
    console.log(`📈 Общий результат: ${passed}/${passed + failed + skipped}`);

    if (failed > 0) {
      console.log('\n❌ НЕУДАЧНЫЕ ТЕСТЫ:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   • ${result.test}: ${result.message}`);
        });
    }

    if (skipped > 0) {
      console.log('\n⏭️  ПРОПУЩЕННЫЕ ТЕСТЫ:');
      this.results
        .filter(r => r.status === 'SKIP')
        .forEach(result => {
          console.log(`   • ${result.test}: ${result.message}`);
        });
    }

    const totalTime = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);
    console.log(`\n⏱️  Общее время выполнения: ${totalTime}ms`);

    if (failed === 0) {
      console.log('\n🎉 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО! Платежная система готова к работе.');
    } else {
      console.log('\n⚠️  ЕСТЬ ПРОБЛЕМЫ! Исправьте ошибки перед запуском в production.');
      process.exit(1);
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Запуск тестирования платежной системы Ad Lab...\n');

    // Последовательно запускаем все тесты
    await this.testEnvironmentSetup();
    await this.testDatabaseConnection();
    await this.testYooKassaConfiguration();
    await this.testBillingService();
    await this.testPaymentCreation();

    this.printSummary();
  }
}

// Запуск тестирования
async function main() {
  const tester = new PaymentSystemTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('💥 Критическая ошибка при тестировании:', error);
    process.exit(1);
  }
}

// Запуск только если файл выполняется напрямую
if (require.main === module) {
  main().catch(console.error);
}

export { PaymentSystemTester }; 