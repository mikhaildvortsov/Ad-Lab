import { query } from '@/lib/database';
import { 
  SubscriptionPlan, 
  FrontendPlan, 
  DatabaseResult,
  PLAN_ID_TO_NAME,
  PLAN_NAME_TO_ID
} from '@/lib/database-types';

export class PlanMapper {
  
  // Map database plan to frontend plan format
  static mapDbPlanToFrontend(dbPlan: SubscriptionPlan): FrontendPlan {
    // Get frontend ID from database name
    const frontendId = PLAN_NAME_TO_ID[dbPlan.name] || dbPlan.name.toLowerCase();
    
    return {
      id: frontendId,
      name: dbPlan.name,
      price: dbPlan.price_monthly,
      features: Array.isArray(dbPlan.features) ? dbPlan.features : [],
      improvements: dbPlan.max_queries_per_month || 0,
      popular: dbPlan.name === 'Month' // Mark Month as popular
    };
  }

  // Map frontend plan to database plan format
  static mapFrontendPlanToDb(frontendPlan: FrontendPlan): Partial<SubscriptionPlan> {
    // Get database name from frontend ID
    const dbName = PLAN_ID_TO_NAME[frontendPlan.id] || frontendPlan.name;
    
    return {
      name: dbName,
      price_monthly: frontendPlan.price,
      features: frontendPlan.features,
      max_queries_per_month: frontendPlan.improvements === 999 ? null : frontendPlan.improvements,
      currency: 'RUB'
    };
  }

  // Get plan by frontend ID
  static async getPlanByFrontendId(frontendId: string): Promise<DatabaseResult<SubscriptionPlan>> {
    try {
      // Convert frontend ID to database name
      const dbName = PLAN_ID_TO_NAME[frontendId] || frontendId;
      
      const result = await query<SubscriptionPlan>(
        'SELECT * FROM subscription_plans WHERE name = $1 AND is_active = true',
        [dbName]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Plan not found' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error getting plan by frontend ID:', error);
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

  // Validate frontend plan ID
  static isValidFrontendPlanId(planId: string): boolean {
    const validIds = Object.keys(PLAN_ID_TO_NAME);
    return validIds.includes(planId);
  }

  // Get plan limits by frontend ID
  static async getPlanLimits(frontendId: string): Promise<DatabaseResult<{
    maxQueriesPerMonth: number;
    maxTokensPerQuery: number;
    features: string[];
  }>> {
    try {
      const planResult = await this.getPlanByFrontendId(frontendId);
      if (!planResult.success || !planResult.data) {
        return { success: false, error: 'Plan not found' };
      }

      const plan = planResult.data;
      return {
        success: true,
        data: {
          maxQueriesPerMonth: plan.max_queries_per_month || Infinity,
          maxTokensPerQuery: plan.max_tokens_per_query || Infinity,
          features: Array.isArray(plan.features) ? plan.features : []
        }
      };
    } catch (error) {
      console.error('Error getting plan limits:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
} 