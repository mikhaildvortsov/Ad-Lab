import { query, transaction } from '@/lib/database';
import { 
  SubscriptionPlan,
  UserSubscription,
  Payment,
  UsageStatistics,
  CreateUserSubscriptionParams,
  UpdateUserSubscriptionParams,
  CreatePaymentParams,
  UpdatePaymentParams,
  CreateUsageStatisticsParams,
  UpdateUsageStatisticsParams,
  DatabaseResult,
  PaginatedResult,
  QueryOptions,
  SubscriptionStatus,
  PaymentStatus,
  PAYMENT_METHODS
} from '@/lib/database-types';
import { v4 as uuidv4 } from 'uuid';

export class BillingService {
  
  // ================ SUBSCRIPTION PLANS ================
  
  // Get all active subscription plans
  static async getSubscriptionPlans(): Promise<DatabaseResult<SubscriptionPlan[]>> {
    try {
      const result = await query<SubscriptionPlan>(
        'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price_monthly ASC'
      );

      return { success: true, data: result.rows };
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get subscription plan by ID
  static async getSubscriptionPlan(id: string): Promise<DatabaseResult<SubscriptionPlan>> {
    try {
      const result = await query<SubscriptionPlan>(
        'SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true',
        [id]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Subscription plan not found' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error getting subscription plan:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ================ USER SUBSCRIPTIONS ================
  
  // Create user subscription
  static async createUserSubscription(
    params: CreateUserSubscriptionParams
  ): Promise<DatabaseResult<UserSubscription>> {
    try {
      return await transaction(async (client) => {
        const id = uuidv4();
        const {
          user_id,
          plan_id,
          status = 'active',
          payment_method,
          expires_at,
          auto_renew = true
        } = params;

        // Check if plan exists
        const planResult = await client.query<SubscriptionPlan>(
          'SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true',
          [plan_id]
        );

        if (planResult.rows.length === 0) {
          throw new Error('Subscription plan not found');
        }

        // Cancel any existing active subscriptions for this user
        await client.query(
          `UPDATE user_subscriptions 
           SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP 
           WHERE user_id = $1 AND status = 'active'`,
          [user_id]
        );

        // Create new subscription
        const result = await client.query<UserSubscription>(
          `INSERT INTO user_subscriptions (
            id, user_id, plan_id, status, payment_method, expires_at, auto_renew
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *`,
          [id, user_id, plan_id, status, payment_method, expires_at, auto_renew]
        );

        return { success: true, data: result.rows[0] };
      });
    } catch (error) {
      console.error('Error creating user subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get user's current active subscription
  static async getUserSubscription(userId: string): Promise<DatabaseResult<UserSubscription & { plan: SubscriptionPlan }>> {
    try {
      // Define interface for SQL result with aliased plan fields
      interface SubscriptionWithPlanFields extends UserSubscription {
        plan_name: string;
        plan_description: string;
        plan_price_monthly: number;
        plan_price_yearly: number;
        plan_currency: string;
        plan_features: string[];
        plan_max_queries_per_month: number;
        plan_max_tokens_per_query: number;
      }

      const result = await query<SubscriptionWithPlanFields>(
        `SELECT us.*, 
                sp.name as plan_name,
                sp.description as plan_description,
                sp.price_monthly as plan_price_monthly,
                sp.price_yearly as plan_price_yearly,
                sp.currency as plan_currency,
                sp.features as plan_features,
                sp.max_queries_per_month as plan_max_queries_per_month,
                sp.max_tokens_per_query as plan_max_tokens_per_query
         FROM user_subscriptions us
         JOIN subscription_plans sp ON us.plan_id = sp.id
         WHERE us.user_id = $1 AND us.status = 'active'
         ORDER BY us.created_at DESC
         LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'No active subscription found' };
      }

      const subscription = result.rows[0];
      
      // Structure the response properly
      const response = {
        ...subscription,
        plan: {
          id: subscription.plan_id,
          name: subscription.plan_name,
          description: subscription.plan_description,
          price_monthly: subscription.plan_price_monthly,
          price_yearly: subscription.plan_price_yearly,
          currency: subscription.plan_currency,
          features: subscription.plan_features,
          max_queries_per_month: subscription.plan_max_queries_per_month,
          max_tokens_per_query: subscription.plan_max_tokens_per_query,
          is_active: true,
          created_at: new Date()
        }
      };

      return { success: true, data: response };
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update user subscription
  static async updateUserSubscription(
    id: string, 
    params: UpdateUserSubscriptionParams
  ): Promise<DatabaseResult<UserSubscription>> {
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(value);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id);

      const result = await query<UserSubscription>(
        `UPDATE user_subscriptions SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        updateValues
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Subscription not found' };
      }

      return { 
        success: true, 
        data: result.rows[0],
        affected_rows: result.rowCount || 0
      };
    } catch (error) {
      console.error('Error updating user subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Cancel user subscription
  static async cancelSubscription(userId: string): Promise<DatabaseResult<boolean>> {
    try {
      const result = await query(
        `UPDATE user_subscriptions 
         SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1 AND status = 'active'`,
        [userId]
      );

      return { 
        success: true, 
        data: true,
        affected_rows: result.rowCount || 0
      };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ================ PAYMENTS ================
  
  // Create payment record
  static async createPayment(params: CreatePaymentParams): Promise<DatabaseResult<Payment>> {
    try {
      const id = uuidv4();
      const {
        user_id,
        subscription_id,
        amount,
        currency = 'RUB',
        payment_method,
        payment_provider,
        external_payment_id,
        status = 'pending',
        metadata
      } = params;

      const result = await query<Payment>(
        `INSERT INTO payments (
          id, user_id, subscription_id, amount, currency, payment_method,
          payment_provider, external_payment_id, status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          id, 
          user_id, 
          subscription_id || null, // Явно преобразуем undefined в null
          amount, 
          currency, 
          payment_method,
          payment_provider || null,
          external_payment_id || null,
          status, 
          metadata ? JSON.stringify(metadata) : null
        ]
      );

      return { 
        success: true, 
        data: result.rows[0],
        affected_rows: result.rowCount || 0
      };
    } catch (error) {
      console.error('Error creating payment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update payment status
  static async updatePayment(
    id: string, 
    params: UpdatePaymentParams
  ): Promise<DatabaseResult<Payment>> {
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'metadata' && typeof value === 'object') {
            updateFields.push(`${key} = $${paramIndex}`);
            updateValues.push(JSON.stringify(value));
          } else {
            updateFields.push(`${key} = $${paramIndex}`);
            updateValues.push(value);
          }
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      updateValues.push(id);

      const result = await query<Payment>(
        `UPDATE payments SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        updateValues
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Payment not found' };
      }

      return { 
        success: true, 
        data: result.rows[0],
        affected_rows: result.rowCount || 0
      };
    } catch (error) {
      console.error('Error updating payment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Find payment by external payment ID (for webhooks)
  static async findPaymentByExternalId(externalPaymentId: string): Promise<DatabaseResult<Payment>> {
    try {
      const result = await query<Payment>(
        'SELECT * FROM payments WHERE external_payment_id = $1 LIMIT 1',
        [externalPaymentId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Payment not found' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error finding payment by external ID:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get user's payment history
  static async getUserPayments(
    userId: string, 
    options: QueryOptions = {}
  ): Promise<DatabaseResult<PaginatedResult<Payment>>> {
    try {
      const {
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = options;

      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM payments WHERE user_id = $1',
        [userId]
      );
      
      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      // Get paginated results
      const dataResult = await query<Payment>(
        `SELECT p.*, us.plan_id, sp.name as plan_name
         FROM payments p
         LEFT JOIN user_subscriptions us ON p.subscription_id = us.id
         LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
         WHERE p.user_id = $1
         ORDER BY p.${sort_by} ${sort_order} 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return {
        success: true,
        data: {
          data: dataResult.rows,
          total,
          page,
          limit,
          total_pages: totalPages
        }
      };
    } catch (error) {
      console.error('Error getting user payments:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ================ USAGE STATISTICS ================
  
  // Create or update usage statistics
  static async upsertUsageStatistics(
    params: CreateUsageStatisticsParams
  ): Promise<DatabaseResult<UsageStatistics>> {
    try {
      return await transaction(async (client) => {
        const {
          user_id,
          period_start,
          period_end,
          total_queries = 0,
          total_tokens = 0,
          subscription_plan_id,
          overage_queries = 0,
          overage_tokens = 0
        } = params;

        // Try to find existing record
        const existingResult = await client.query<UsageStatistics>(
          'SELECT * FROM usage_statistics WHERE user_id = $1 AND period_start = $2 AND period_end = $3',
          [user_id, period_start, period_end]
        );

        if (existingResult.rows.length > 0) {
          // Update existing record
          const result = await client.query<UsageStatistics>(
            `UPDATE usage_statistics 
             SET total_queries = $1, total_tokens = $2, subscription_plan_id = $3,
                 overage_queries = $4, overage_tokens = $5
             WHERE user_id = $6 AND period_start = $7 AND period_end = $8
             RETURNING *`,
            [total_queries, total_tokens, subscription_plan_id, overage_queries, overage_tokens, 
             user_id, period_start, period_end]
          );
          
          return { success: true, data: result.rows[0] };
        } else {
          // Create new record
          const id = uuidv4();
          const result = await client.query<UsageStatistics>(
            `INSERT INTO usage_statistics (
              id, user_id, period_start, period_end, total_queries, total_tokens,
              subscription_plan_id, overage_queries, overage_tokens
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [id, user_id, period_start, period_end, total_queries, total_tokens,
             subscription_plan_id, overage_queries, overage_tokens]
          );
          
          return { success: true, data: result.rows[0] };
        }
      });
    } catch (error) {
      console.error('Error upserting usage statistics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get user's current month usage
  static async getCurrentMonthUsage(userId: string): Promise<DatabaseResult<UsageStatistics>> {
    try {
      const currentDate = new Date();
      const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const result = await query<UsageStatistics>(
        `SELECT us.*, sp.name as plan_name, sp.max_queries_per_month, sp.max_tokens_per_query
         FROM usage_statistics us
         LEFT JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
         WHERE us.user_id = $1 AND us.period_start = $2 AND us.period_end = $3`,
        [userId, periodStart, periodEnd]
      );

      if (result.rows.length === 0) {
        // Create initial usage record if it doesn't exist
        const createResult = await this.upsertUsageStatistics({
          user_id: userId,
          period_start: periodStart,
          period_end: periodEnd
        });
        
        return createResult;
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error getting current month usage:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Check if user can make a query (within limits)
  static async canUserQuery(userId: string): Promise<DatabaseResult<{
    can_query: boolean;
    reason?: string;
    current_usage: {
      queries_this_month: number;
      tokens_this_month: number;
      subscription_limits: {
        max_queries?: number;
        max_tokens_per_query?: number;
      }
    }
  }>> {
    try {
      // Get user's subscription and current usage
      const subscriptionResult = await this.getUserSubscription(userId);
      const usageResult = await this.getCurrentMonthUsage(userId);

      if (!usageResult.success) {
        return { 
          success: false, 
          error: 'Failed to get usage statistics' 
        };
      }

      const usage = usageResult.data!;
      const subscription = subscriptionResult.success ? subscriptionResult.data : null;

      const currentUsage = {
        queries_this_month: usage.total_queries,
        tokens_this_month: usage.total_tokens,
        subscription_limits: {
          max_queries: subscription?.plan?.max_queries_per_month || undefined,
          max_tokens_per_query: subscription?.plan?.max_tokens_per_query || undefined
        }
      };

      // Check query limits
      if (subscription?.plan?.max_queries_per_month && 
          usage.total_queries >= subscription.plan.max_queries_per_month) {
        return {
          success: true,
          data: {
            can_query: false,
            reason: 'Monthly query limit exceeded',
            current_usage: currentUsage
          }
        };
      }

      return {
        success: true,
        data: {
          can_query: true,
          current_usage: currentUsage
        }
      };
    } catch (error) {
      console.error('Error checking user query limits:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get billing statistics
  static async getBillingStats(): Promise<DatabaseResult<{
    total_revenue: number;
    monthly_revenue: number;
    active_subscriptions: number;
    cancelled_subscriptions: number;
    pending_payments: number;
    subscription_breakdown: Record<string, number>;
  }>> {
    try {
      // Revenue statistics
      const revenueResult = await query<{
        total_revenue: string;
        monthly_revenue: string;
      }>(
        `SELECT 
          COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_revenue,
          COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)), 0) as monthly_revenue
        FROM payments`
      );

      // Subscription statistics
      const subscriptionResult = await query<{
        active_subscriptions: string;
        cancelled_subscriptions: string;
      }>(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_subscriptions
        FROM user_subscriptions`
      );

      // Pending payments
      const pendingResult = await query<{
        pending_payments: string;
      }>(
        'SELECT COUNT(*) as pending_payments FROM payments WHERE status = \'pending\''
      );

      // Subscription breakdown by plan
      const breakdownResult = await query<{
        plan_name: string;
        count: string;
      }>(
        `SELECT sp.name as plan_name, COUNT(*) as count
         FROM user_subscriptions us
         JOIN subscription_plans sp ON us.plan_id = sp.id
         WHERE us.status = 'active'
         GROUP BY sp.name`
      );

      const subscriptionBreakdown: Record<string, number> = {};
      breakdownResult.rows.forEach(row => {
        subscriptionBreakdown[row.plan_name] = parseInt(row.count);
      });

      return {
        success: true,
        data: {
          total_revenue: parseFloat(revenueResult.rows[0].total_revenue),
          monthly_revenue: parseFloat(revenueResult.rows[0].monthly_revenue),
          active_subscriptions: parseInt(subscriptionResult.rows[0].active_subscriptions),
          cancelled_subscriptions: parseInt(subscriptionResult.rows[0].cancelled_subscriptions),
          pending_payments: parseInt(pendingResult.rows[0].pending_payments),
          subscription_breakdown: subscriptionBreakdown
        }
      };
    } catch (error) {
      console.error('Error getting billing stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
} 