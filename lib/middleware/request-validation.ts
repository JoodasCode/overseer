import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Common validation schemas
export const schemas = {
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  uuid: z.string().uuid('Invalid UUID format'),
  text: z.string().max(1000, 'Text too long'),
  longText: z.string().max(10000, 'Text too long'),
  url: z.string().url('Invalid URL format').max(2048),
  positiveInt: z.number().int().positive('Must be a positive integer'),
  nonNegativeInt: z.number().int().min(0, 'Must be non-negative'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format').max(100),
  
  // API-specific schemas
  auth: {
    signIn: z.object({
      email: z.string().email().max(255),
      password: z.string().min(1).max(128)
    }),
    signUp: z.object({
      email: z.string().email().max(255),
      password: z.string().min(8).max(128)
    }),
    resetPassword: z.object({
      email: z.string().email().max(255)
    })
  },
  
  chat: {
    message: z.object({
      content: z.string().min(1).max(10000),
      agentId: z.string().uuid().optional(),
      conversationId: z.string().uuid().optional()
    })
  },
  
  agents: {
    create: z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      personality: z.string().max(1000).optional(),
      instructions: z.string().max(5000).optional()
    }),
    update: z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      personality: z.string().max(1000).optional(),
      instructions: z.string().max(5000).optional()
    })
  }
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult<T = any> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

/**
 * Validate request body against a Zod schema
 */
export async function validateRequestBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    // Check content type
    const contentType = req.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return {
        success: false,
        errors: [{
          field: 'content-type',
          message: 'Content-Type must be application/json',
          code: 'INVALID_CONTENT_TYPE'
        }]
      }
    }

    // Parse JSON body
    let body: any
    try {
      body = await req.json()
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'body',
          message: 'Invalid JSON format',
          code: 'INVALID_JSON'
        }]
      }
    }

    // Validate against schema
    const result = schema.safeParse(body)
    
    if (!result.success) {
      const errors: ValidationError[] = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      
      return {
        success: false,
        errors
      }
    }

    return {
      success: true,
      data: result.data
    }
    
  } catch (error) {
    console.error('Validation error:', error)
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'Internal validation error',
        code: 'INTERNAL_ERROR'
      }]
    }
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQueryParams<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    const { searchParams } = new URL(req.url)
    const params: Record<string, any> = {}
    
    // Convert URLSearchParams to object
    for (const [key, value] of searchParams.entries()) {
      // Handle arrays (multiple values with same key)
      if (params[key]) {
        if (Array.isArray(params[key])) {
          params[key].push(value)
        } else {
          params[key] = [params[key], value]
        }
      } else {
        params[key] = value
      }
    }

    const result = schema.safeParse(params)
    
    if (!result.success) {
      const errors: ValidationError[] = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      
      return {
        success: false,
        errors
      }
    }

    return {
      success: true,
      data: result.data
    }
    
  } catch (error) {
    console.error('Query validation error:', error)
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'Internal validation error',
        code: 'INTERNAL_ERROR'
      }]
    }
  }
}

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(errors: ValidationError[]): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: errors
    },
    { status: 400 }
  )
}

/**
 * Higher-order function to wrap API routes with validation
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Validate request body
    const validation = await validateRequestBody(req, schema)
    
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors!)
    }

    // Call the actual handler with validated data
    return handler(req, validation.data!)
  }
}

/**
 * Middleware to validate common request patterns
 */
export function createValidationMiddleware(options: {
  maxBodySize?: number
  allowedMethods?: string[]
  requireAuth?: boolean
}) {
  const { maxBodySize = 1024 * 1024, allowedMethods, requireAuth = false } = options

  return async (req: NextRequest): Promise<NextResponse | null> => {
    // Check method
    if (allowedMethods && !allowedMethods.includes(req.method)) {
      return NextResponse.json(
        { error: `Method ${req.method} not allowed` },
        { status: 405 }
      )
    }

    // Check content length
    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > maxBodySize) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      )
    }

    // Check for required headers
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const contentType = req.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        return NextResponse.json(
          { error: 'Content-Type must be application/json' },
          { status: 400 }
        )
      }
    }

    // Auth check (if required)
    if (requireAuth) {
      const authHeader = req.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Authorization header required' },
          { status: 401 }
        )
      }
    }

    return null // Continue to next middleware/handler
  }
} 