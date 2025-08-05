import { v4 as uuidv4 } from 'uuid';
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
    serverTime: string;
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
const TRIBUTE_CONFIG = {
  BOT_USERNAME: '@tribute', 
  API_URL: process.env.TRIBUTE_API_URL || 'https:
  WEBHOOK_SECRET: process.env.TRIBUTE_WEBHOOK_SECRET,
  PAYMENT_TIMEOUT: 15 * 60 * 1000, 
  MIN_AMOUNT: 100, 
  MAX_AMOUNT: 300000, 
  COMMISSION_RATE: 0.10, 
};
export class TributeService {
  static async createPayment(request: TributePaymentRequest): Promise<TributePaymentResponse> {
    try {
      if (request.amount < TRIBUTE_CONFIG.MIN_AMOUNT || request.amount > TRIBUTE_CONFIG.MAX_AMOUNT) {
        return {
          success: false,
          error: `Сумма должна быть от ${TRIBUTE_CONFIG.MIN_AMOUNT} до ${TRIBUTE_CONFIG.MAX_AMOUNT} рублей`
        };
      }
      const orderId = `tribute_${request.paymentId}_${Date.now()}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + TRIBUTE_CONFIG.PAYMENT_TIMEOUT);
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
                expiresAt: expiresAt.toISOString(),
                serverTime: now.toISOString()
              }
            };
          }
        } catch (apiError) {
          console.warn('Tribute API call failed, falling back to deep link:', apiError);
        }
      }
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
          expiresAt: expiresAt.toISOString(),
          serverTime: now.toISOString()
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
  static async checkPaymentStatus(paymentId: string, orderId: string): Promise<TributeStatusResponse> {
    try {
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
  private static generateTributePaymentUrl(paymentData: any): string {
    return `https:
  }
  static async createSubscription(request: TributePaymentRequest): Promise<TributePaymentResponse> {
    try {
      const orderId = `tribute_sub_${request.paymentId}_${Date.now()}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + TRIBUTE_CONFIG.PAYMENT_TIMEOUT);
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
          expiresAt: expiresAt.toISOString(),
          serverTime: now.toISOString()
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
  private static generateTributeSubscriptionUrl(subscriptionData: any): string {
    const encodedData = Buffer.from(JSON.stringify({
      orderId: subscriptionData.orderId,
      amount: subscriptionData.amount,
      currency: subscriptionData.currency,
      description: subscriptionData.description,
      userId: subscriptionData.userId,
      planName: subscriptionData.planName,
      type: 'subscription'
    })).toString('base64');
    return `https:
  }
  static validateWebhookSignature(payload: string, signature: string): boolean {
    try {
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
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', TRIBUTE_CONFIG.WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
      const receivedSignature = signature.replace(/^sha256=/, '');
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );
    } catch (error) {
      console.error('Tribute webhook validation error:', error);
      return false;
    }
  }
  static async processWebhook(payload: any): Promise<boolean> {
    try {
      const { event, payment_id, order_id, status, amount } = payload;
      switch (event) {
        case 'payment.completed':
          console.log('Tribute payment completed:', { payment_id, order_id, amount });
          return true;
        case 'payment.failed':
          console.log('Tribute payment failed:', { payment_id, order_id });
          return true;
        case 'subscription.created':
          console.log('Tribute subscription created:', { payment_id, order_id });
          return true;
        case 'subscription.cancelled':
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
