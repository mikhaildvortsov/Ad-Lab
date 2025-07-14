import { v4 as uuidv4 } from 'uuid';

// Types for Tribute payment integration
export interface TributePaymentRequest {
  amount: number;
  currency: string;
  description: string;
  paymentId: string;
  userId: string;
  planName: string;
  returnUrl?: string;
  webhookUrl?: string;
}

export interface TributePaymentResponse {
  success: boolean;
  data?: {
    paymentUrl: string;
    tributeUrl: string;
    paymentId: string;
    orderId: string;
    amount: number;
    expiresAt: string;
  };
  error?: string;
}

export interface TributeStatusResponse {
  success: boolean;
  data?: {
    status: 'pending' | 'completed' | 'failed' | 'expired';
    paymentId: string;
    orderId: string;
    amount?: number;
    paidAt?: string;
  };
  error?: string;
}

// Configuration for Tribute integration
const TRIBUTE_CONFIG = {
  // Tribute app information
  BOT_USERNAME: '@tribute', // Main Tribute app
  API_URL: process.env.TRIBUTE_API_URL || 'https://api.tribute.tg/v1',
  WEBHOOK_SECRET: process.env.TRIBUTE_WEBHOOK_SECRET,
  
  // Payment settings
  PAYMENT_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MIN_AMOUNT: 100, // 100 rubles minimum
  MAX_AMOUNT: 300000, // 300,000 rubles maximum
  
  // Commission
  COMMISSION_RATE: 0.10, // 10% commission
};

export class TributeService {
  /**
   * Creates a payment through Tribute
   */
  static async createPayment(request: TributePaymentRequest): Promise<TributePaymentResponse> {
    try {
      // Validate amount
      if (request.amount < TRIBUTE_CONFIG.MIN_AMOUNT || request.amount > TRIBUTE_CONFIG.MAX_AMOUNT) {
        return {
          success: false,
          error: `Сумма должна быть от ${TRIBUTE_CONFIG.MIN_AMOUNT} до ${TRIBUTE_CONFIG.MAX_AMOUNT} рублей`
        };
      }

      // Generate unique order ID
      const orderId = `tribute_${request.paymentId}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + TRIBUTE_CONFIG.PAYMENT_TIMEOUT);

      // Try to call real Tribute API if configured
      if (process.env.TRIBUTE_API_KEY && process.env.TRIBUTE_API_URL) {
        try {
          const apiResponse = await this.callTributeAPI({
            orderId,
            amount: request.amount,
            currency: request.currency,
            description: request.description,
            userId: request.userId,
            planName: request.planName,
            returnUrl: request.returnUrl || `${process.env.NEXTAUTH_URL}/dashboard`,
            webhookUrl: request.webhookUrl || `${process.env.NEXTAUTH_URL}/api/payments/webhook`
          });

          if (apiResponse.success) {
            return {
              success: true,
              data: {
                paymentUrl: apiResponse.data.paymentUrl,
                tributeUrl: apiResponse.data.tributeUrl,
                paymentId: request.paymentId,
                orderId: orderId,
                amount: request.amount,
                expiresAt: expiresAt.toISOString()
              }
            };
          }
        } catch (apiError) {
          console.warn('Tribute API call failed, falling back to deep link:', apiError);
        }
      }

      // Fallback: create Telegram deep link to Tribute bot
      const tributePaymentData = {
        paymentId: request.paymentId,
        orderId: orderId,
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        userId: request.userId,
        planName: request.planName,
        returnUrl: request.returnUrl || `${process.env.NEXTAUTH_URL}/dashboard`,
        webhookUrl: request.webhookUrl || `${process.env.NEXTAUTH_URL}/api/payments/webhook`,
        expiresAt: expiresAt.toISOString()
      };

      const tributeUrl = this.generateTributePaymentUrl(tributePaymentData);
      
      return {
        success: true,
        data: {
          paymentUrl: tributeUrl,
          tributeUrl: tributeUrl,
          paymentId: request.paymentId,
          orderId: orderId,
          amount: request.amount,
          expiresAt: expiresAt.toISOString()
        }
      };

    } catch (error) {
      console.error('Tribute payment creation error:', error);
      return {
        success: false,
        error: 'Ошибка создания платежа через Tribute'
      };
    }
  }

  /**
   * Checks payment status
   */
  static async checkPaymentStatus(paymentId: string, orderId: string): Promise<TributeStatusResponse> {
    try {
      // In a real implementation, this would call Tribute's API to check status
      // For now, we'll simulate the check
      
      // This would be a call to Tribute's API
      // const response = await fetch(`${TRIBUTE_CONFIG.API_URL}/payments/${paymentId}/status`, {
      //   headers: {
      //     'Authorization': `Bearer ${process.env.TRIBUTE_API_KEY}`
      //   }
      // });

      // For demo purposes, we'll return pending status
      return {
        success: true,
        data: {
          status: 'pending',
          paymentId: paymentId,
          orderId: orderId
        }
      };

    } catch (error) {
      console.error('Tribute status check error:', error);
      return {
        success: false,
        error: 'Ошибка проверки статуса платежа'
      };
    }
  }

  /**
   * Calls Tribute API to create payment
   */
  private static async callTributeAPI(paymentData: any): Promise<{success: boolean, data?: any}> {
    try {
      const response = await fetch(`${TRIBUTE_CONFIG.API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TRIBUTE_API_KEY}`,
          'X-API-Key': process.env.TRIBUTE_API_KEY || ''
        },
        body: JSON.stringify({
          orderNumber: paymentData.orderId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          description: paymentData.description,
          notifyUrl: paymentData.webhookUrl,
          returnUrl: paymentData.returnUrl,
          type: 'subscription'
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          data: {
            paymentUrl: result.data?.paymentUrl || result.data?.paymentDeepLinkUrl,
            tributeUrl: result.data?.tributeUrl || result.data?.paymentUrl,
            orderId: result.data?.orderId
          }
        };
      }

      return { success: false };
    } catch (error) {
      console.error('Tribute API call error:', error);
      return { success: false };
    }
  }

  /**
   * Generates a Tribute payment URL (Telegram deep link)
   */
  private static generateTributePaymentUrl(paymentData: any): string {
    // Create Telegram deep link to Tribute app
    // Format: https://t.me/tribute/app?startapp=piu3
    
    return `https://t.me/tribute/app?startapp=piu3`;
  }

  /**
   * Creates a subscription through Tribute
   */
  static async createSubscription(request: TributePaymentRequest): Promise<TributePaymentResponse> {
    try {
      // For subscriptions, we might use a different flow
      const orderId = `tribute_sub_${request.paymentId}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + TRIBUTE_CONFIG.PAYMENT_TIMEOUT);

      const subscriptionData = {
        ...request,
        orderId,
        type: 'subscription',
        expiresAt: expiresAt.toISOString()
      };

      const tributeUrl = this.generateTributeSubscriptionUrl(subscriptionData);

      return {
        success: true,
        data: {
          paymentUrl: tributeUrl,
          tributeUrl: tributeUrl,
          paymentId: request.paymentId,
          orderId: orderId,
          amount: request.amount,
          expiresAt: expiresAt.toISOString()
        }
      };

    } catch (error) {
      console.error('Tribute subscription creation error:', error);
      return {
        success: false,
        error: 'Ошибка создания подписки через Tribute'
      };
    }
  }

  /**
   * Generates a Tribute subscription URL
   */
  private static generateTributeSubscriptionUrl(subscriptionData: any): string {
    // Create Telegram deep link for subscription
    const encodedData = Buffer.from(JSON.stringify({
      orderId: subscriptionData.orderId,
      amount: subscriptionData.amount,
      currency: subscriptionData.currency,
      description: subscriptionData.description,
      userId: subscriptionData.userId,
      planName: subscriptionData.planName,
      type: 'subscription'
    })).toString('base64');

    return `https://t.me/tribute_bot?start=subscription_${encodedData}`;
  }

  /**
   * Validates Tribute webhook signature
   */
  static validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      // В продакшене ВСЕГДА требуем webhook secret
      if (!TRIBUTE_CONFIG.WEBHOOK_SECRET) {
        if (process.env.NODE_ENV === 'production') {
          console.error('TRIBUTE_WEBHOOK_SECRET is required in production');
          return false;
        }
        console.warn('Tribute webhook secret not configured - allowing all webhooks in development');
        return true;
      }

      if (!signature) {
        console.warn('No signature provided in webhook');
        return false;
      }

      // Validate webhook signature using HMAC SHA-256 (common for webhooks)
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', TRIBUTE_CONFIG.WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
      
      // Signature might be prefixed with 'sha256=' or just be the hex
      const receivedSignature = signature.replace(/^sha256=/, '');
      
      // Используем timing-safe сравнение для защиты от timing атак
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );

    } catch (error) {
      console.error('Tribute webhook validation error:', error);
      return false;
    }
  }

  /**
   * Processes Tribute webhook
   */
  static async processWebhook(payload: any): Promise<boolean> {
    try {
      // Process Tribute webhook data
      const { event, payment_id, order_id, status, amount } = payload;

      switch (event) {
        case 'payment.completed':
          // Handle successful payment
          console.log('Tribute payment completed:', { payment_id, order_id, amount });
          return true;

        case 'payment.failed':
          // Handle failed payment
          console.log('Tribute payment failed:', { payment_id, order_id });
          return true;

        case 'subscription.created':
          // Handle subscription creation
          console.log('Tribute subscription created:', { payment_id, order_id });
          return true;

        case 'subscription.cancelled':
          // Handle subscription cancellation
          console.log('Tribute subscription cancelled:', { payment_id, order_id });
          return true;

        default:
          console.log('Unknown Tribute webhook event:', event);
          return false;
      }

    } catch (error) {
      console.error('Tribute webhook processing error:', error);
      return false;
    }
  }

  /**
   * Gets payment method info
   */
  static getPaymentMethodInfo() {
    return {
      name: 'Tribute',
      description: 'Оплата через Telegram сервис Tribute',
      supportedCurrencies: ['RUB', 'EUR'],
      minAmount: TRIBUTE_CONFIG.MIN_AMOUNT,
      maxAmount: TRIBUTE_CONFIG.MAX_AMOUNT,
      commissionRate: TRIBUTE_CONFIG.COMMISSION_RATE,
      features: [
        'Telegram Stars для цифровых товаров',
        'Безопасные платежи через Telegram',
        'Мгновенные уведомления',
        'Поддержка подписок и разовых платежей'
      ]
    };
  }
} 