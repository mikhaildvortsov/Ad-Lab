-- PostgreSQL Database Schema for User Management System
-- Created for Next.js app with authentication, billing, and query tracking

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - main user information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(512),
    provider VARCHAR(50) DEFAULT 'email', -- 'google', 'email', etc.
    provider_id VARCHAR(255), -- ID from OAuth provider
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    preferred_language VARCHAR(10) DEFAULT 'ru'
);

-- Subscription plans table
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'RUB',
    features JSONB, -- Store features as JSON array
    max_queries_per_month INTEGER,
    max_tokens_per_query INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User subscriptions table
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'pending'
    payment_method VARCHAR(50), -- 'sbp', 'card', 'yookassa', etc.
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment history table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50), -- 'yookassa', 'sberbank', etc.
    external_payment_id VARCHAR(255), -- ID from payment provider
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    metadata JSONB, -- Store additional payment data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT
);
-- Query history table - track user interactions with AI
CREATE TABLE query_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- Group queries by chat session
    query_text TEXT NOT NULL,
    response_text TEXT,
    tokens_used INTEGER DEFAULT 0,
    model_used VARCHAR(50) DEFAULT 'gpt-4o',
    query_type VARCHAR(50) DEFAULT 'chat', -- 'chat', 'search', 'generation', etc.
    niche VARCHAR(100), -- Business niche context
    language VARCHAR(10) DEFAULT 'ru',
    processing_time_ms INTEGER, -- Response time in milliseconds
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    metadata JSONB, -- Store additional query context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Usage statistics table - monthly aggregates for billing
CREATE TABLE usage_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_queries INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    subscription_plan_id UUID REFERENCES subscription_plans(id),
    overage_queries INTEGER DEFAULT 0,
    overage_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, period_start, period_end)
);

-- Indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider_id ON users(provider, provider_id);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_external_id ON payments(external_payment_id);
CREATE INDEX idx_query_history_user_id ON query_history(user_id);
CREATE INDEX idx_query_history_session_id ON query_history(session_id);
CREATE INDEX idx_query_history_created_at ON query_history(created_at);
CREATE INDEX idx_usage_statistics_user_period ON usage_statistics(user_id, period_start);

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, max_queries_per_month, max_tokens_per_query) VALUES
('Week', 'Недельный доступ ко всем функциям', 1990.00, NULL, '["Полный доступ на 7 дней", "Неограниченные улучшения", "Все функции приложения", "Поддержка 24/7"]', -1, -1),
('Month', 'Месячный доступ со скидкой', 2990.00, NULL, '["Полный доступ на 30 дней", "Неограниченные улучшения", "Все функции приложения", "Приоритетная поддержка", "Экономия 57%"]', -1, -1),
('Quarter', 'Максимальная экономия на 3 месяца', 9990.00, NULL, '["Полный доступ на 90 дней", "Неограниченные улучшения", "Все функции приложения", "VIP поддержка", "Максимальная экономия"]', -1, -1);

-- Grant necessary permissions (adjust according to your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user; 