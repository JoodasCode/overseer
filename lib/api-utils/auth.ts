/**
 * Authentication utilities for API routes
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { prisma } from '@/lib/prisma';
import { createErrorResponse } from './validation';
import { ApiKeyScope, isExpired, hasScope, updateApiKeyUsage, isValidApiKeyFormat } from './api-key-manager';

/**
 * User role types
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  DEVELOPER = 'developer'
}

/**
 * User with role information
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  apiKeys?: string[];
  apiKeyId?: string; // ID of the API key used for authentication
  apiKeyScopes?: ApiKeyScope[]; // Scopes of the API key used
}

/**
 * Authenticates a request using Supabase auth
 * @param req The Next.js request object
 * @returns Object with authenticated user or error response
 */
export async function authenticateUser(req: NextRequest): Promise<{
  user?: AuthenticatedUser;
  errorResponse?: NextResponse;
}> {
  try {
    // Get user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        errorResponse: createErrorResponse(
          'Unauthorized', 
          401, 
          authError?.message
        )
      };
    }
    
    // Get additional user info from database
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        api_keys: true
      }
    });
    
    // Default to USER role if not found
    const role = userProfile?.role as UserRole || UserRole.USER;
    
    return {
      user: {
        id: user.id,
        email: user.email || '',
        role,
        apiKeys: userProfile?.api_keys as string[] || []
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      errorResponse: createErrorResponse(
        'Authentication failed', 
        500, 
        (error as Error).message
      )
    };
  }
}

/**
 * Authenticates a request using API key
 * @param req The Next.js request object
 * @param requiredScope Optional scope required for the operation
 * @returns Object with authenticated user or error response
 */
export async function authenticateApiKey(
  req: NextRequest,
  requiredScope?: ApiKeyScope
): Promise<{
  user?: AuthenticatedUser;
  errorResponse?: NextResponse;
}> {
  try {
    // Get API key from Authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        errorResponse: createErrorResponse(
          'API key required', 
          401
        )
      };
    }
    
    const apiKey = authHeader.replace('Bearer ', '');
    
    // Validate API key format
    if (!isValidApiKeyFormat(apiKey)) {
      return {
        errorResponse: createErrorResponse(
          'Invalid API key format', 
          401
        )
      };
    }
    
    // Find user with this API key
    const user = await prisma.user.findFirst({
      where: {
        api_keys: {
          has: apiKey
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        api_keys: true,
        api_key_metadata: true
      }
    });
    
    if (!user) {
      return {
        errorResponse: createErrorResponse(
          'Invalid API key', 
          401
        )
      };
    }
    
    // Find the metadata for this API key
    const keyPreview = apiKey.slice(-4);
    const metadata = (user.api_key_metadata as any[]) || [];
    const keyMetadata = metadata.find(meta => meta.key_preview === keyPreview);
    
    if (!keyMetadata) {
      return {
        errorResponse: createErrorResponse(
          'API key metadata not found', 
          401
        )
      };
    }
    
    // Check if the API key is expired
    if (keyMetadata.expires_at && isExpired(keyMetadata.expires_at)) {
      return {
        errorResponse: createErrorResponse(
          'API key has expired', 
          401
        )
      };
    }
    
    // Check if the API key has the required scope
    if (requiredScope && !hasScope(keyMetadata.scopes || [ApiKeyScope.ALL], requiredScope)) {
      return {
        errorResponse: createErrorResponse(
          'API key does not have the required permissions', 
          403,
          `Required scope: ${requiredScope}`
        )
      };
    }
    
    // Update last used timestamp (don't await to avoid blocking)
    updateApiKeyUsage(user.id, keyMetadata.id);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        apiKeys: user.api_keys as string[],
        apiKeyId: keyMetadata.id,
        apiKeyScopes: keyMetadata.scopes || [ApiKeyScope.ALL]
      }
    };
  } catch (error) {
    console.error('API key authentication error:', error);
    return {
      errorResponse: createErrorResponse(
        'Authentication failed', 
        500, 
        (error as Error).message
      )
    };
  }
}

/**
 * Checks if the user has the required role
 * @param user The authenticated user
 * @param requiredRole The minimum role required
 * @returns Object with authorization result and error response if unauthorized
 */
export function authorizeRole(user: AuthenticatedUser, requiredRole: UserRole): {
  isAuthorized: boolean;
  errorResponse?: NextResponse;
} {
  const roleHierarchy = {
    [UserRole.USER]: 1,
    [UserRole.DEVELOPER]: 2,
    [UserRole.ADMIN]: 3
  };
  
  if (roleHierarchy[user.role] >= roleHierarchy[requiredRole]) {
    return { isAuthorized: true };
  }
  
  return {
    isAuthorized: false,
    errorResponse: createErrorResponse(
      'Insufficient permissions', 
      403,
      `Required role: ${requiredRole}`
    )
  };
}

/**
 * Authenticates a request using either session or API key
 * @param req The Next.js request object
 * @param requiredScope Optional scope required for API key authentication
 * @returns Object with authenticated user or error response
 */
export async function authenticate(
  req: NextRequest,
  requiredScope?: ApiKeyScope
): Promise<{
  user?: AuthenticatedUser;
  errorResponse?: NextResponse;
}> {
  // Check for API key first
  if (req.headers.has('Authorization')) {
    return authenticateApiKey(req, requiredScope);
  }
  
  // Fall back to session auth
  return authenticateUser(req);
}
