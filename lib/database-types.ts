export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
export interface QueryOptions {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  start_date?: Date;
  end_date?: Date;
}
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  provider: string;
  provider_id?: string | null;
  password_hash?: string | null; 
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  is_active: boolean;
  preferred_language: string;
}
export interface CreateUserParams {
  email: string;
  name: string;
  avatar_url?: string;
  provider?: string;
  provider_id?: string;
  password?: string; 
  email_verified?: boolean;
  preferred_language?: string;
}
export interface UpdateUserParams {
  name?: string;
  avatar_url?: string;
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
  created_at: string;
}
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired' | 'pending';
export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string | null;
  metadata?: Record<string, any> | null;
}
export interface CreateUserSubscriptionParams {
  user_id: string;
  plan_id: string;
  status?: SubscriptionStatus;
  current_period_start?: Date;
  current_period_end?: Date;
  metadata?: Record<string, any>;
}
export interface UpdateUserSubscriptionParams {
  plan_id?: string;
  status?: SubscriptionStatus;
  current_period_start?: Date;
  current_period_end?: Date;
  cancelled_at?: Date;
  metadata?: Record<string, any>;
}
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'tribute' | 'card' | 'yookassa' | 'other';
export const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = {
  tribute: 'Tribute',
  card: 'Карта',
  yookassa: 'ЮKassa',
  other: 'Другое'
};
export interface Payment {
  id: string;
  user_id: string;
  subscription_id?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  external_payment_id?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  failed_at?: string | null;
  failure_reason?: string | null;
  metadata?: Record<string, any> | null;
}
export interface CreatePaymentParams {
  user_id: string;
  subscription_id?: string;
  amount: number;
  currency?: string;
  status?: PaymentStatus;
  payment_method: PaymentMethod;
  external_payment_id?: string;
  metadata?: Record<string, any>;
}
export interface UpdatePaymentParams {
  status?: PaymentStatus;
  external_payment_id?: string;
  metadata?: Record<string, any>;
}
export interface QueryHistory {
  id: string;
  user_id: string;
  session_id?: string | null;
  query_text: string;
  response_text?: string | null;
  tokens_used: number;
  model_used: string;
  query_type: string;
  niche?: string | null;
  language: string;
  processing_time_ms?: number | null;
  success: boolean;
  error_message?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}
export interface CreateQueryParams {
  user_id: string;
  session_id?: string;
  query_text: string;
  response_text?: string;
  tokens_used?: number;
  model_used: string;
  query_type?: string;
  niche?: string;
  language?: string;
  processing_time_ms?: number;
  success?: boolean;
  error_message?: string;
  metadata?: Record<string, any>;
}
export interface UpdateQueryParams {
  response_text?: string;
  tokens_used?: number;
  processing_time_ms?: number;
  success?: boolean;
  error_message?: string;
  metadata?: Record<string, any>;
}
export interface UsageStatistics {
  id: string;
  user_id: string;
  month: string; 
  queries_count: number;
  tokens_used: number;
  created_at: string;
  updated_at: string;
}
export interface CreateUsageStatisticsParams {
  user_id: string;
  month: string;
  queries_count?: number;
  tokens_used?: number;
}
export interface UpdateUsageStatisticsParams {
  queries_count?: number;
  tokens_used?: number;
}
export interface FrontendPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  improvements: number;
  popular?: boolean;
}
export const PLAN_ID_TO_NAME: Record<string, string> = {
  'week': 'Week',
  'month': 'Month',
  'quarter': 'Quarter'
};
export const PLAN_NAME_TO_ID: Record<string, string> = {
  'Week': 'week', 
  'Month': 'month',
  'Quarter': 'quarter'
};
