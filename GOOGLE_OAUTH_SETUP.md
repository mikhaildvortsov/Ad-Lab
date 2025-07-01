# Настройка Google OAuth для Ad Lab

## Шаг 1: Создание проекта в Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API и Google OAuth2 API

## Шаг 2: Настройка OAuth 2.0

1. В меню слева выберите "APIs & Services" > "Credentials"
2. Нажмите "Create Credentials" > "OAuth 2.0 Client IDs"
3. Выберите тип приложения "Web application"
4. Заполните форму:
   - **Name**: Ad Lab
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (для разработки)
     - `https://your-domain.com` (для продакшена)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/google` (для разработки)
     - `https://your-domain.com/api/auth/google` (для продакшена)

## Шаг 3: Получение учетных данных

После создания OAuth 2.0 Client ID вы получите:
- **Client ID** (например: `123456789-abcdef.apps.googleusercontent.com`)
- **Client Secret** (например: `GOCSPX-abcdefghijklmnop`)

## Шаг 4: Настройка переменных окружения

1. Создайте файл `.env.local` в корне проекта
2. Добавьте следующие переменные:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here
```

## Шаг 5: Генерация NEXTAUTH_SECRET

Для генерации безопасного секрета используйте:

```bash
openssl rand -base64 32
```

Или онлайн генератор: https://generate-secret.vercel.app/32

## Шаг 6: Тестирование

1. Запустите проект: `npm run dev`
2. Перейдите на страницу авторизации: `http://localhost:3000/auth`
3. Нажмите "Продолжить с Google"
4. Выполните авторизацию через Google

## Важные замечания

- **Никогда не коммитьте `.env.local` в git**
- Для продакшена используйте HTTPS URLs
- Обновите redirect URIs в Google Console при деплое
- Client Secret должен храниться в безопасности

## Troubleshooting

### Ошибка "redirect_uri_mismatch"
- Проверьте, что redirect URI в Google Console точно совпадает с URL в коде
- Убедитесь, что используется правильный протокол (http/https)

### Ошибка "invalid_client"
- Проверьте правильность Client ID и Client Secret
- Убедитесь, что переменные окружения загружены

### Ошибка "access_denied"
- Пользователь отменил авторизацию
- Проверьте настройки OAuth consent screen 