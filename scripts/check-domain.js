#!/usr/bin/env node

/**
 * Скрипт для проверки настройки кастомного домена
 * Использование: node scripts/check-domain.js your-domain.com
 */

const https = require('https');
const dns = require('dns');

const domain = process.argv[2];

if (!domain) {
  console.log('❌ Укажите домен: node scripts/check-domain.js your-domain.com');
  process.exit(1);
}

console.log(`🔍 Проверка домена: ${domain}\n`);

// Проверка DNS записей
function checkDNS() {
  return new Promise((resolve) => {
    dns.lookup(domain, (err, address) => {
      if (err) {
        console.log('❌ DNS не настроен:', err.message);
        resolve(false);
      } else {
        console.log('✅ DNS настроен:', address);
        resolve(true);
      }
    });
  });
}

// Проверка HTTPS
function checkHTTPS() {
  return new Promise((resolve) => {
    const req = https.get(`https://${domain}`, (res) => {
      console.log('✅ HTTPS работает, статус:', res.statusCode);
      console.log('✅ SSL сертификат валиден');
      resolve(true);
    });

    req.on('error', (err) => {
      console.log('❌ HTTPS ошибка:', err.message);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('❌ HTTPS таймаут');
      req.destroy();
      resolve(false);
    });
  });
}

// Проверка перенаправления с .vercel.app
function checkRedirect() {
  return new Promise((resolve) => {
    // Замените your-app на ваше реальное имя проекта
    const vercelDomain = 'your-app.vercel.app';
    
    const req = https.get(`https://${vercelDomain}`, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        if (location && location.includes(domain)) {
          console.log('✅ Перенаправление настроено:', location);
          resolve(true);
        } else {
          console.log('⚠️  Перенаправление не на ваш домен:', location);
          resolve(false);
        }
      } else {
        console.log('⚠️  Нет перенаправления с .vercel.app');
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log('⚠️  Не удалось проверить перенаправление:', err.message);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('⚠️  Таймаут при проверке перенаправления');
      req.destroy();
      resolve(false);
    });
  });
}

// Запуск всех проверок
async function runChecks() {
  const dnsOk = await checkDNS();
  
  if (dnsOk) {
    await checkHTTPS();
    await checkRedirect();
  }

  console.log('\n📋 Чек-лист:');
  console.log('□ DNS записи добавлены у провайдера');
  console.log('□ Домен добавлен в Vercel');
  console.log('□ NEXTAUTH_URL обновлен');
  console.log('□ Google OAuth redirect URI обновлен');
  console.log('□ Tribute webhook URL обновлен');
  
  console.log('\n🔗 Полезные ссылки:');
  console.log(`- Ваш сайт: https://${domain}`);
  console.log(`- Vercel Dashboard: https://vercel.com/dashboard`);
  console.log(`- Google Cloud Console: https://console.cloud.google.com/`);
}

runChecks().catch(console.error); 