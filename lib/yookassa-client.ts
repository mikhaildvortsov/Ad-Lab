import { YooCheckout } from '@a2seven/yoo-checkout';

// ЮKassa клиент конфигурация
const yooCheckout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID!,
  secretKey: process.env.YOOKASSA_SECRET_KEY!,
});

// Интерфейсы для ЮKassa
export interface YooKassaPaymentRequest {
  amount: {
    value: string;
    currency: 'RUB';
  };
  payment_method_data: {
    type: 'sbp';
  };
  confirmation: {
    type: 'qr';
    return_url?: string;
  };
  description: string;
  metadata?: Record<string, any>;
  capture?: boolean;
}

export interface YooKassaPaymentResponse {
  id: string;
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  amount: {
    value: string;
    currency: 'RUB';
  };
  description: string;
  confirmation: {
    type: 'qr';
    confirmation_data: string; // QR код данные
  };
  created_at: string;
  metadata?: Record<string, any>;
}

export interface CreateSBPPaymentParams {
  amount: number;
  description: string;
  orderId: string;
  userId: string;
  planId?: string;
  returnUrl?: string;
  metadata?: Record<string, any>;
}

export interface SBPPaymentResult {
  success: boolean;
  paymentId?: string;
  qrData?: string;
  amount?: number;
  currency?: string;
  description?: string;
  orderId?: string;
  status?: string;
  expiresAt?: Date;
  error?: string;
}

// Создание СБП платежа через ЮKassa
export async function createSBPPayment(params: CreateSBPPaymentParams): Promise<SBPPaymentResult> {
  try {
    // Проверяем наличие необходимых env переменных
    if (!process.env.YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY) {
      return {
        success: false,
        error: 'ЮKassa не настроена. Проверьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в переменных окружения.'
      };
    }

    const {
      amount,
      description,
      orderId,
      userId,
      planId,
      returnUrl = `${process.env.NEXTAUTH_URL}/payment/success`,
      metadata = {}
    } = params;

    // Подготавливаем данные для ЮKassa
    const paymentData: YooKassaPaymentRequest = {
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB'
      },
      payment_method_data: {
        type: 'sbp'
      },
      confirmation: {
        type: 'qr',
        return_url: returnUrl
      },
      description: description,
      metadata: {
        orderId,
        userId,
        planId,
        source: 'adlab_app',
        ...metadata
      },
      capture: true // Автоматическое списание
    };

    console.log('Creating ЮKassa payment:', {
      amount: paymentData.amount,
      description: paymentData.description,
      orderId
    });

    // Создаем платеж в ЮKassa
    const payment = await yooCheckout.createPayment(paymentData, orderId);

    console.log('ЮKassa payment created:', {
      paymentId: payment.id,
      status: payment.status,
      confirmationType: payment.confirmation?.type
    });

    // Рассчитываем время истечения (обычно 15 минут для СБП)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    return {
      success: true,
      paymentId: payment.id,
      qrData: payment.confirmation?.confirmation_data || '',
      amount: parseFloat(payment.amount.value),
      currency: payment.amount.currency,
      description: payment.description || '',
      orderId: orderId,
      status: payment.status,
      expiresAt: expiresAt
    };

  } catch (error: any) {
    console.error('ЮKassa payment creation error:', error);
    
    // Обрабатываем различные типы ошибок ЮKassa
    let errorMessage = 'Ошибка при создании платежа';
    
    if (error.response?.data) {
      const yooError = error.response.data;
      if (yooError.error_code) {
        errorMessage = `ЮKassa ошибка: ${yooError.error_code} - ${yooError.description || 'Неизвестная ошибка'}`;
      }
    } else if (error.message) {
      errorMessage = `Ошибка соединения: ${error.message}`;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

// Получение статуса платежа
export async function getPaymentStatus(paymentId: string): Promise<{
  success: boolean;
  status?: string;
  paid?: boolean;
  error?: string;
}> {
  try {
    if (!process.env.YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY) {
      return {
        success: false,
        error: 'ЮKassa не настроена'
      };
    }

    const payment = await yooCheckout.getPayment(paymentId);
    
    return {
      success: true,
      status: payment.status,
      paid: payment.status === 'succeeded'
    };

  } catch (error: any) {
    console.error('Error getting payment status:', error);
    return {
      success: false,
      error: error.message || 'Ошибка получения статуса платежа'
    };
  }
}

// Отмена платежа
export async function cancelPayment(paymentId: string, reason: string = 'Отменен пользователем'): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!process.env.YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY) {
      return {
        success: false,
        error: 'ЮKassa не настроена'
      };
    }

    await yooCheckout.cancelPayment(paymentId, {
      party: 'merchant',
      reason: reason
    });

    return { success: true };

  } catch (error: any) {
    console.error('Error canceling payment:', error);
    return {
      success: false,
      error: error.message || 'Ошибка отмены платежа'
    };
  }
}

// Проверка настройки ЮKassa
export function isYooKassaConfigured(): boolean {
  return !!(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY);
}

// Тестовый запрос для проверки соединения
export async function testYooKassaConnection(): Promise<{
  success: boolean;
  configured: boolean;
  error?: string;
}> {
  const configured = isYooKassaConfigured();
  
  if (!configured) {
    return {
      success: false,
      configured: false,
      error: 'ЮKassa переменные окружения не настроены'
    };
  }

  try {
    // Создаем тестовый платеж на 1 рубль для проверки
    const testPayment = await createSBPPayment({
      amount: 1,
      description: 'Тестовый платеж для проверки соединения',
      orderId: `test_${Date.now()}`,
      userId: 'test_user',
      metadata: { test: true }
    });

    if (testPayment.success && testPayment.paymentId) {
      // Сразу отменяем тестовый платеж
      await cancelPayment(testPayment.paymentId, 'Тестовый платеж');
    }

    return {
      success: testPayment.success,
      configured: true,
      error: testPayment.error
    };

  } catch (error: any) {
    return {
      success: false,
      configured: true,
      error: error.message || 'Ошибка тестирования соединения'
    };
  }
}

export { yooCheckout }; 