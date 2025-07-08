import { query } from '@/lib/database';
import { SubscriptionPlan, DatabaseResult } from '@/lib/database-types';

// Mapping between frontend plan IDs and plan names
export const PLAN_ID_TO_NAME = {
  'week': 'Week',
  'month': 'Month', 
  'quarter': 'Quarter'
} as const;

export const PLAN_NAME_TO_ID = {
  'Week': 'week',
  'Month': 'month',
  'Quarter': 'quarter'
} as const;

// Frontend plan interface (matches what components expect)
export interface FrontendPlan {
  id: string; // 'week', 'month', 'quarter'
  name: string;
  price: number;
  originalPrice?: number; // Для зачеркнутой цены
  features: string[];
  improvements: number;
  popular?: boolean;
}

export class PlanMapper {
  
  // Get subscription plan by frontend ID (basic/pro/enterprise)
  static async getSubscriptionPlanByFrontendId(frontendId: string): Promise<DatabaseResult<SubscriptionPlan>> {
    try {
      const planName = PLAN_ID_TO_NAME[frontendId as keyof typeof PLAN_ID_TO_NAME];
      
      if (!planName) {
        return { success: false, error: `Invalid plan ID: ${frontendId}` };
      }

      const result = await query<SubscriptionPlan>(
        'SELECT * FROM subscription_plans WHERE name = $1 AND is_active = true',
        [planName]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Subscription plan not found' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error getting subscription plan by frontend ID:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get all plans and convert to frontend format
  static async getAllPlansForFrontend(): Promise<DatabaseResult<FrontendPlan[]>> {
    try {
      const result = await query<SubscriptionPlan>(
        'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price_monthly ASC'
      );

      const frontendPlans: FrontendPlan[] = result.rows.map(plan => {
        const frontendId = PLAN_NAME_TO_ID[plan.name as keyof typeof PLAN_NAME_TO_ID] || plan.name.toLowerCase();
        
        return {
          id: frontendId,
          name: plan.name,
          price: plan.price_monthly,
          features: Array.isArray(plan.features) ? plan.features : [],
          improvements: plan.max_queries_per_month || 0,
          popular: plan.name === 'Month' // Mark Month as popular
        };
      });

      return { success: true, data: frontendPlans };
    } catch (error) {
      console.error('Error getting plans for frontend:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Fallback plans if database is not available
  static getFallbackPlans(): FrontendPlan[] {
    return [
      {
        id: 'week',
        name: 'Неделя',
        price: 1990,
        features: ['Полный доступ на 7 дней', 'Неограниченные улучшения', 'Все функции приложения', 'Поддержка 24/7'],
        improvements: -1
      },
      {
        id: 'month',
        name: 'Месяц',
        price: 2990,
        originalPrice: 6990,
        features: ['Полный доступ на 30 дней', 'Неограниченные улучшения', 'Все функции приложения', 'Приоритетная поддержка', 'Экономия 57%'],
        improvements: -1,
        popular: true
      },
      {
        id: 'quarter',
        name: 'Три месяца',
        price: 9990,
        features: ['Полный доступ на 90 дней', 'Неограниченные улучшения', 'Все функции приложения', 'VIP поддержка', 'Максимальная экономия'],
        improvements: -1
      }
    ];
  }
} 