import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { User } from '@supabase/supabase-js'

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AuthenticatedUser {
  id: string
  email: string
  user_metadata?: any
  app_metadata?: any
}

export interface AuthResult {
  user: AuthenticatedUser | null
  error: string | null
}

/**
 * Standardized authentication function for all API routes
 * Extracts and validates JWT token from Authorization header
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthResult> {
  try {
    // Extract Authorization header
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader) {
      return {
        user: null,
        error: 'Missing authorization header'
      }
    }

    if (!authHeader.startsWith('Bearer ')) {
      return {
        user: null,
        error: 'Invalid authorization header format. Expected: Bearer <token>'
      }
    }

    const token = authHeader.substring(7)
    
    if (!token || token.length < 10) {
      return {
        user: null,
        error: 'Invalid or missing JWT token'
      }
    }

    // Validate token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError) {
      console.error('🔐 Auth validation error:', authError.message)
      return {
        user: null,
        error: `Authentication failed: ${authError.message}`
      }
    }

    if (!user) {
      return {
        user: null,
        error: 'Invalid token: no user found'
      }
    }

    // Return standardized user object
    return {
      user: {
        id: user.id,
        email: user.email || '',
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata
      },
      error: null
    }

  } catch (error) {
    console.error('🔐 Authentication exception:', error)
    return {
      user: null,
      error: 'Internal authentication error'
    }
  }
}

/**
 * Helper function to create standardized error responses
 */
export function createAuthErrorResponse(error: string, status: number = 401): NextResponse {
  return NextResponse.json(
    { 
      error: 'Authentication failed',
      message: error,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

/**
 * Middleware wrapper for API routes that require authentication
 * Usage: export const GET = withAuth(async (req, { user }) => { ... })
 */
export function withAuth<T extends any[]>(
  handler: (req: NextRequest, context: { user: AuthenticatedUser }, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const { user, error } = await authenticateRequest(req)
    
    if (error || !user) {
      return createAuthErrorResponse(error || 'Authentication required')
    }

    return handler(req, { user }, ...args)
  }
}

/**
 * Optional auth wrapper - continues even if auth fails, but provides user if available
 * Usage: export const GET = withOptionalAuth(async (req, { user }) => { ... })
 */
export function withOptionalAuth<T extends any[]>(
  handler: (req: NextRequest, context: { user: AuthenticatedUser | null }, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const { user } = await authenticateRequest(req)
    return handler(req, { user }, ...args)
  }
} 