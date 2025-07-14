import { NextResponse } from 'next/server';

// Content Security Policy configuration
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Needed for Next.js in development
    "'unsafe-eval'", // Needed for development hot reload
    'https://apis.google.com',
    'https://accounts.google.com',
    'https://vercel.live' // For Vercel analytics
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Needed for styled-components and CSS-in-JS
    'https://fonts.googleapis.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:' // For base64 encoded fonts
  ],
  'img-src': [
    "'self'",
    'data:', // For base64 images
    'blob:', // For uploaded images
    'https://*.googleusercontent.com', // For Google profile images
    'https://vercel.com' // For Vercel assets
  ],
  'connect-src': [
    "'self'",
    'https://api.openai.com', // For ChatGPT API
    'https://oauth2.googleapis.com', // For Google OAuth
    'https://accounts.google.com', // For Google Auth
    'https://vercel.live', // For Vercel analytics
    process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).origin : '', // Database connection
  ].filter(Boolean),
  'frame-src': [
    'https://accounts.google.com', // For Google OAuth frames
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"], // Prevent clickjacking
  'block-all-mixed-content': [], // Block mixed HTTP/HTTPS content
  'upgrade-insecure-requests': [] // Upgrade HTTP to HTTPS
};

// Generate CSP header value
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

// Security headers configuration
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': generateCSPHeader(),
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy (Feature Policy)
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
  
  // Cross-Origin policies
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

// Apply security headers to response
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// Get development-friendly CSP (less restrictive for development)
export function getDevelopmentCSP(): string {
  const devDirectives = {
    ...CSP_DIRECTIVES,
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'", // Required for development
      'https://apis.google.com',
      'https://accounts.google.com',
      'https://vercel.live'
    ],
    'connect-src': [
      "'self'",
      'ws://localhost:3000', // For Next.js hot reload
      'wss://localhost:3000',
      'http://localhost:3000',
      'https://api.openai.com',
      'https://oauth2.googleapis.com',
      'https://accounts.google.com',
      'https://vercel.live'
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

// Apply appropriate headers based on environment
export function applyEnvironmentHeaders(response: NextResponse): NextResponse {
  const headers = { ...SECURITY_HEADERS };
  
  // Use less restrictive CSP in development
  if (process.env.NODE_ENV === 'development') {
    headers['Content-Security-Policy'] = getDevelopmentCSP();
  }
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
} 