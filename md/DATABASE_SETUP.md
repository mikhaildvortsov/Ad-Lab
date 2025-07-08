# PostgreSQL Database Setup Guide

## 📋 Overview

This database system provides comprehensive user management, query tracking, billing, and subscription management for the Ad Lab application.

### Database Tables:
- **users** - User accounts and authentication data
- **subscription_plans** - Available subscription plans (Free, Pro, Business)
- **user_subscriptions** - User subscription status and history
- **payments** - Payment transactions and billing history
- **query_history** - AI chat interactions and usage tracking
- **usage_statistics** - Monthly usage aggregates for billing

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install pg @types/pg uuid @types/uuid
npm install --save-dev tsx
```

### 2. Set Environment Variables
Update your `.env.local` file:
```env
# PostgreSQL Database URL
DATABASE_URL=postgresql://user:pass@host:port/db_name

# For local development with Docker:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/adlab_db

# For Vercel + Supabase:
# DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# For Railway:
# DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
```

### 3. Initialize Database
```bash
# Initialize schema and seed data
npm run db:init

# Or manually run schema only
npm run db:schema
```

## 🐳 Local Development with Docker

### Option 1: Docker Compose (Recommended)
Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: adlab_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run:
```bash
docker-compose up -d
```

### Option 2: Direct Docker
```bash
docker run --name adlab-postgres \
  -e POSTGRES_DB=adlab_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

## 🌐 Production Deployment

### Supabase (Recommended)
1. Create project at [supabase.com](https://supabase.com)
2. Get connection string from Settings > Database
3. Add to Vercel environment variables

### Railway
1. Create PostgreSQL service at [railway.app](https://railway.app)
2. Copy connection string
3. Add to Vercel environment variables

### Vercel Postgres
1. Add Vercel Postgres from Vercel dashboard
2. Connection string auto-configured

## 📊 Database Services

### UserService
```typescript
import { UserService } from '@/lib/services/user-service';

// Create user
const result = await UserService.createUser({
  email: 'user@example.com',
  name: 'John Doe',
  provider: 'google',
  provider_id: '123456789'
});

// Get user
const user = await UserService.getUserById(userId);
const userByEmail = await UserService.getUserByEmail('user@example.com');

// Update user
await UserService.updateUser(userId, { name: 'New Name' });
```

### QueryService
```typescript
import { QueryService } from '@/lib/services/query-service';

// Track AI query
const queryResult = await QueryService.createQuery({
  user_id: userId,
  session_id: sessionId,
  query_text: 'What is AI?',
  response_text: 'AI is...',
  tokens_used: 150,
  model_used: 'gpt-4o',
  niche: 'Technology'
});

// Get user's query history
const history = await QueryService.getUserQueries(userId, {
  page: 1,
  limit: 20
});
```

### BillingService
```typescript
import { BillingService } from '@/lib/services/billing-service';

// Get subscription plans
const plans = await BillingService.getSubscriptionPlans();

// Create subscription
const subscription = await BillingService.createUserSubscription({
  user_id: userId,
  plan_id: planId,
  payment_method: 'sbp'
});

// Check usage limits
const canQuery = await BillingService.canUserQuery(userId);

// Track payment
const payment = await BillingService.createPayment({
  user_id: userId,
  amount: 500,
  payment_method: 'sbp',
  status: 'pending'
});
```

## 🔧 Database Operations

### Manual Schema Updates
```bash
# Connect to database
psql $DATABASE_URL

# Run migrations
\i lib/database-schema.sql

# Check tables
\dt

# View table structure
\d users
```

### Backup & Restore
```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

## 📈 Monitoring & Analytics

### User Statistics
```typescript
const stats = await UserService.getUserStats();
// Returns: total_users, active_users, new_users_today, new_users_this_month
```

### Query Analytics
```typescript
const queryStats = await QueryService.getGlobalStats();
// Returns: total_queries, active_users_today, popular_niches, model_usage
```

### Billing Metrics
```typescript
const billingStats = await BillingService.getBillingStats();
// Returns: total_revenue, monthly_revenue, active_subscriptions
```

## 🔒 Security Features

### Data Protection
- UUID primary keys (not sequential)
- Parameterized queries (SQL injection protection)
- Connection pooling with limits
- Soft delete for users (GDPR compliance)

### Access Control
- Database-level constraints
- Application-level validation
- Transaction support for data consistency

## 🐛 Troubleshooting

### Common Issues

#### Connection Failed
```bash
# Check if PostgreSQL is running
docker ps

# Test connection
psql $DATABASE_URL -c "SELECT NOW();"
```

#### Tables Don't Exist
```bash
# Reinitialize database
npm run db:init
```

#### Permission Denied
```sql
-- Grant permissions (run as superuser)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
```

### Error Codes
- `42P01` - Table doesn't exist (run `npm run db:init`)
- `28P01` - Authentication failed (check credentials)
- `3D000` - Database doesn't exist (create database first)

## 📝 Usage Examples

### Complete User Registration Flow
```typescript
// 1. Create user from OAuth
const userResult = await UserService.upsertUser({
  email: profile.email,
  name: profile.name,
  avatar_url: profile.picture,
  provider: 'google',
  provider_id: profile.sub
});

// 2. Assign free plan
const freePlan = await BillingService.getSubscriptionPlans();
await BillingService.createUserSubscription({
  user_id: userResult.data.id,
  plan_id: freePlan.data[0].id // Free plan
});

// 3. Initialize usage tracking
await BillingService.upsertUsageStatistics({
  user_id: userResult.data.id,
  period_start: new Date(2024, 0, 1), // Start of month
  period_end: new Date(2024, 0, 31)   // End of month
});
```

### Chat Query with Billing Check
```typescript
// 1. Check if user can make query
const canQuery = await BillingService.canUserQuery(userId);
if (!canQuery.data?.can_query) {
  throw new Error(canQuery.data?.reason || 'Query limit exceeded');
}

// 2. Create query record
const queryRecord = await QueryService.createQuery({
  user_id: userId,
  session_id: sessionId,
  query_text: userMessage,
  model_used: 'gpt-4o',
  niche: selectedNiche
});

// 3. Get AI response (your OpenAI logic here)
const aiResponse = await getOpenAIResponse(userMessage);

// 4. Update query with response
await QueryService.updateQueryResponse(
  queryRecord.data.id,
  aiResponse.text,
  aiResponse.tokens,
  Date.now() - startTime
);

// 5. Update usage statistics
// (This would typically be done in a background job)
```

## 🚀 Performance Tips

1. **Use Connection Pooling** - Already configured in `lib/database.ts`
2. **Index Optimization** - Indexes automatically created during initialization
3. **Query Optimization** - Use the provided service methods for efficient queries
4. **Background Jobs** - Consider using a queue for heavy operations like usage aggregation

## 📞 Support

For database-related issues:
1. Check the troubleshooting section above
2. Verify your `DATABASE_URL` is correct
3. Ensure PostgreSQL version 12+ is used
4. Check Vercel logs for production issues 

## ✅ База данных PostgreSQL успешно создана!

Я создал полнофункциональную систему управления базой данных PostgreSQL для вашего приложения. Вот что было реализовано:

### 🏗️ **Структура базы данных:**

**6 основных таблиц:**
- **`users`** - пользователи (email, имя, OAuth, язык)
- **`subscription_plans`** - планы подписки (Free, Pro, Business)
- **`user_subscriptions`** - подписки пользователей
- **`payments`** - история платежей (СБП, карты)
- **`query_history`** - история запросов к ИИ
- **`usage_statistics`** - месячная статистика использования

### 📁 **Созданные файлы:**

```
lib/
├── database.ts              # Подключение к БД с пулом соединений
├── database-types.ts        # TypeScript типы для всех моделей
├── database-schema.sql      # SQL схема с индексами и триггерами
└── services/
    ├── user-service.ts      # CRUD операции для пользователей
    ├── query-service.ts     # Отслеживание запросов к ИИ
    └── billing-service.ts   # Биллинг и подписки

scripts/
└── init-database.ts        # Скрипт инициализации БД

DATABASE_SETUP.md           # Полное руководство по настройке
```

### 🚀 **Готовые сервисы:**

**UserService** - управление пользователями:
- Создание/обновление пользователей
- OAuth интеграция (Google)
- Статистика пользователей

**QueryService** - отслеживание запросов:
- Сохранение истории чатов
- Подсчет токенов и времени ответа
- Аналитика по нишам и моделям

**BillingService** - биллинг и подписки:
- Управление планами подписки
- Проверка лимитов использования
- История платежей и статистика

### ⚙️ **Автоматическая настройка:**

```bash
# Установка зависимостей (уже выполнено)
npm install pg @types/pg uuid @types/uuid tsx

# Инициализация БД
npm run db:init

# Или только схема
npm run db:schema
```

### 🔧 **Готовые команды npm:**
- `npm run db:init` - полная инициализация БД
- `npm run db:schema` - только схема БД

### 🌐 **Готовность к production:**
- **Connection pooling** для производительности
- **Индексы** для быстрых запросов
- **Транзакции** для целостности данных
- **Типизация TypeScript** для безопасности
- **GDPR compliance** (мягкое удаление)

### 📝 **Следующие шаги:**

1. **Настройте DATABASE_URL** в `.env.local`:
   ```env
   DATABASE_URL=postgresql://user:pass@host:port/db_name
   ```

2. **Для локальной разработки** используйте Docker:
   ```bash
   docker run --name adlab-postgres \
     -e POSTGRES_DB=adlab_db \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=password \
     -p 5432:5432 -d postgres:15
   ```

3. **Инициализируйте БД:**
   ```bash
   npm run db:init
   ```

4. **Интегрируйте в API** - используйте готовые сервисы в ваших route handlers

### 💡 **Пример использования:**

```typescript
import { UserService, QueryService, BillingService } from '@/lib/services';

// Создание пользователя
const user = await UserService.createUser({
  email: 'user@example.com',
  name: 'Иван Иванов',
  provider: 'google'
});

// Отслеживание запроса
await QueryService.createQuery({
  user_id: user.data.id,
  query_text: 'Как создать стартап?',
  response_text: 'Для создания стартапа...',
  tokens_used: 250,
  niche: 'Бизнес'
});

// Проверка лимитов
const canQuery = await BillingService.canUserQuery(user.data.id);
```

Система полностью готова к работе! 🎉 