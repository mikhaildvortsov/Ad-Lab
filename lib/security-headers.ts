import { NextResponse } from 'next/server';
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", 
    "'unsafe-eval'", 
    'https:
    'https:
    'https:
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", 
    'https:
  ],
  'font-src': [
    "'self'",
    'https:
    'data:' 
  ],
  'img-src': [
    "'self'",
    'data:', 
    'blob:', 
    'https:
    'https:
  ],
  'connect-src': [
    "'self'",
    'https:
    'https:
    'https:
    'https:
    process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).origin : '', 
  ].filter(Boolean),
  'frame-src': [
    'https:
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
      'https:
      'https:
      'https:
    ],
    'connect-src': [
      "'self'",
      'ws:
      'wss:
      'http:
      'https:
      'https:
      'https:
      'https:
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
