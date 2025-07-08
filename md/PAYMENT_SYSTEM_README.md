# 💳 Система СБП Платежей - Ad Lab

## 🚀 Обзор

Полнофункциональная система оплаты через СБП (Систему быстрых платежей) интегрированная с ЮKassa. Система поддерживает создание платежей, генерацию QR-кодов, автоматическую обработку статусов через вебхуки и управление подписками.

## ✨ Возможности

- ✅ **Создание СБП платежей** через ЮKassa API
- ✅ **QR-коды** для мгновенной оплаты в банковских приложениях
- ✅ **Вебхуки** для автоматического обновления статусов платежей
- ✅ **База данных** для хранения платежей и подписок
- ✅ **Аутентификация** и проверка прав доступа
- ✅ **Обработка ошибок** и логирование
- ✅ **Тестирование** системы платежей
- ✅ **Пользовательский интерфейс** с поддержкой QR-кодов

## 🛠 Архитектура системы

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   YooKassa      │
│                 │    │                  │    │                 │
│ PaywallModal    │───▶│ /api/payments/   │───▶│ СБП платежи     │
│ QR Scanner      │    │ sbp              │    │ QR-коды         │
│ Status Updates  │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   PostgreSQL     │
                       │                  │
                       │ • payments       │
                       │ • subscriptions  │
                       │ • users          │
                       └──────────────────┘
                                ▲
                                │
                       ┌──────────────────┐
                       │   Webhooks       │
                       │                  │
                       │ Auto updates     │
                       │ Status tracking  │
                       └──────────────────┘
```

## 📁 Структура файлов

```
├── app/api/payments/
│   ├── sbp/
│   │   └── route.ts              # API для создания/проверки СБП платежей
│   └── webhook/
│       └── route.ts              # Вебхук для уведомлений от ЮKassa
├── components/
│   └── paywall-modal.tsx         # UI компонент для оплаты
├── lib/
│   ├── yookassa-client.ts        # Клиент для работы с ЮKassa API
│   ├── services/
│   │   └── billing-service.ts    # Сервис для работы с платежами в БД
│   ├── database-schema.sql       # Схема базы данных
│   └── database-types.ts         # TypeScript типы для БД
├── scripts/
│   └── test-payment-system.ts    # Скрипт для тестирования системы
└── PAYMENT_SYSTEM_README.md      # Данная документация
```

## 🔧 Настройка

### 1. Переменные окружения

Создайте файл `.env.local` со следующими переменными:

```bash
# ЮKassa настройки (обязательно)
YOOKASSA_SHOP_ID=your_shop_id_here
YOOKASSA_SECRET_KEY=your_secret_key_here

# База данных (обязательно)
DATABASE_URL=postgresql://user:password@localhost:5432/adlab_db

# JWT для сессий (обязательно, минимум 32 символа)
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars

# URL приложения
NEXTAUTH_URL=http://localhost:3000

# OpenAI (для основного функционала)
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Настройка ЮKassa

1. Зарегистрируйтесь на [yookassa.ru](https://yookassa.ru)
2. Получите `SHOP_ID` и `SECRET_KEY` в личном кабинете
3. Настройте webhook URL: `https://your-domain.com/api/payments/webhook`
4. Включите уведомления для событий:
   - `payment.succeeded`
   - `payment.canceled`
   - `payment.waiting_for_capture`

### 3. Настройка базы данных

```bash
# Инициализация схемы БД
psql -d your_database < lib/database-schema.sql

# Или используйте скрипт инициализации
npm run db:init
```

### 4. Установка зависимостей

```bash
npm install @a2seven/yoo-checkout
npm install uuid
npm install @types/uuid  # если используете TypeScript
```

## 🚀 Запуск

### Разработка

```bash
# Запуск приложения
npm run dev

# Тестирование платежной системы
npm run test:payments
# или
npx ts-node scripts/test-payment-system.ts
```

### Production

1. Убедитесь, что все переменные окружения настроены
2. Webhook URL должен быть доступен извне
3. Используйте HTTPS для безопасности
4. Настройте мониторинг логов платежей

## 🧪 Тестирование

Система включает автоматизированное тестирование:

```bash
# Запуск всех тестов платежной системы
npm run test:payments

# Ручное тестирование отдельных компонентов
node -e "
const { testYooKassaConnection } = require('./lib/yookassa-client');
testYooKassaConnection().then(console.log);
"
```

### Тестовые сценарии

1. ✅ **Проверка переменных окружения**
2. ✅ **Подключение к базе данных**
3. ✅ **Подключение к ЮKassa API**
4. ✅ **Создание тестового платежа**
5. ✅ **Получение статуса платежа**
6. ✅ **Работа с подписками**

## 🎯 Использование

### API Endpoints

#### POST `/api/payments/sbp`
Создание нового СБП платежа

```typescript
// Запрос
{
  "planId": "pro",
  "planName": "Профессиональный",
  "amount": 599
}

// Ответ
{
  "success": true,
  "paymentId": "2c85d245-...",
  "qrCode": "data:image/svg+xml;base64,...",
  "qrUrl": "https://qr.nspk.ru/...",
  "amount": 599,
  "currency": "RUB",
  "orderId": "adlab_1234567890_abc123",
  "status": "pending",
  "expiresAt": "2024-01-01T12:15:00.000Z"
}
```

#### GET `/api/payments/sbp?paymentId=xxx`
Проверка статуса платежа

```typescript
// Ответ
{
  "success": true,
  "paymentId": "2c85d245-...",
  "status": "completed",
  "amount": 599,
  "completedAt": "2024-01-01T12:10:00.000Z"
}
```

#### POST `/api/payments/webhook`
Вебхук для уведомлений от ЮKassa (автоматический)

### Frontend компоненты

```typescript
import { PaywallModal } from '@/components/paywall-modal';

function MyComponent() {
  const [showPaywall, setShowPaywall] = useState(false);

  const handlePaymentSuccess = () => {
    console.log('Платеж успешно завершен!');
    // Обновить UI, предоставить доступ к функциям
  };

  return (
    <PaywallModal
      open={showPaywall}
      onOpenChange={setShowPaywall}
      onPaymentSuccess={handlePaymentSuccess}
    />
  );
}
```

## 🔒 Безопасность

### Проверки в системе

- ✅ **Проверка подписи вебхуков** для защиты от подделки
- ✅ **Аутентификация пользователей** через JWT сессии
- ✅ **Валидация сумм платежей** против планов в БД
- ✅ **Rate limiting** для предотвращения спама
- ✅ **Шифрование конфиденциальных данных**
- ✅ **Логирование всех операций** для аудита

### Рекомендации

1. **Используйте HTTPS** в production
2. **Храните секретные ключи** в переменных окружения
3. **Мониторьте логи** на подозрительную активность
4. **Регулярно обновляйте** зависимости
5. **Тестируйте в sandbox** перед production

## 📊 Мониторинг

### Логи для отслеживания

```bash
# Создание платежей
[INFO] СБП платеж успешно создан: orderId=..., amount=599

# Обработка вебхуков
[INFO] Payment status updated: paymentId=..., oldStatus=pending, newStatus=completed

# Ошибки
[ERROR] ЮKassa payment creation error: Invalid amount
```

### Метрики для мониторинга

- Количество созданных платежей
- Процент успешных платежей
- Время обработки платежей
- Ошибки API ЮKassa
- Статусы вебхуков

## 🚨 Troubleshooting

### Частые проблемы

#### 1. "ЮKassa не настроена"
```bash
# Проверьте переменные окружения
echo $YOOKASSA_SHOP_ID
echo $YOOKASSA_SECRET_KEY

# Запустите тест подключения
npm run test:payments
```

#### 2. "Ошибка подключения к базе данных"
```bash
# Проверьте DATABASE_URL
psql $DATABASE_URL -c "SELECT 1"

# Убедитесь что таблицы созданы
psql $DATABASE_URL -c "\dt"
```

#### 3. "QR-код не отображается"
- Проверьте что `qrCode` содержит валидные данные
- Убедитесь что YooKassa возвращает `confirmation_data`
- Проверьте CSP политики для data: URLs

#### 4. "Вебхук не работает"
- URL должен быть доступен извне
- Проверьте настройки в личном кабинете ЮKassa
- Логи должны показывать входящие запросы
- Проверьте проверку подписи вебхука

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи приложения
2. Запустите тест системы: `npm run test:payments`
3. Проверьте статус ЮKassa на [status.yookassa.ru](https://status.yookassa.ru)
4. Обратитесь в поддержку ЮKassa при проблемах с API

## 📈 Roadmap

### Планы развития

- [ ] **Поддержка банковских карт** через ЮKassa
- [ ] **Рекуррентные платежи** для автопродления подписок
- [ ] **Частичные возвраты** через API
- [ ] **Аналитика платежей** в админ панели
- [ ] **Push уведомления** о статусах платежей
- [ ] **Apple Pay / Google Pay** интеграция
- [ ] **Поддержка криптовалют** через партнеров

---

**🎉 Система готова к работе!** При правильной настройке вы получите полнофункциональную систему СБП платежей с автоматической обработкой и отличным пользовательским опытом. 