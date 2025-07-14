# Интеграция с Tribute

## Обзор

Tribute — это Telegram-сервис для монетизации аудитории, позволяющий принимать оплату за подписки, донаты и цифровые товары прямо в Telegram. Сервис использует Telegram Stars для цифровых товаров и поддерживает традиционные способы оплаты для физических товаров.

## Преимущества Tribute

- **Нативная интеграция с Telegram** - оплата происходит внутри экосистемы Telegram
- **Telegram Stars** - для цифровых товаров используется внутренняя валюта Telegram
- **Низкая комиссия** - всего 10% без скрытых платежей
- **Безопасность** - верифицированный бот с синей галочкой
- **Простота использования** - интуитивно понятный интерфейс
- **Быстрые выплаты** - дважды в месяц

## Возможности

### Типы платежей
- **Подписки** - регулярные платежи за доступ к контенту
- **Донаты** - разовые поддержки от подписчиков  
- **Цифровые товары** - курсы, материалы, консультации
- **Физические товары** - мерч, продукция

### Поддерживаемые валюты
- **RUB** (российские рубли)
- **EUR** (евро)
- **Telegram Stars** (для цифровых товаров)

### Лимиты
- **Минимальная сумма**: 100 рублей
- **Максимальная сумма**: 300,000 рублей
- **Комиссия**: 10%

## Техническая интеграция

### Основные компоненты

1. **TributeService** (`lib/services/tribute-service.ts`)
   - Создание платежей и подписок
   - Генерация Telegram deep links
   - Проверка статуса платежей
   - Обработка webhook

2. **API маршруты** (`app/api/payments/tribute/route.ts`)
   - POST для создания платежей
   - GET для проверки статуса

3. **UI компонент** (обновлен `components/paywall-modal.tsx`)
   - Интерфейс для выбора планов
   - Кнопка перехода в Telegram
   - Отслеживание статуса платежа

### Переменные окружения

```env
# Tribute API настройки
TRIBUTE_API_URL=https://api.tribute.tg/v1
TRIBUTE_WEBHOOK_SECRET=your-webhook-secret
TRIBUTE_API_KEY=your-api-key

# Общие настройки приложения
NEXTAUTH_URL=https://yourdomain.com
```

### Процесс оплаты

1. **Выбор плана** - пользователь выбирает подписку в UI
2. **Создание платежа** - отправка данных на `/api/payments/tribute`
3. **Генерация ссылки** - создание deep link для Telegram
4. **Переход в Telegram** - пользователь переходит в Tribute bot
5. **Оплата** - завершение платежа в Telegram
6. **Webhook** - получение уведомления о статусе
7. **Активация** - активация подписки/доступа

### Форматы данных

#### Запрос создания платежа
```typescript
interface TributePaymentRequest {
  amount: number;          // Сумма в рублях
  currency: string;        // 'RUB' или 'EUR'
  description: string;     // Описание платежа
  paymentId: string;       // ID платежа в БД
  userId: string;          // ID пользователя
  planName: string;        // Название плана
  returnUrl?: string;      // URL возврата
  webhookUrl?: string;     // URL webhook
}
```

#### Ответ с данными платежа
```typescript
interface TributePaymentResponse {
  success: boolean;
  data?: {
    paymentUrl: string;    // Deep link для Telegram
    tributeUrl: string;    // Основная ссылка
    paymentId: string;     // ID платежа
    orderId: string;       // ID заказа
    amount: number;        // Сумма
    expiresAt: string;     // Время истечения
  };
  error?: string;
}
```

### Deep Links

Tribute использует Telegram deep links для перенаправления пользователей:

```
https://t.me/tribute_bot?start=payment_<encoded_data>
https://t.me/tribute_bot?start=subscription_<encoded_data>
```

Где `<encoded_data>` - это base64 закодированные данные платежа.

### Webhook обработка

Tribute отправляет webhook уведомления о статусе платежей:

```typescript
// Типы событий
- payment.completed    // Платеж завершен
- payment.failed       // Платеж не удался
- subscription.created // Подписка создана
- subscription.cancelled // Подписка отменена
```

Пример обработки webhook:
```typescript
export async function POST(request: NextRequest) {
  const payload = await request.json();
  const signature = request.headers.get('x-tribute-signature');
  
  // Проверка подписи
  if (!TributeService.validateWebhookSignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // Обработка события
  const processed = await TributeService.processWebhook(payload);
  
  return NextResponse.json({ success: processed });
}
```

## UI/UX интеграция

### Локализация

Обновлены переводы в `locales/en.json` и `locales/ru.json`:

```json
{
  "paywallModal": {
    "payment": {
      "tribute": {
        "title": "Оплата через Tribute",
        "description": "Оплачивайте через безопасный сервис Telegram",
        "createPayment": "Создать Tribute платеж",
        "openInTelegram": "Открыть в Telegram",
        "amount": "Сумма: {amount} ₽"
      }
    }
  }
}
```

### Типы данных

Обновлен `lib/database-types.ts`:

```typescript
export type PaymentMethod = 'tribute' | 'card' | 'yookassa' | 'other';

export const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = {
  tribute: 'Tribute',
  card: 'Карта',
  yookassa: 'ЮKassa',
  other: 'Другое'
};
```

## Развертывание

### Шаги миграции с СБП

1. **Удалить SBP файлы**:
   ```bash
   rm lib/services/sbp-service.ts
   rm app/api/payments/sbp/route.ts
   rm md/SBP_INTEGRATION_GUIDE.md
   ```

2. **Обновить зависимости**:
   ```bash
   npm uninstall qrcode @types/qrcode
   npm install  # Установить обновленные зависимости
   ```

3. **Обновить переменные окружения**:
   - Удалить SBP переменные
   - Добавить Tribute переменные

4. **Обновить БД**:
   ```sql
   UPDATE payments SET payment_method = 'tribute' WHERE payment_method = 'sbp';
   ```

### Тестирование

1. **Создание тестового платежа**:
   ```typescript
   const testPayment = await TributeService.createPayment({
     paymentId: 'test-123',
     amount: 1000, // 1000 рублей
     currency: 'RUB',
     description: 'Тестовый платеж',
     userId: 'user-123',
     planName: 'Тестовый план'
   });
   ```

2. **Проверка deep link**:
   - Убедитесь, что ссылка открывается в Telegram
   - Проверьте корректность передачи данных

3. **Webhook тестирование**:
   - Используйте инструменты типа ngrok для локального тестирования
   - Проверьте обработку всех типов событий

## Мониторинг и аналитика

### Логирование

```typescript
console.log('Tribute Payment:', {
  paymentId: payment.id,
  amount: payment.amount,
  status: payment.status,
  userId: payment.userId,
  timestamp: new Date().toISOString()
});
```

### Метрики для отслеживания

- Конверсия переходов в Telegram
- Успешность платежей
- Средняя сумма платежа
- Время от создания до оплаты
- Отказы и ошибки

## Поддержка и документация

### Официальные ресурсы

- **Веб-сайт**: [tribute.tg](https://tribute.tg)
- **Документация**: [wiki.tribute.tg](https://wiki.tribute.tg)
- **Новости**: [@TributeNewsEN](https://t.me/TributeNewsEN)
- **Поддержка**: tribute@top.team

### API документация

- [Orders API](https://wiki.tribute.tg/for-content-creators/api-documentation/orders)
- [Webhooks](https://wiki.tribute.tg/for-content-creators/api-documentation/webhooks)

## Безопасность

### Обязательные меры

1. **Валидация webhook** - всегда проверяйте подпись
2. **HTTPS** - используйте только защищенные соединения
3. **Переменные окружения** - храните ключи безопасно
4. **Логирование** - ведите журнал всех операций
5. **Лимиты** - проверяйте суммы и лимиты

### Пример валидации webhook

```typescript
import crypto from 'crypto';

const validateWebhookSignature = (payload: string, signature: string) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.TRIBUTE_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
};
```

## Заключение

Интеграция с Tribute обеспечивает:

- ✅ Простоту использования для пользователей
- ✅ Надежность благодаря интеграции с Telegram
- ✅ Низкие комиссии (10%)
- ✅ Поддержку множества типов платежей
- ✅ Telegram Stars для цифровых товаров
- ✅ Быстрые выплаты дважды в месяц

Интеграция позволяет полностью заменить СБП более современным и удобным решением для монетизации в Telegram экосистеме. 