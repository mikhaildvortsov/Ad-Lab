interface RateLimitConfig {
  windowMs: number; // Временное окно в миллисекундах
  maxRequests: number; // Максимальное количество запросов
  maxTokens?: number; // Максимальное количество токенов
  keyGenerator?: (req: any) => string; // Генератор ключей для идентификации пользователей
}

interface RateLimitEntry {
  count: number;
  tokens: number;
  resetTime: number;
  lastRequest: number;
}

class InMemoryRateLimiter {
  private cache = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Очистка устаревших записей каждую минуту
    setInterval(() => this.cleanup(), 60000);
  }

  async checkLimit(identifier: string, tokenCount = 1000): Promise<{ allowed: boolean; resetTime: number; remaining: number }> {
    const now = Date.now();
    const key = identifier;
    let entry = this.cache.get(key);

    // Создаем новую запись или сбрасываем если окно истекло
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        tokens: 0,
        resetTime: now + this.config.windowMs,
        lastRequest: now
      };
    }

    // Проверяем лимиты
    const requestLimitExceeded = entry.count >= this.config.maxRequests;
    const tokenLimitExceeded = this.config.maxTokens && (entry.tokens + tokenCount) > this.config.maxTokens;

    if (requestLimitExceeded || tokenLimitExceeded) {
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: Math.max(0, this.config.maxRequests - entry.count)
      };
    }

    // Обновляем счетчики
    entry.count++;
    entry.tokens += tokenCount;
    entry.lastRequest = now;
    this.cache.set(key, entry);

    // Логирование для мониторинга (только в dev режиме)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Rate Limiter] ${identifier.slice(0, 20)}... - ${entry.count}/${this.config.maxRequests} requests, ${entry.tokens}/${this.config.maxTokens} tokens`);
    }

    return {
      allowed: true,
      resetTime: entry.resetTime,
      remaining: this.config.maxRequests - entry.count
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now >= entry.resetTime + this.config.windowMs) {
        this.cache.delete(key);
      }
    }
  }
}

// Безопасная функция для парсинга env variables
function parseIntSafe(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || parsed <= 0 ? defaultValue : parsed;
}

// Конфигурации для разных типов лимитов (с поддержкой env variables)
export const RATE_LIMIT_CONFIGS = {
  chatGPT: {
    windowMs: 60 * 1000, // 1 минута
    maxRequests: parseIntSafe(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE, 20),
    maxTokens: parseIntSafe(process.env.RATE_LIMIT_TOKENS_PER_MINUTE, 50000),
  },
  chatGPTHourly: {
    windowMs: 60 * 60 * 1000, // 1 час
    maxRequests: parseIntSafe(process.env.RATE_LIMIT_REQUESTS_PER_HOUR, 100),
    maxTokens: parseIntSafe(process.env.RATE_LIMIT_TOKENS_PER_HOUR, 200000),
  },
  premium: {
    windowMs: 60 * 1000, // 1 минута
    maxRequests: parseIntSafe(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE, 50),
    maxTokens: parseIntSafe(process.env.RATE_LIMIT_TOKENS_PER_MINUTE, 100000),
  }
};

// Единственный экземпляр rate limiter для ChatGPT
export const chatGPTLimiter = new InMemoryRateLimiter(RATE_LIMIT_CONFIGS.chatGPT);
export const chatGPTHourlyLimiter = new InMemoryRateLimiter(RATE_LIMIT_CONFIGS.chatGPTHourly);

// Утилитарная функция для получения идентификатора пользователя
export function getUserIdentifier(request: any, userId?: string): string {
  // Приоритет: authenticated user ID > IP адрес + user agent
  if (userId) {
    return `user-${userId}`; // Точная идентификация авторизованного пользователя
  }
  
  // Fallback для неавторизованных пользователей
  const userAgent = request.headers.get('user-agent') || '';
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  
  return `anon-${ip}-${userAgent.slice(0, 30)}`;
}

// Основная функция для проверки rate limit
export async function checkRateLimit(
  request: any, 
  estimatedTokens = 1000,
  config: 'chatGPT' | 'premium' = 'chatGPT',
  userId?: string
): Promise<{ allowed: boolean; resetTime: number; remaining: number; error?: string }> {
  const identifier = getUserIdentifier(request, userId);
  
  // Проверяем оба лимита (минутный и часовой)
  const [minuteCheck, hourlyCheck] = await Promise.all([
    chatGPTLimiter.checkLimit(identifier, estimatedTokens),
    chatGPTHourlyLimiter.checkLimit(identifier, estimatedTokens)
  ]);

  if (!minuteCheck.allowed) {
    return {
      allowed: false,
      resetTime: minuteCheck.resetTime,
      remaining: minuteCheck.remaining,
      error: 'Превышен лимит запросов в минуту. Попробуйте через ' + Math.ceil((minuteCheck.resetTime - Date.now()) / 1000) + ' сек.'
    };
  }

  if (!hourlyCheck.allowed) {
    return {
      allowed: false,
      resetTime: hourlyCheck.resetTime,
      remaining: hourlyCheck.remaining,
      error: 'Превышен часовой лимит. Попробуйте через ' + Math.ceil((hourlyCheck.resetTime - Date.now()) / 60000) + ' мин.'
    };
  }

  return {
    allowed: true,
    resetTime: Math.min(minuteCheck.resetTime, hourlyCheck.resetTime),
    remaining: Math.min(minuteCheck.remaining, hourlyCheck.remaining)
  };
} 