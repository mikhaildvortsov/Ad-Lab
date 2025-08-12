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

### Email не приходит
1. Проверьте RESEND_API_KEY
2. Убедитесь, что домен верифицирован
3. Проверьте RESEND_FROM_EMAIL
4. Проверьте логи приложения на ошибки

### Ссылка не работает
1. Проверьте NEXTAUTH_URL
2. Убедитесь, что база данных доступна
3. Проверьте, что токен не истек (1 час)

### Общие ошибки
1. Проверьте DATABASE_URL
2. Убедитесь, что все таблицы созданы
3. Проверьте логи приложения