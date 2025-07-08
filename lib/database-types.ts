// Database model types for PostgreSQL schema

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  provider: string;
  provider_id?: string | null;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date | null;
  is_active: boolean;
  preferred_language: string;
}

export interface CreateUserParams {
  email: string;
  name: string;
  avatar_url?: string;
  provider?: string;
  provider_id?: string;
  email_verified?: boolean;
  preferred_language?: string;
}

export interface UpdateUserParams {
  name?: string;
  avatar_url?: string | null;
  email_verified?: boolean;
  last_login_at?: Date;
  is_active?: boolean;
  preferred_language?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string | null;
  price_monthly: number;
  price_yearly?: number | null;
  currency: string;
  features?: string[] | null;
  max_queries_per_month?: number | null;
  max_tokens_per_query?: number | null;
  is_active: boolean;
  created_at: Date;
}

export interface CreateSubscriptionPlanParams {
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  currency?: string;
  features?: string[];
  max_queries_per_month?: number;
  max_tokens_per_query?: number;
  is_active?: boolean;
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending';

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  payment_method?: string | null;
  started_at: Date;
  expires_at?: Date | null;
  cancelled_at?: Date | null;
  auto_renew: boolean;
  created_at: Date;
  updated_at: Date;
  
  // Joined data
  plan?: SubscriptionPlan;
}

export interface CreateUserSubscriptionParams {
  user_id: string;
  plan_id: string;
  status?: SubscriptionStatus;
  payment_method?: string;
  expires_at?: Date;
  auto_renew?: boolean;
}

export interface UpdateUserSubscriptionParams {
  status?: SubscriptionStatus;
  payment_method?: string;
  expires_at?: Date;
  cancelled_at?: Date;
  auto_renew?: boolean;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  user_id: string;
  subscription_id?: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  payment_provider?: string | null;
  external_payment_id?: string | null;
  status: PaymentStatus;
  metadata?: Record<string, any> | null;
  created_at: Date;
  completed_at?: Date | null;
  failed_at?: Date | null;
  failure_reason?: string | null;
  
  // Joined data
  user?: User;
  subscription?: UserSubscription;
}

export interface CreatePaymentParams {
  user_id: string;
  subscription_id?: string;
  amount: number;
  currency?: string;
  payment_method: string;
  payment_provider?: string;
  external_payment_id?: string;
  status?: PaymentStatus;
  metadata?: Record<string, any>;
}

export interface UpdatePaymentParams {
  status?: PaymentStatus;
  external_payment_id?: string;
  completed_at?: Date;
  failed_at?: Date;
  failure_reason?: string;
  metadata?: Record<string, any>;
}

export type QueryType = 'chat' | 'search' | 'generation' | 'analysis' | 'other';

export interface QueryHistory {
  id: string;
  user_id: string;
  session_id?: string | null;
  query_text: string;
  response_text?: string | null;
  tokens_used: number;
  model_used: string;
  query_type: QueryType;
  niche?: string | null;
  language: string;
  processing_time_ms?: number | null;
  success: boolean;
  error_message?: string | null;
  metadata?: Record<string, any> | null;
  created_at: Date;
  
  // Joined data
  user?: User;
}

export interface CreateQueryHistoryParams {
  user_id: string;
  session_id?: string;
  query_text: string;
  response_text?: string;
  tokens_used?: number;
  model_used?: string;
  query_type?: QueryType;
  niche?: string;
  language?: string;
  processing_time_ms?: number;
  success?: boolean;
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface UsageStatistics {
  id: string;
  user_id: string;
  period_start: Date;
  period_end: Date;
  total_queries: number;
  total_tokens: number;
  subscription_plan_id?: string | null;
  overage_queries: number;
  overage_tokens: number;
  created_at: Date;
  
  // Joined data
  user?: User;
  subscription_plan?: SubscriptionPlan;
}

export interface CreateUsageStatisticsParams {
  user_id: string;
  period_start: Date;
  period_end: Date;
  total_queries?: number;
  total_tokens?: number;
  subscription_plan_id?: string;
  overage_queries?: number;
  overage_tokens?: number;
}

export interface UpdateUsageStatisticsParams {
  total_queries?: number;
  total_tokens?: number;
  subscription_plan_id?: string;
  overage_queries?: number;
  overage_tokens?: number;
}

// Common query options
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface FilterOptions {
  start_date?: Date;
  end_date?: Date;
  status?: string;
  user_id?: string;
}

export interface QueryOptions extends PaginationOptions, FilterOptions {
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

// Response types for paginated results
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Database operation result types
export interface DatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  affected_rows?: number;
}

// Subscription plan features enum
export const SUBSCRIPTION_FEATURES = {
  BASIC_QUERIES: 'Базовые запросы',
  UNLIMITED_QUERIES: 'Неограниченные запросы',
  PRIORITY_SUPPORT: 'Приоритетная поддержка',
  ADVANCED_ANALYTICS: 'Расширенная аналитика',
  TEAM_COLLABORATION: 'Командная работа',
  API_ACCESS: 'API доступ',
  PERSONAL_SUPPORT: 'Персональная поддержка'
} as const;

// Payment methods enum
export const PAYMENT_METHODS = {
  SBP: 'sbp',
  CARD: 'card',
  YOOKASSA: 'yookassa',
  SBERBANK: 'sberbank'
} as const;

// Provider types enum
export const AUTH_PROVIDERS = {
  EMAIL: 'email',
  GOOGLE: 'google'
} as const; 