import { NextRequest, NextResponse } from 'next/server';
import { createSBPPayment, getPaymentStatus as getYooKassaPaymentStatus, isYooKassaConfigured } from '@/lib/yookassa-client';
import { BillingService } from '@/lib/services/billing-service';
import { UserService } from '@/lib/services/user-service';
import { PlanMapper } from '@/lib/services/plan-mapper';
import { getSession } from '@/lib/session';
import { v4 as uuidv4 } from 'uuid';

interface SBPPaymentRequest {
  planId: string;
  planName: string;
  amount: number;
  userId?: string;
  email?: string;
}

interface SBPPaymentResponse {
  success: boolean;
  paymentId: string;
  qrCode: string;
  qrUrl: string;
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  paymentUrl: string;
  status: 'pending' | 'completed' | 'failed';
  expiresAt: string;
}

// Создание СБП платежа
export async function POST(request: NextRequest) {
  try {
    // Проверяем настройку YooKassa
    if (!isYooKassaConfigured()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Платежная система не настроена. Обратитесь к администратору.' 
        },
        { status: 500 }
      );
    }

    // Получаем данные запроса
    const body: SBPPaymentRequest = await request.json();
    
    // Валидация входящих данных
    if (!body.planId || !body.planName || !body.amount) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Отсутствуют обязательные поля: planId, planName, amount' 
        },
        { status: 400 }
      );
    }

    if (body.amount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Сумма должна быть больше 0' 
        },
        { status: 400 }
      );
    }

    // Получаем текущую сессию пользователя
    const session = await getSession();
    const userId = session?.user?.id || body.userId;

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Необходима авторизация для создания платежа' 
        },
        { status: 401 }
      );
    }

    // Пользователь уже проверен через сессию, дополнительная проверка не нужна
    console.log('Creating payment for user:', { 
      userId, 
      email: session?.user?.email, 
      name: session?.user?.name 
    });

    // Проверяем существование тарифного плана
    let plan;
    const planResult = await PlanMapper.getSubscriptionPlanByFrontendId(body.planId);
    
    if (!planResult.success || !planResult.data) {
      // Используем fallback планы если БД недоступна
      const fallbackPlans = PlanMapper.getFallbackPlans();
      const fallbackPlan = fallbackPlans.find(p => p.id === body.planId);
      
      if (!fallbackPlan) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Тарифный план не найден' 
          },
          { status: 404 }
        );
      }
      
      // Конвертируем fallback план в формат БД
      plan = {
        id: fallbackPlan.id,
        name: fallbackPlan.name,
        price_monthly: fallbackPlan.price
      };
    } else {
      plan = planResult.data;
    }

    // Проверяем соответствие суммы
    if (Math.abs(body.amount - plan.price_monthly) > 0.01) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Сумма платежа не соответствует цене тарифного плана' 
        },
        { status: 400 }
      );
    }

    // Генерируем уникальный ID заказа
    const orderId = `adlab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Описание платежа
    const description = `Подписка "${plan.name}" - Ad Lab`;
    
    // Создаем платеж в базе данных со статусом pending
    const paymentResult = await BillingService.createPayment({
      user_id: userId,
      amount: body.amount,
      currency: 'RUB',
      payment_method: 'sbp',
      status: 'pending',
      external_payment_id: '', // Будет обновлен после создания в YooKassa
      metadata: {
        orderId,
        planId: body.planId,
        planName: body.planName,
        description
      }
    });

    if (!paymentResult.success || !paymentResult.data) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ошибка создания записи о платеже в базе данных' 
        },
        { status: 500 }
      );
    }

    const payment = paymentResult.data;

    // Создаем платеж в YooKassa
    const sbpResult = await createSBPPayment({
      amount: body.amount,
      description,
      orderId,
      userId,
      planId: body.planId,
      returnUrl: `${process.env.NEXTAUTH_URL}/payment/success?payment_id=${payment.id}`,
      metadata: {
        internalPaymentId: payment.id,
        userId,
        planId: body.planId
      }
    });

    if (!sbpResult.success) {
      // Обновляем статус платежа в БД на failed
      await BillingService.updatePayment(payment.id, {
        status: 'failed',
        failure_reason: sbpResult.error
      });

      return NextResponse.json(
        { 
          success: false, 
          error: sbpResult.error || 'Ошибка создания платежа в платежной системе' 
        },
        { status: 500 }
      );
    }

    // Обновляем запись в БД с данными от YooKassa
    await BillingService.updatePayment(payment.id, {
      external_payment_id: sbpResult.paymentId,
      status: 'pending',
      metadata: {
        ...payment.metadata,
        yookassaPaymentId: sbpResult.paymentId,
        qrData: sbpResult.qrData,
        expiresAt: sbpResult.expiresAt?.toISOString()
      }
    });

    // Формируем URL для СБП
    const qrUrl = sbpResult.qrData || '';
    const paymentUrl = `https://yoomoney.ru/checkout/payments/v2/contract?orderId=${sbpResult.paymentId}`;

    console.log('СБП платеж успешно создан:', {
      orderId,
      paymentId: sbpResult.paymentId,
      amount: body.amount,
      planId: body.planId,
      userId
    });

    const responseData: SBPPaymentResponse = {
      success: true,
      paymentId: sbpResult.paymentId || '',
      qrCode: sbpResult.qrData || '',
      qrUrl: qrUrl,
      amount: body.amount,
      currency: sbpResult.currency || 'RUB',
      description: description,
      orderId: orderId,
      paymentUrl: paymentUrl,
      status: 'pending',
      expiresAt: sbpResult.expiresAt?.toISOString() || new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Ошибка создания СБП платежа:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера при создании платежа' 
      },
      { status: 500 }
    );
  }
}

// Проверка статуса платежа
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const orderId = searchParams.get('orderId');
    const internalPaymentId = searchParams.get('internalPaymentId');

    if (!paymentId && !orderId && !internalPaymentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Требуется один из параметров: paymentId, orderId или internalPaymentId' 
        },
        { status: 400 }
      );
    }

    // Получаем сессию пользователя для проверки прав доступа
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Необходима авторизация' 
        },
        { status: 401 }
      );
    }

    let payment: any = null;

    // Находим платеж в БД
    if (internalPaymentId) {
      const paymentResult = await BillingService.getUserPayments(session.user.id, {
        limit: 1,
        page: 1
      });
      
      if (paymentResult.success && paymentResult.data) {
        payment = paymentResult.data.data.find((p: any) => p.id === internalPaymentId);
      }
    } else if (paymentId) {
      const paymentsResult = await BillingService.getUserPayments(session.user.id);
      if (paymentsResult.success && paymentsResult.data) {
        payment = paymentsResult.data.data.find((p: any) => p.external_payment_id === paymentId);
      }
    }

    if (!payment) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Платеж не найден или нет прав доступа' 
        },
        { status: 404 }
      );
    }

    // Проверяем статус в YooKassa если платеж еще pending
    if (payment.status === 'pending' && payment.external_payment_id) {
      const statusResult = await getYooKassaPaymentStatus(payment.external_payment_id);
      
      if (statusResult.success && statusResult.status) {
        let newStatus = payment.status;
        
        if (statusResult.status === 'succeeded') {
          newStatus = 'completed';
          
          // Активируем подписку при успешной оплате
          const planId = payment.metadata?.planId || payment.plan_id;
          if (planId) {
            await BillingService.createUserSubscription({
              user_id: session.user.id,
              plan_id: planId,
              payment_method: 'sbp',
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
              auto_renew: true
            });
          }
          
        } else if (statusResult.status === 'canceled') {
          newStatus = 'failed';
        }

        // Обновляем статус в БД если изменился
        if (newStatus !== payment.status) {
          await BillingService.updatePayment(payment.id, {
            status: newStatus,
            completed_at: newStatus === 'completed' ? new Date() : undefined
          });
          
          payment.status = newStatus;
        }
      }
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.external_payment_id,
      internalPaymentId: payment.id,
      orderId: payment.metadata?.orderId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.created_at,
      completedAt: payment.completed_at,
      paidAt: payment.status === 'completed' ? payment.completed_at : null
    });

  } catch (error: any) {
    console.error('Ошибка проверки статуса платежа:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера при проверке статуса платежа' 
      },
      { status: 500 }
    );
  }
} 