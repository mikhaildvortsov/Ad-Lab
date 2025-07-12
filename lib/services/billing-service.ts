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
  static async getSubscriptionPlan(planId: string): Promise<DatabaseResult<SubscriptionPlan>> {
    try {
      const result = await query<SubscriptionPlan>(
        'SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true',
        [planId]
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
  
  // Create a new user subscription
  static async createUserSubscription(params: CreateUserSubscriptionParams): Promise<DatabaseResult<UserSubscription>> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      
      // Set default period if not provided (1 month from now)
      const defaultEnd = new Date();
      defaultEnd.setMonth(defaultEnd.getMonth() + 1);
      
      const subscription = await query<UserSubscription>(`
        INSERT INTO user_subscriptions (
          id, user_id, plan_id, status, current_period_start, current_period_end,
          created_at, updated_at, trial_start, trial_end, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        id,
        params.user_id,
        params.plan_id,
        params.status || 'active',
        (params.current_period_start || new Date()).toISOString(),
        (params.current_period_end || defaultEnd).toISOString(),
        now,
        now,
        params.trial_start?.toISOString() || null,
        params.trial_end?.toISOString() || null,
        params.metadata ? JSON.stringify(params.metadata) : null
      ]);

      return { success: true, data: subscription.rows[0] };
    } catch (error) {
      console.error('Error creating user subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get user's current subscription
  static async getUserSubscription(userId: string): Promise<DatabaseResult<UserSubscription & { plan: SubscriptionPlan }>> {
    try {
      const result = await query<UserSubscription & { plan: SubscriptionPlan }>(`
        SELECT us.*, sp.name as plan_name, sp.description as plan_description,
               sp.price_monthly, sp.price_yearly, sp.currency, sp.features,
               sp.max_queries_per_month, sp.max_tokens_per_query
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        WHERE us.user_id = $1 AND us.status IN ('active', 'trialing')
        ORDER BY us.created_at DESC
        LIMIT 1
      `, [userId]);

      if (result.rows.length === 0) {
        return { success: false, error: 'No active subscription found' };
      }

      return { success: true, data: result.rows[0] };
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
    subscriptionId: string, 
    params: UpdateUserSubscriptionParams
  ): Promise<DatabaseResult<UserSubscription>> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      // Build dynamic update query
      if (params.plan_id !== undefined) {
        updates.push(`plan_id = $${valueIndex++}`);
        values.push(params.plan_id);
      }
      if (params.status !== undefined) {
        updates.push(`status = $${valueIndex++}`);
        values.push(params.status);
      }
      if (params.current_period_start !== undefined) {
        updates.push(`current_period_start = $${valueIndex++}`);
        values.push(params.current_period_start.toISOString());
      }
      if (params.current_period_end !== undefined) {
        updates.push(`current_period_end = $${valueIndex++}`);
        values.push(params.current_period_end.toISOString());
      }
      if (params.cancelled_at !== undefined) {
        updates.push(`cancelled_at = $${valueIndex++}`);
        values.push(params.cancelled_at?.toISOString() || null);
      }
      if (params.trial_start !== undefined) {
        updates.push(`trial_start = $${valueIndex++}`);
        values.push(params.trial_start?.toISOString() || null);
      }
      if (params.trial_end !== undefined) {
        updates.push(`trial_end = $${valueIndex++}`);
        values.push(params.trial_end?.toISOString() || null);
      }
      if (params.metadata !== undefined) {
        updates.push(`metadata = $${valueIndex++}`);
        values.push(params.metadata ? JSON.stringify(params.metadata) : null);
      }

      if (updates.length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      // Always update the updated_at field
      updates.push(`updated_at = $${valueIndex++}`);
      values.push(new Date().toISOString());

      // Add subscription ID as the last parameter
      values.push(subscriptionId);

      const result = await query<UserSubscription>(`
        UPDATE user_subscriptions 
        SET ${updates.join(', ')}
        WHERE id = $${valueIndex}
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        return { success: false, error: 'Subscription not found or update failed' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error updating user subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Cancel user subscription
  static async cancelUserSubscription(userId: string): Promise<DatabaseResult<UserSubscription>> {
    try {
      const result = await query<UserSubscription>(`
        UPDATE user_subscriptions 
        SET status = 'cancelled', cancelled_at = $1, updated_at = $1
        WHERE user_id = $2 AND status = 'active'
        RETURNING *
      `, [new Date().toISOString(), userId]);

      if (result.rows.length === 0) {
        return { success: false, error: 'No active subscription found to cancel' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error canceling user subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ================ PAYMENTS ================
  
  // Create a new payment record
  static async createPayment(params: CreatePaymentParams): Promise<DatabaseResult<Payment>> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const payment = await query<Payment>(`
        INSERT INTO payments (
          id, user_id, subscription_id, amount, currency, status,
          payment_method, external_payment_id, created_at, updated_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        id,
        params.user_id,
        params.subscription_id || null,
        params.amount,
        params.currency || 'RUB',
        params.status || 'pending',
        params.payment_method,
        params.external_payment_id || null,
        now,
        now,
        params.metadata ? JSON.stringify(params.metadata) : null
      ]);

      return { success: true, data: payment.rows[0] };
    } catch (error) {
      console.error('Error creating payment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update payment status
  static async updatePayment(paymentId: string, params: UpdatePaymentParams): Promise<DatabaseResult<Payment>> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      if (params.status !== undefined) {
        updates.push(`status = $${valueIndex++}`);
        values.push(params.status);
      }
      if (params.external_payment_id !== undefined) {
        updates.push(`external_payment_id = $${valueIndex++}`);
        values.push(params.external_payment_id);
      }
      if (params.metadata !== undefined) {
        updates.push(`metadata = $${valueIndex++}`);
        values.push(params.metadata ? JSON.stringify(params.metadata) : null);
      }

      if (updates.length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      // Always update the updated_at field
      updates.push(`updated_at = $${valueIndex++}`);
      values.push(new Date().toISOString());

      // Add payment ID as the last parameter
      values.push(paymentId);

      const result = await query<Payment>(`
        UPDATE payments 
        SET ${updates.join(', ')}
        WHERE id = $${valueIndex}
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        return { success: false, error: 'Payment not found or update failed' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error updating payment:', error);
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
      const countResult = await query(
        'SELECT COUNT(*) as count FROM payments WHERE user_id = $1',
        [userId]
      );
      const total = parseInt(countResult.rows[0].count);

      // Get payments
      const result = await query<Payment>(`
        SELECT * FROM payments 
        WHERE user_id = $1
        ORDER BY ${sort_by} ${sort_order}
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          data: result.rows,
          page,
          limit,
          total,
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
  
  // Get or create usage statistics for a user/month
  static async getOrCreateUsageStats(userId: string, month: string): Promise<DatabaseResult<UsageStatistics>> {
    try {
      // Try to get existing stats
      let result = await query<UsageStatistics>(
        'SELECT * FROM usage_statistics WHERE user_id = $1 AND month = $2',
        [userId, month]
      );

      if (result.rows.length === 0) {
        // Create new stats record
        const id = uuidv4();
        const now = new Date().toISOString();
        
        result = await query<UsageStatistics>(`
          INSERT INTO usage_statistics (id, user_id, month, queries_count, tokens_used, created_at, updated_at)
          VALUES ($1, $2, $3, 0, 0, $4, $5)
          RETURNING *
        `, [id, userId, month, now, now]);
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error getting/creating usage stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update usage statistics
  static async updateUsageStats(
    userId: string, 
    month: string, 
    queriesIncrement: number = 1, 
    tokensIncrement: number = 0
  ): Promise<DatabaseResult<UsageStatistics>> {
    try {
      const result = await query<UsageStatistics>(`
        UPDATE usage_statistics 
        SET queries_count = queries_count + $1, 
            tokens_used = tokens_used + $2, 
            updated_at = $3
        WHERE user_id = $4 AND month = $5
        RETURNING *
      `, [queriesIncrement, tokensIncrement, new Date().toISOString(), userId, month]);

      if (result.rows.length === 0) {
        // If no record exists, create one
        return await this.getOrCreateUsageStats(userId, month);
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error updating usage stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get user's usage for current month
  static async getCurrentMonthUsage(userId: string): Promise<DatabaseResult<UsageStatistics>> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      return await this.getOrCreateUsageStats(userId, currentMonth);
    } catch (error) {
      console.error('Error getting current month usage:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Check if user has exceeded their plan limits
  static async checkUsageLimits(userId: string): Promise<DatabaseResult<{
    withinLimits: boolean;
    currentUsage: UsageStatistics;
    planLimits: SubscriptionPlan;
    remainingQueries: number;
  }>> {
    try {
      // Get current subscription and usage
      const subscriptionResult = await this.getUserSubscription(userId);
      if (!subscriptionResult.success) {
        return { success: false, error: 'No active subscription found' };
      }

      const currentUsageResult = await this.getCurrentMonthUsage(userId);
      if (!currentUsageResult.success) {
        return { success: false, error: 'Failed to get usage stats' };
      }

      const subscription = subscriptionResult.data!;
      const usage = currentUsageResult.data!;
      const maxQueries = (subscription.plan?.max_queries_per_month ?? Infinity);
      const remainingQueries = Math.max(0, maxQueries - (usage.queries_count ?? 0));
      const withinLimits = (usage.queries_count ?? 0) < maxQueries;

      return {
        success: true,
        data: {
          withinLimits,
          currentUsage: usage,
          planLimits: subscription.plan,
          remainingQueries
        }
      };
    } catch (error) {
      console.error('Error checking usage limits:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
} 