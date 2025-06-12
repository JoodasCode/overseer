import { NextRequest, NextResponse } from 'next/server'

interface CORSConfig {
  allowedOrigins: string[]
  allowedMethods: string[]
  allowedHeaders: string[]
  exposedHeaders: string[]
  credentials: boolean
  maxAge: number
  preflightContinue: boolean
}

// Environment-specific CORS configurations
const corsConfigs: Record<string, CORSConfig> = {
  development: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-CSRF-Token',
      'X-Request-ID'
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset'
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false
  },
  
  production: {
    allowedOrigins: [
      process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com',
      // Add your production domains here
    ].filter(Boolean),
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-CSRF-Token'
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-Rate-Limit-Remaining'
    ],
    credentials: true,
    maxAge: 3600, // 1 hour
    preflightContinue: false
  },
  
  staging: {
    allowedOrigins: [
      process.env.NEXT_PUBLIC_APP_URL || 'https://staging.your-domain.com',
      'https://preview.your-domain.com'
    ].filter(Boolean),
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-CSRF-Token'
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-Rate-Limit-Remaining'
    ],
    credentials: true,
    maxAge: 3600,
    preflightContinue: false
  }
}

/**
 * Get CORS configuration for current environment
 */
function getCORSConfig(): CORSConfig {
  const env = process.env.NODE_ENV || 'development'
  const config = corsConfigs[env] || corsConfigs.development
  
  // Validate configuration
  if (!config.allowedOrigins.length) {
    console.warn('⚠️ No allowed origins configured for CORS')
  }
  
  return config
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false
  
  // Exact match
  if (allowedOrigins.includes(origin)) return true
  
  // Pattern matching for development (localhost with any port)
  if (process.env.NODE_ENV === 'development') {
    const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
    if (localhostPattern.test(origin)) return true
  }
  
  return false
}

/**
 * Apply CORS headers to response
 */
export function applyCORSHeaders(
  req: NextRequest, 
  response: NextResponse,
  config?: Partial<CORSConfig>
): NextResponse {
  const corsConfig = { ...getCORSConfig(), ...config }
  const origin = req.headers.get('origin')
  const requestMethod = req.headers.get('access-control-request-method')
  const requestHeaders = req.headers.get('access-control-request-headers')

  // Check if origin is allowed
  if (origin && isOriginAllowed(origin, corsConfig.allowedOrigins)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else if (corsConfig.allowedOrigins.includes('*')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
  }

  // Set credentials
  if (corsConfig.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Set allowed methods
  response.headers.set(
    'Access-Control-Allow-Methods',
    corsConfig.allowedMethods.join(', ')
  )

  // Set allowed headers
  if (requestHeaders) {
    // For preflight requests, echo back the requested headers if they're allowed
    const requestedHeaders = requestHeaders.split(',').map(h => h.trim())
    const allowedRequestHeaders = requestedHeaders.filter(header =>
      corsConfig.allowedHeaders.some(allowed =>
        allowed.toLowerCase() === header.toLowerCase()
      )
    )
    
    if (allowedRequestHeaders.length > 0) {
      response.headers.set(
        'Access-Control-Allow-Headers',
        allowedRequestHeaders.join(', ')
      )
    }
  } else {
    response.headers.set(
      'Access-Control-Allow-Headers',
      corsConfig.allowedHeaders.join(', ')
    )
  }

  // Set exposed headers
  if (corsConfig.exposedHeaders.length > 0) {
    response.headers.set(
      'Access-Control-Expose-Headers',
      corsConfig.exposedHeaders.join(', ')
    )
  }

  // Set max age for preflight cache
  response.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString())

  return response
}

/**
 * Handle preflight OPTIONS requests
 */
export function handlePreflightRequest(req: NextRequest): NextResponse | null {
  if (req.method !== 'OPTIONS') return null

  const config = getCORSConfig()
  const origin = req.headers.get('origin')
  const requestMethod = req.headers.get('access-control-request-method')

  // Check if this is a valid preflight request
  if (!origin || !requestMethod) return null

  // Check if origin is allowed
  if (!isOriginAllowed(origin, config.allowedOrigins)) {
    return new NextResponse(null, { 
      status: 403,
      statusText: 'CORS: Origin not allowed'
    })
  }

  // Check if method is allowed
  if (!config.allowedMethods.includes(requestMethod)) {
    return new NextResponse(null, { 
      status: 405,
      statusText: 'CORS: Method not allowed'
    })
  }

  // Create preflight response
  const response = new NextResponse(null, { status: 204 })
  return applyCORSHeaders(req, response, config)
}

/**
 * Middleware wrapper for CORS
 */
export function withCORS(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  config?: Partial<CORSConfig>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Handle preflight requests
    const preflightResponse = handlePreflightRequest(req)
    if (preflightResponse) return preflightResponse

    // Execute the handler
    const response = await handler(req)

    // Apply CORS headers to the response
    return applyCORSHeaders(req, response, config)
  }
}

/**
 * Security headers middleware
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy (basic)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust as needed
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.supabase.co wss://realtime.supabase.co",
    "frame-ancestors 'none'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  // Strict Transport Security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  return response
}

/**
 * Complete security middleware
 */
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  options: {
    cors?: Partial<CORSConfig>
    skipCORS?: boolean
    skipSecurityHeaders?: boolean
  } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    let response: NextResponse

    if (!options.skipCORS) {
      // Apply CORS
      const corsHandler = withCORS(handler, options.cors)
      response = await corsHandler(req)
    } else {
      response = await handler(req)
    }

    if (!options.skipSecurityHeaders) {
      // Apply security headers
      response = addSecurityHeaders(response)
    }

    return response
  }
} 