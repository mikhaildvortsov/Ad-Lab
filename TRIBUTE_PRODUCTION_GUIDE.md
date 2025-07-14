# 🚀 Руководство по развертыванию Tribute в продакшене

## 📋 Чек-лист подготовки к продакшену

### 1. **Обязательные переменные окружения**

Добавьте следующие переменные в ваш `.env.local` или систему развертывания:

```bash
# Tribute Payment Integration (ОБЯЗАТЕЛЬНО)
TRIBUTE_API_KEY=your-tribute-api-key-from-tribute-dashboard
TRIBUTE_API_URL=https://api.tribute.tg/v1
TRIBUTE_WEBHOOK_SECRET=secure-random-string-minimum-32-characters

# Tribute Configuration (Опционально)
TRIBUTE_BOT_USERNAME=@tribute_bot
TRIBUTE_MIN_AMOUNT=100
TRIBUTE_MAX_AMOUNT=300000
TRIBUTE_COMMISSION_RATE=0.10

# Production URLs (ОБЯЗАТЕЛЬНО)
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
DATABASE_URL=your-production-database-url
```

### 2. **Получение API ключей от Tribute**

1. **Регистрация в Tribute:**
   - Свяжитесь с поддержкой Tribute через [@tribute_support](https://t.me/tribute_support)
   - Подайте заявку на подключение для вашего проекта
   - Предоставьте информацию о вашем приложении

2. **Получение ключей:**
   - `TRIBUTE_API_KEY` - основной API ключ для создания платежей
   - `TRIBUTE_WEBHOOK_SECRET` - секрет для валидации webhook уведомлений

3. **Настройка webhook URL:**
   - URL: `https://yourdomain.com/api/payments/webhook`
   - Убедитесь, что endpoint доступен и отвечает на GET запросы

### 3. **Безопасность**

#### 🔒 Webhook Security
- **ВСЕГДА** используйте `TRIBUTE_WEBHOOK_SECRET` в продакшене
- Минимальная длина секрета: 32 символа
- Используйте криптографически стойкий генератор случайных чисел

#### 🌐 HTTPS
- **ОБЯЗАТЕЛЬНО** используйте HTTPS для всех URL
- Проверьте SSL сертификаты
- Убедитесь, что webhook endpoint доступен по HTTPS

#### 🛡️ Rate Limiting
Настройте rate limiting для API endpoints:
- `/api/payments/tribute` - максимум 10 запросов в минуту на пользователя
- `/api/payments/webhook` - максимум 100 запросов в минуту

### 4. **Проверка готовности**

Запустите скрипт проверки:

```bash
npm run check:tribute
```

Этот скрипт проверит:
- ✅ Все необходимые переменные окружения
- ✅ Правильность настройки URL
- ✅ Безопасность webhook
- ✅ SSL/HTTPS конфигурацию

### 5. **Мониторинг и логирование**

#### 📊 Рекомендуемые метрики
- Количество успешных/неудачных платежей
- Время ответа webhook endpoint
- Ошибки валидации webhook подписей

#### 📝 Логирование
Настройте логирование для:
- Создания платежей (`/api/payments/tribute`)
- Webhook уведомлений (`/api/payments/webhook`)
- Ошибок валидации подписей

#### 🚨 Алерты
Настройте уведомления на:
- Неудачные платежи
- Ошибки webhook валидации
- Превышение rate limits

### 6. **Тестирование**

#### 🧪 Pre-production тестирование
1. **Тестовая среда:**
   - Развертните приложение в staging среде
   - Используйте тестовые ключи Tribute (если доступны)
   - Протестируйте полный цикл платежей

2. **Webhook тестирование:**
   ```bash
   # Проверьте доступность webhook
   curl https://yourdomain.com/api/payments/webhook
   
   # Ответ должен быть: {"message": "Webhook endpoint is active", "timestamp": "..."}
   ```

3. **Платежный цикл:**
   - Создание платежа
   - Переход в Telegram/Tribute
   - Оплата (в тестовом режиме)
   - Получение webhook уведомления
   - Активация подписки

### 7. **Развертывание**

#### 🚀 Шаги развертывания

1. **Подготовка:**
   ```bash
   # Убедитесь, что все проверки пройдены
   npm run check:tribute
   
   # Сборка для продакшена
   npm run build
   ```

2. **Переменные окружения:**
   - Установите все Tribute переменные в вашей платформе развертывания
   - Убедитесь, что `NODE_ENV=production`
   - Проверьте правильность `NEXTAUTH_URL`

3. **База данных:**
   - Убедитесь, что миграции применены
   - Проверьте подключение к production БД

4. **Webhook регистрация:**
   - Сообщите команде Tribute ваш production webhook URL
   - Убедитесь, что endpoint доступен сразу после развертывания

#### 🌐 Платформы развертывания

**Vercel:**
```bash
# Установите переменные окружения через Vercel Dashboard
vercel env add TRIBUTE_API_KEY
vercel env add TRIBUTE_WEBHOOK_SECRET
# ... остальные переменные

# Развертывание
vercel --prod
```

**Railway/Render:**
- Добавьте все переменные через dashboard
- Убедитесь в правильности domain настроек

### 8. **Post-deployment проверки**

После развертывания:

1. **Проверьте endpoints:**
   ```bash
   curl https://yourdomain.com/api/payments/webhook
   # Должен отвечать 200 OK
   ```

2. **Проверьте создание платежа:**
   - Войдите в приложение
   - Попытайтесь создать тестовый платеж
   - Проверьте логи на наличие ошибок

3. **Мониторинг:**
   - Настройте мониторинг всех payment endpoints
   - Проверьте метрики и алерты

### 9. **Troubleshooting**

#### 🐛 Частые проблемы

**Webhook не получает уведомления:**
- Проверьте доступность URL для внешних запросов
- Убедитесь в правильности SSL сертификата
- Проверьте логи на предмет ошибок валидации

**Ошибки валидации подписи:**
- Проверьте правильность `TRIBUTE_WEBHOOK_SECRET`
- Убедитесь, что секрет идентичен в Tribute и приложении
- Проверьте формат подписи в заголовках

**Платежи не активируют подписки:**
- Проверьте логи webhook endpoint
- Убедитесь в правильности данных платежа
- Проверьте связь payment -> subscription в БД

### 10. **Поддержка**

#### 📞 Контакты
- **Техническая поддержка Tribute:** [@tribute_support](https://t.me/tribute_support)
- **Документация API:** [tribute.tg/docs](https://tribute.tg/docs)
- **Статус сервиса:** [status.tribute.tg](https://status.tribute.tg)

#### 📚 Полезные ссылки
- [Официальная документация Tribute](https://docs.tribute.tg)
- [Примеры интеграции](https://github.com/tribute-tg/examples)
- [FAQ по интеграции](https://tribute.tg/faq)

---

## ✅ Финальный чек-лист

Перед запуском в продакшене убедитесь:

- [ ] Все переменные окружения настроены
- [ ] `npm run check:tribute` проходит без ошибок
- [ ] Webhook endpoint доступен по HTTPS
- [ ] SSL сертификат валидный
- [ ] Rate limiting настроен
- [ ] Мониторинг и алерты активированы
- [ ] Полный цикл платежей протестирован
- [ ] Backup базы данных настроен
- [ ] Контактная информация команды Tribute получена

**🎉 После выполнения всех пунктов ваш Tribute готов к продакшену!** 