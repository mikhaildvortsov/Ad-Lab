#!/usr/bin/env node

/**
 * Скрипт для создания фавиконов разных размеров
 * Создает ICO файл и PNG файлы для различных устройств
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Создание фавиконов...\n');

// Создаем простой SVG для ICO (без градиентов для лучшей совместимости)
const simpleFavicon = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="16" cy="16" r="15" fill="white" stroke="#e2e8f0" stroke-width="1"/>
  
  <!-- Ad Lab Star -->
  <g transform="translate(16, 16)">
    <!-- Вертикальный луч вверх -->
    <path d="M-1.25,-2 L-1.25,-8 L-0.5,-9 L0.5,-9 L1.25,-8 L1.25,-2 Z" fill="#3b82f6"/>
    
    <!-- Вертикальный луч вниз -->
    <path d="M-1.25,2 L-1.25,8 L-0.5,9 L0.5,9 L1.25,8 L1.25,2 Z" fill="#3b82f6"/>
    
    <!-- Горизонтальный луч влево -->
    <path d="M-2,-1.25 L-8,-1.25 L-9,-0.5 L-9,0.5 L-8,1.25 L-2,1.25 Z" fill="#3b82f6"/>
    
    <!-- Горизонтальный луч вправо -->
    <path d="M2,-1.25 L8,-1.25 L9,-0.5 L9,0.5 L8,1.25 L2,1.25 Z" fill="#3b82f6"/>
    
    <!-- Центральный ромб -->
    <path d="M-2,-2 L0,-3 L2,-2 L3,0 L2,2 L0,3 L-2,2 L-3,0 Z" fill="#3b82f6"/>
  </g>
</svg>`;

// Создаем Apple Touch Icon (больший размер с градиентом)
const appleTouchIcon = `<svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#60A5FA;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1D4ED8;stop-opacity:1" />
    </linearGradient>
    
    <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F1F5F9;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background with rounded corners for iOS -->
  <rect width="180" height="180" rx="40" fill="url(#gradient)"/>
  
  <!-- Ad Lab Star - scaled up for iOS -->
  <g transform="translate(90, 90) scale(2.5)">
    <!-- Вертикальный луч вверх -->
    <path d="M-2.5,-4 L-2.5,-16 L-1,-18 L1,-18 L2.5,-16 L2.5,-4 Z" fill="url(#starGradient)"/>
    
    <!-- Вертикальный луч вниз -->
    <path d="M-2.5,4 L-2.5,16 L-1,18 L1,18 L2.5,16 L2.5,4 Z" fill="url(#starGradient)"/>
    
    <!-- Горизонтальный луч влево -->
    <path d="M-4,-2.5 L-16,-2.5 L-18,-1 L-18,1 L-16,2.5 L-4,2.5 Z" fill="url(#starGradient)"/>
    
    <!-- Горизонтальный луч вправо -->
    <path d="M4,-2.5 L16,-2.5 L18,-1 L18,1 L16,2.5 L4,2.5 Z" fill="url(#starGradient)"/>
    
    <!-- Центральный ромб -->
    <path d="M-4,-4 L0,-6 L4,-4 L6,0 L4,4 L0,6 L-4,4 L-6,0 Z" fill="url(#starGradient)"/>
  </g>
</svg>`;

// Сохраняем файлы
try {
  // Простой SVG для favicon.ico
  fs.writeFileSync(path.join('public', 'favicon-simple.svg'), simpleFavicon);
  console.log('✅ Создан favicon-simple.svg');

  // Apple Touch Icon
  fs.writeFileSync(path.join('public', 'apple-touch-icon.svg'), appleTouchIcon);
  console.log('✅ Создан apple-touch-icon.svg');

  // Создаем manifest.json для веб-приложения
  const manifest = {
    name: "Ad Lab - AI Copywriting Assistant",
    short_name: "Ad Lab",
    description: "AI-powered copywriting and content generation platform",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml"
      },
      {
        src: "/apple-touch-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml"
      }
    ]
  };

  fs.writeFileSync(path.join('public', 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('✅ Создан manifest.json');

  console.log('\n🎯 Созданные файлы:');
  console.log('- public/favicon.svg (основной)');
  console.log('- public/favicon-simple.svg (для ICO)');
  console.log('- public/apple-touch-icon.svg (для iOS)');
  console.log('- public/manifest.json (PWA манифест)');

  console.log('\n📱 Рекомендации:');
  console.log('1. Конвертируйте favicon-simple.svg в favicon.ico онлайн:');
  console.log('   - https://convertio.co/svg-ico/');
  console.log('   - https://www.favicon.cc/');
  console.log('2. Обновите метаданные в app/layout.tsx');
  console.log('3. Протестируйте на разных устройствах');

} catch (error) {
  console.error('❌ Ошибка при создании файлов:', error.message);
  process.exit(1);
} 