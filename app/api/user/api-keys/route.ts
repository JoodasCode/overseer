import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate, UserRole, authorizeRole } from '@/lib/api-utils/auth';
import { validateRequiredFields, createErrorResponse } from '@/lib/api-utils/validation';
import { randomUUID } from 'crypto';

/**
 * API key format: osk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
 * Where 'osk' stands for 'Overseer API Key'
 */
function generateApiKey(): string {
  const prefix = 'osk_';
  const randomPart = randomUUID().replace(/-/g, '').substring(0, 32);
  return `${prefix}${randomPart}`;
}

/**
 * GET /api/user/api-keys
 * List all API keys for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const { user, errorResponse } = await authenticate(req);
    if (errorResponse) return errorResponse;
    
    try {
      // Get user's API keys
      const userProfile = await prisma.user.findUnique({
        where: {
          id: user!.id
        },
        select: {
          api_keys: true,
          api_key_metadata: true
        }
      });
      
      if (!userProfile) {
        return createErrorResponse('User profile not found', 404);
      }
      
      // Format API keys for response
      // Don't return the actual keys, just metadata
      const apiKeys = userProfile.api_key_metadata as Record<string, any>[] || [];
      
      return NextResponse.json({
        api_keys: apiKeys.map(meta => ({
          id: meta.id,
          name: meta.name,
          created_at: meta.created_at,
          last_used: meta.last_used || null,
          // Only show last 4 characters of the key
          key_preview: `osk_...${meta.key_preview || ''}`,
          scopes: meta.scopes || ['*']
        }))
      });
    } catch (dbError) {
      console.error('Database error fetching API keys:', dbError);
      return createErrorResponse(
        'Failed to fetch API keys', 
        500, 
        (dbError as Error).message
      );
    }
  } catch (error) {
    console.error('Error in API keys API:', error);
    return createErrorResponse(
      'Failed to process request', 
      500, 
      (error as Error).message
    );
  }
}

/**
 * POST /api/user/api-keys
 * Create a new API key
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { user, errorResponse } = await authenticate(req);
    if (errorResponse) return errorResponse;
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }
    
    // Validate required fields
    const { isValid, errorResponse: validationError } = validateRequiredFields(
      body, 
      ['name']
    );
    
    if (!isValid) return validationError;
    
    const { name, scopes = ['*'] } = body;
    
    try {
      // Get current user data
      const currentUser = await prisma.user.findUnique({
        where: { id: user!.id },
        select: { 
          api_keys: true,
          api_key_metadata: true
        }
      });
      
      if (!currentUser) {
        return createErrorResponse('User profile not found', 404);
      }
      
      // Generate a new API key
      const newApiKey = generateApiKey();
      const keyId = randomUUID();
      
      // Create metadata for the key
      const keyMetadata = {
        id: keyId,
        name,
        created_at: new Date().toISOString(),
        key_preview: newApiKey.slice(-4), // Store last 4 chars for display
        scopes
      };
      
      // Update user's API keys
      const currentApiKeys = currentUser.api_keys as string[] || [];
      const currentMetadata = currentUser.api_key_metadata as Record<string, any>[] || [];
      
      await prisma.user.update({
        where: { id: user!.id },
        data: {
          api_keys: [...currentApiKeys, newApiKey],
          api_key_metadata: [...currentMetadata, keyMetadata]
        }
      });
      
      // Return the new API key (this is the only time the full key is returned)
      return NextResponse.json({
        api_key: {
          id: keyId,
          key: newApiKey, // Full key is only returned once
          name,
          created_at: keyMetadata.created_at,
          scopes
        }
      }, { status: 201 });
    } catch (dbError) {
      console.error('Database error creating API key:', dbError);
      return createErrorResponse(
        'Failed to create API key', 
        500, 
        (dbError as Error).message
      );
    }
  } catch (error) {
    console.error('Error in API keys API:', error);
    return createErrorResponse(
      'Failed to process request', 
      500, 
      (error as Error).message
    );
  }
}

/**
 * OPTIONS /api/user/api-keys
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
