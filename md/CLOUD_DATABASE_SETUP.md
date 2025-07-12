# Создание облачной базы данных

## Обзор
Эта инструкция поможет вам создать облачную PostgreSQL базу данных из файлов вашего проекта, используя Neon.tech.

## Что у вас уже есть:
- ✅ Полная схема базы данных (`lib/database-schema.sql`)
- ✅ Скрипт инициализации (`scripts/init-database.ts`)
- ✅ Все необходимые сервисы и типы данных
- ✅ Конфигурация для Neon.tech

## Шаг 1: Создание аккаунта в Neon.tech

1. Перейдите на https://neon.tech
2. Нажмите "Sign up" (Регистрация)
3. Войдите через GitHub или создайте аккаунт через email
4. Подтвердите email (если необходимо)

## Шаг 2: Создание новой базы данных

1. В консоли Neon.tech нажмите "Create Project"
2. Выберите настройки:
   - **Project name**: `ad-lab-project` (или любое другое имя)
   - **Database name**: `neondb`
   - **Region**: `Europe (Ireland)` или `US East` (ближайший к вам)
   - **PostgreSQL version**: `16` (последняя стабильная)
3. Нажмите "Create project"

## Шаг 3: Получение строки подключения

1. После создания проекта, перейдите в раздел "Dashboard"
2. Найдите секцию "Connection Details"
3. Скопируйте **Connection string** (Database URL)
4. Строка будет выглядеть примерно так:
   ```
   postgresql://neondb_owner:abc123@ep-example-123456.eu-west-2.aws.neon.tech/neondb?sslmode=require
   ```

## Шаг 4: Настройка переменных окружения

1. Скопируйте файл `env.example` в `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Откройте `.env.local` и замените DATABASE_URL на вашу строку подключения:
   ```env
   DATABASE_URL="postgresql://ваша_строка_подключения_из_neon"
   ```

3. Заполните остальные переменные:
   ```env
   NEXTAUTH_SECRET="generated_secret_32_characters_long"
   JWT_SECRET="another_secret_at_least_32_characters_long"
   GOOGLE_CLIENT_ID="your_google_client_id"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   OPENAI_API_KEY="your_openai_api_key"
   ```

## Шаг 5: Инициализация базы данных

1. Установите зависимости (если еще не установлены):
   ```bash
   npm install
   ```

2. Запустите инициализацию базы данных:
   ```bash
   npm run db:init
   ```

   Этот скрипт:
   - Проверит подключение к базе данных
   - Создаст все необходимые таблицы
   - Добавит индексы для производительности
   - Вставит базовые данные (планы подписки)

## Шаг 6: Тестирование подключения

1. Проверьте подключение к Neon.tech:
   ```bash
   npm run test:neon
   ```

2. Если все прошло успешно, вы увидите:
   ```
   ✅ Database connection successful
   ✅ All required tables exist
   ✅ Extensions are installed
   ```

## Шаг 7: Проверка в веб-интерфейсе

1. Запустите приложение:
   ```bash
   npm run dev
   ```

2. Перейдите на http://localhost:3000
3. Попробуйте зарегистрироваться/войти
4. Проверьте dashboard для отображения истории запросов

## Мониторинг и управление

### Просмотр данных в Neon.tech
1. В консоли Neon.tech перейдите в раздел "SQL Editor"
2. Выполните запросы для просмотра данных:
   ```sql
   SELECT * FROM users;
   SELECT * FROM subscription_plans;
   SELECT * FROM query_history;
   ```

### Резервное копирование
- Neon.tech автоматически создает резервные копии
- Вы можете создать point-in-time recovery
- Доступ к истории изменений в разделе "Branches"

### Мониторинг производительности
- Используйте раздел "Monitoring" для просмотра метрик
- Настройте алерты для высокой нагрузки
- Проверяйте использование storage

## Структура вашей базы данных

После инициализации у вас будет:

### Таблицы:
- `users` - пользователи системы
- `subscription_plans` - планы подписки
- `user_subscriptions` - подписки пользователей
- `payments` - история платежей
- `query_history` - история запросов к AI
- `usage_statistics` - статистика использования

### Планы подписки (по умолчанию):
- **Free** - Бесплатный (5 запросов/день)
- **Week** - Недельный (₽1990, безлимит)
- **Month** - Месячный (₽2990, безлимит)
- **Quarter** - Квартальный (₽9990, безлимит)

## Полезные команды

```bash
# Инициализация базы данных
npm run db:init

# Применение схемы (если DATABASE_URL настроен)
npm run db:schema

# Тестирование подключения к Neon.tech
npm run test:neon

# Запуск приложения
npm run dev
```

## Безопасность

### Настройки Neon.tech:
- SSL автоматически включен
- IP whitelist (опционально)
- Ротация паролей через консоль

### Переменные окружения:
- Никогда не коммитьте `.env.local` в git
- Используйте разные секреты для разных сред
- Регулярно меняйте секретные ключи

## Масштабирование

### Neon.tech предоставляет:
- **Автоскейлинг** compute ресурсов
- **Branching** для разработки
- **Read replicas** для высокой нагрузки
- **Connection pooling** встроенный

## Troubleshooting

### Ошибки подключения:
1. Проверьте правильность DATABASE_URL
2. Убедитесь, что проект в Neon.tech активен
3. Проверьте интернет-соединение

### Ошибки инициализации:
1. Убедитесь, что установлены все зависимости (`npm install`)
2. Проверьте права доступа к базе данных
3. Очистите базу данных и повторите инициализацию

## Контакты для поддержки

- **Neon.tech**: https://neon.tech/docs
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Next.js**: https://nextjs.org/docs 