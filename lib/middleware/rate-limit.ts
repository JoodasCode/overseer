/**
 * Rate Limiting Middleware
 * 
 * Provides rate limiting for API endpoints using Redis for distributed tracking.
 * Supports different rate limits for different endpoints and user types.
 */

import { NextRequest, NextResponse } from 'next/server';
import { redisService } from '@/lib/redis/redis-service';

// Rate limit configurations
export const RATE_LIMITS = {
  // General API endpoints
  DEFAULT: { requests: 100, windowSeconds: 60 }, // 100 requests per minute
  
  // Authentication endpoints
  AUTH_LOGIN: { requests: 5, windowSeconds: 60 }, // 5 login attempts per minute
  AUTH_SIGNUP: { requests: 3, windowSeconds: 60 }, // 3 signup attempts per minute
  AUTH_RESET: { requests: 3, windowSeconds: 300 }, // 3 password resets per 5 minutes
  
  // Agent operations
  AGENT_CREATE: { requests: 10, windowSeconds: 60 }, // 10 agents per minute
  AGENT_UPDATE: { requests: 30, windowSeconds: 60 }, // 30 updates per minute
  AGENT_CHAT: { requests: 50, windowSeconds: 60 }, // 50 chat messages per minute
  
  // File uploads
  FILE_UPLOAD: { requests: 20, windowSeconds: 60 }, // 20 file uploads per minute
  
  // Knowledge base operations
  KNOWLEDGE_QUERY: { requests: 100, windowSeconds: 60 }, // 100 queries per minute
  KNOWLEDGE_UPLOAD: { requests: 10, windowSeconds: 60 }, // 10 uploads per minute
  
  // Plugin API calls
  PLUGIN_EXECUTE: { requests: 200, windowSeconds: 60 }, // 200 plugin calls per minute
} as const;

export interface RateLimitOptions {
  keyGenerator?: (req: NextRequest) => string;
  limit?: { requests: number; windowSeconds: number };
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  statusCode?: number;
}

/**
 * Create a rate limiting middleware
 */
export function createRateLimit(options: RateLimitOptions = {}) {
  const {
    keyGenerator = defaultKeyGenerator,
    limit = RATE_LIMITS.DEFAULT,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Too many requests, please try again later.',
    statusCode = 429,
  } = options;

  return async function rateLimitMiddleware(
    req: NextRequest,
    res?: NextResponse
  ): Promise<NextResponse | null> {
    try {
      // Generate unique key for this client/endpoint
      const key = keyGenerator(req);
      
      // Check rate limit
      const result = await redisService.checkRateLimit(
        key,
        getEndpointAction(req),
        limit.requests,
        limit.windowSeconds
      );

      // Add rate limit headers
      const headers = new Headers();
      headers.set('X-RateLimit-Limit', limit.requests.toString());
      headers.set('X-RateLimit-Remaining', result.remaining.toString());
      headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
      
      if (!result.allowed) {
        // Rate limit exceeded
        await redisService.storeMetric('rate_limit_exceeded', 1, {
          endpoint: getEndpointAction(req),
          key: key.substring(0, 20) + '...', // Truncate for privacy
        });
        
        return new NextResponse(
          JSON.stringify({
            error: message,
            rateLimitExceeded: true,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          }),
          {
            status: statusCode,
            headers: {
              'Content-Type': 'application/json',
              ...Object.fromEntries(headers.entries()),
            },
          }
        );
      }

      // Rate limit passed - track metrics
      await redisService.storeMetric('api_request', 1, {
        endpoint: getEndpointAction(req),
        allowed: 'true',
      });

      // If we have a response object, add headers to it
      if (res) {
        headers.forEach((value, key) => {
          res.headers.set(key, value);
        });
      }

      return null; // Allow request to continue
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow the request (fail open)
      return null;
    }
  };
}

/**
 * Default key generator - uses IP address and user ID if available
 */
function defaultKeyGenerator(req: NextRequest): string {
  // Try to get user ID from request (if authenticated)
  const authHeader = req.headers.get('authorization');
  let userId = 'anonymous';
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // In a real implementation, you'd decode the JWT token here
    // For now, we'll use a hash of the token
    userId = redisService.generateHash(authHeader);
  }
  
  // Get IP address
  const ip = getClientIP(req);
  
  // Combine for unique key
  return `${ip}:${userId}`;
}

/**
 * Get client IP address from request
 */
function getClientIP(req: NextRequest): string {
  // Check various headers for IP address
  const xForwardedFor = req.headers.get('x-forwarded-for');
  const xRealIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  if (xRealIP) {
    return xRealIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback - this won't work in production but useful for development
  return 'unknown';
}

/**
 * Get endpoint action for rate limiting
 */
function getEndpointAction(req: NextRequest): string {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method;
  
  // Normalize common endpoints
  if (pathname.startsWith('/api/auth/')) {
    if (pathname.includes('login')) return 'auth_login';
    if (pathname.includes('signup')) return 'auth_signup';
    if (pathname.includes('reset')) return 'auth_reset';
    return 'auth_other';
  }
  
  if (pathname.startsWith('/api/agents')) {
    if (method === 'POST') return 'agent_create';
    if (method === 'PUT' || method === 'PATCH') return 'agent_update';
    if (pathname.includes('chat')) return 'agent_chat';
    return 'agent_other';
  }
  
  if (pathname.startsWith('/api/files') || pathname.includes('upload')) {
    return 'file_upload';
  }
  
  if (pathname.startsWith('/api/knowledge-base')) {
    if (method === 'POST') return 'knowledge_upload';
    return 'knowledge_query';
  }
  
  if (pathname.startsWith('/api/plugin-engine')) {
    return 'plugin_execute';
  }
  
  // Default action
  return `${method.toLowerCase()}_${pathname.replace(/\//g, '_')}`;
}

/**
 * Predefined rate limiters for common endpoints
 */
export const rateLimiters = {
  // Authentication endpoints
  auth: createRateLimit({
    limit: RATE_LIMITS.AUTH_LOGIN,
    message: 'Too many authentication attempts, please try again later.',
  }),
  
  authSignup: createRateLimit({
    limit: RATE_LIMITS.AUTH_SIGNUP,
    message: 'Too many signup attempts, please try again later.',
  }),
  
  authReset: createRateLimit({
    limit: RATE_LIMITS.AUTH_RESET,
    message: 'Too many password reset attempts, please try again later.',
  }),
  
  // Agent operations
  agentCreate: createRateLimit({
    limit: RATE_LIMITS.AGENT_CREATE,
    message: 'Too many agents created, please slow down.',
  }),
  
  agentChat: createRateLimit({
    limit: RATE_LIMITS.AGENT_CHAT,
    message: 'Too many chat messages, please slow down.',
  }),
  
  // File operations
  fileUpload: createRateLimit({
    limit: RATE_LIMITS.FILE_UPLOAD,
    message: 'Too many file uploads, please slow down.',
  }),
  
  // Knowledge base
  knowledgeQuery: createRateLimit({
    limit: RATE_LIMITS.KNOWLEDGE_QUERY,
    message: 'Too many knowledge base queries, please slow down.',
  }),
  
  // Plugin execution
  pluginExecute: createRateLimit({
    limit: RATE_LIMITS.PLUGIN_EXECUTE,
    message: 'Too many plugin executions, please slow down.',
  }),
  
  // Default rate limiter
  default: createRateLimit({
    limit: RATE_LIMITS.DEFAULT,
    message: 'Too many requests, please try again later.',
  }),
};

/**
 * Middleware helper to apply rate limiting to API routes
 */
export async function withRateLimit(
  req: NextRequest,
  rateLimiter: ReturnType<typeof createRateLimit>
): Promise<NextResponse | null> {
  return await rateLimiter(req);
}

/**
 * User-specific rate limiter
 */
export function createUserRateLimit(userId: string, options: RateLimitOptions = {}) {
  return createRateLimit({
    ...options,
    keyGenerator: () => `user:${userId}`,
  });
}

/**
 * IP-based rate limiter
 */
export function createIPRateLimit(options: RateLimitOptions = {}) {
  return createRateLimit({
    ...options,
    keyGenerator: (req) => `ip:${getClientIP(req)}`,
  });
} 