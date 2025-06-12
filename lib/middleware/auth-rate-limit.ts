import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiting for auth endpoints
// In production, you'd use Redis or a proper rate limiting service
const authAttempts = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  blockDurationMs: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5, // 5 attempts
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000, // 30 minutes block
}

export function createAuthRateLimit(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  return function authRateLimit(req: NextRequest): NextResponse | null {
    // Get client identifier (IP + User-Agent for better uniqueness)
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const clientId = `${clientIP}:${userAgent.slice(0, 50)}`

    const now = Date.now()
    const clientData = authAttempts.get(clientId)

    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      for (const [key, data] of authAttempts.entries()) {
        if (now > data.resetTime) {
          authAttempts.delete(key)
        }
      }
    }

    // Check if client is currently blocked
    if (clientData && now < clientData.resetTime && clientData.count >= finalConfig.maxAttempts) {
      const remainingTime = Math.ceil((clientData.resetTime - now) / 1000 / 60)
      
      return NextResponse.json(
        { 
          error: 'Too many authentication attempts',
          message: `Please try again in ${remainingTime} minutes`,
          retryAfter: remainingTime * 60
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(remainingTime * 60),
            'X-RateLimit-Limit': String(finalConfig.maxAttempts),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(clientData.resetTime / 1000))
          }
        }
      )
    }

    // Initialize or update attempt count
    if (!clientData || now > clientData.resetTime) {
      // Reset window
      authAttempts.set(clientId, {
        count: 1,
        resetTime: now + finalConfig.windowMs
      })
    } else {
      // Increment count
      clientData.count++
      if (clientData.count >= finalConfig.maxAttempts) {
        // Block for longer duration
        clientData.resetTime = now + finalConfig.blockDurationMs
      }
    }

    // Add rate limit headers to response
    const remaining = Math.max(0, finalConfig.maxAttempts - (clientData?.count || 1))
    const resetTime = clientData?.resetTime || (now + finalConfig.windowMs)

    // Return null to continue processing, but we'll add headers in the calling function
    return null
  }
}

// Export default rate limiter for auth endpoints
export const authRateLimit = createAuthRateLimit()

// Helper to add rate limit headers to any response
export function addRateLimitHeaders(
  response: NextResponse, 
  config: RateLimitConfig = DEFAULT_CONFIG,
  remaining: number = config.maxAttempts,
  resetTime: number = Date.now() + config.windowMs
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(config.maxAttempts))
  response.headers.set('X-RateLimit-Remaining', String(remaining))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)))
  return response
} 