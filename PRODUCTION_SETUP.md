# Production Setup для Password Reset System

## Переменные окружения для продакшена

Убедитесь, что в production среде настроены следующие переменные:

### Database
```
DATABASE_URL="postgresql://username:password@hostname:port/database"
```

### Email Service (Resend)
```
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
RESEND_FROM_NAME="Your App Name"
SEND_REAL_EMAILS="true"
```

### Next.js
```
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-super-secret-key-here-minimum-32-characters"
NODE_ENV="production"
```

### Security
```
CSRF_SECRET="another-super-secret-key-for-csrf-protection"
```

## Настройка Resend Email Service

1. Зарегистрируйтесь на [resend.com](https://resend.com)
2. Получите API ключ в dashboard
3. Добавьте и верифицируйте свой домен
4. Настройте DNS записи для домена (SPF, DKIM)

## Проверка готовности к продакшену

### 1. База данных
- [ ] База данных создана и доступна
- [ ] Таблицы созданы (запустите миграции)
- [ ] CONNECTION_STRING настроен правильно

### 2. Email сервис
- [ ] RESEND_API_KEY настроен
- [ ] Домен верифицирован в Resend
- [ ] RESEND_FROM_EMAIL соответствует верифицированному домену

### 3. Домен и SSL
- [ ] NEXTAUTH_URL указывает на production домен с HTTPS
- [ ] SSL сертификат настроен и работает

### 4. Безопасность
- [ ] NEXTAUTH_SECRET - криптографически стойкий ключ (32+ символов)
- [ ] CSRF_SECRET настроен
- [ ] NODE_ENV="production"

## Тестирование в продакшене

1. Убедитесь, что все переменные окружения настроены
2. Запустите приложение в production режиме
3. Протестируйте полный флоу:
   - Запрос сброса пароля
   - Получение email
   - Переход по ссылке
   - Установка нового пароля

## Monitoring и логи

Система логирует важные события для мониторинга:
- Создание токенов сброса пароля
- Отправка email
- Ошибки в процессе сброса

Настройте мониторинг этих логов в вашей production среде.

## Troubleshooting

### Быстрая диагностика
Запустите диагностический скрипт:
```bash
node scripts/diagnose-email-production.js
```

Или проверьте конфигурацию через API:
```
GET https://yourdomain.com/api/test-email-config
```

### Email не приходит
1. **Проверьте RESEND_API_KEY**
   - Должен начинаться с `re_`
   - Получите в Resend dashboard
   - Проверьте, что ключ активен

2. **Убедитесь, что домен верифицирован**
   - Зайдите в Resend dashboard
   - Проверьте статус домена
   - Настройте DNS записи (SPF, DKIM)

3. **Проверьте RESEND_FROM_EMAIL**
   - Должен соответствовать верифицированному домену
   - Правильный формат: `noreply@yourdomain.com`

4. **Проверьте логи приложения**
   - Ищите ошибки "Resend email error"
   - Проверьте детали ошибки

### Типичные ошибки и решения

#### "API key invalid"
- Проверьте RESEND_API_KEY
- Убедитесь, что нет лишних пробелов
- Создайте новый API ключ в Resend

#### "Domain not verified" 
- Верифицируйте домен в Resend dashboard
- Настройте DNS записи
- Подождите до 24 часов для распространения DNS

#### "Invalid from email"
- RESEND_FROM_EMAIL должен принадлежать верифицированному домену
- Используйте формат: `name@yourdomain.com`

#### "Failed to send reset email"
- Проверьте все переменные окружения
- Запустите диагностику: `node scripts/diagnose-email-production.js`
- Проверьте лимиты Resend аккаунта

### Ссылка не работает
1. **Проверьте NEXTAUTH_URL**
   - Должен соответствовать production домену
   - Использовать HTTPS
   - Без слэша в конце

2. **База данных недоступна**
   - Проверьте DATABASE_URL
   - Убедитесь, что таблицы созданы
   - Проверьте подключение к БД

3. **Токен истек**
   - Токены действуют 1 час
   - Запросите новую ссылку сброса

### Общие ошибки
1. **Переменные окружения не загружаются**
   - Перезапустите приложение
   - Проверьте синтаксис .env файла
   - В Vercel: проверьте Environment Variables

2. **CORS ошибки**
   - Проверьте настройки домена
   - Убедитесь в правильности NEXTAUTH_URL

3. **Таймауты**
   - Проверьте подключение к БД
   - Увеличьте таймауты для Resend API