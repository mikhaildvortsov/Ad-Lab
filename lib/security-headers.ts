import { NextResponse } from 'next/server';

const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", 
    "'unsafe-eval'", 
    'https://vercel.live',
    'https://cdn.vercel-insights.com',
    'https://va.vercel-scripts.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", 
    'https://fonts.googleapis.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:' 
  ],
  'img-src': [
    "'self'",
    'data:', 
    'blob:', 
    'https://lh3.googleusercontent.com',
    'https://vercel.com'
  ],
  'connect-src': [
    "'self'",
    'https://api.openai.com',
    'https://accounts.google.com',
    'https://oauth2.googleapis.com',
    'https://www.googleapis.com',
    process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).origin : '', 
  ].filter(Boolean),
  'frame-src': [
    'https://accounts.google.com'
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"], 
  'block-all-mixed-content': [], 
  'upgrade-insecure-requests': [] 
};

function generateCSPHeader(): string {
  const directives = Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive;
      }
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
  return directives;
}

export const SECURITY_HEADERS = {
  'Content-Security-Policy': generateCSPHeader(),
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()'
  ].join(', '),
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function getDevelopmentCSP(): string {
  const devDirectives = {
    ...CSP_DIRECTIVES,
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'", 
      'https://vercel.live',
      'https://cdn.vercel-insights.com',
      'https://va.vercel-scripts.com'
    ],
    'connect-src': [
      "'self'",
      'ws://localhost:*',
      'wss://localhost:*',
      'http://localhost:*',
      'https://api.openai.com',
      'https://accounts.google.com',
      'https://oauth2.googleapis.com',
      'https://www.googleapis.com'
    ]
  };
  
  return Object.entries(devDirectives)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive;
      }
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
}

export function applyEnvironmentHeaders(response: NextResponse): NextResponse {
  const headers = { ...SECURITY_HEADERS };
  
  if (process.env.NODE_ENV === 'development') {
    headers['Content-Security-Policy'] = getDevelopmentCSP();
  }
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}
