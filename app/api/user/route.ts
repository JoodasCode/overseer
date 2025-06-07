import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate, UserRole, authorizeRole } from '@/lib/api-utils/auth';
import { createErrorResponse } from '@/lib/api-utils/validation';
import { randomUUID } from 'crypto';

/**
 * GET /api/user
 * Retrieve user profile and settings
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const { user, errorResponse } = await authenticate(req);
    if (errorResponse) return errorResponse;
    
    try {
      // Get user profile
      const userProfile = await prisma.user.findUnique({
        where: {
          id: user!.id
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          preferences: true,
          created_at: true,
          updated_at: true,
          // Don't include sensitive information like api_keys in the response
        }
      });
      
      if (!userProfile) {
        return createErrorResponse('User profile not found', 404);
      }
      
      // Get API key count but not the actual keys
      const apiKeyCount = (userProfile as any).api_keys?.length || 0;
      
      return NextResponse.json({
        user: {
          ...userProfile,
          api_key_count: apiKeyCount
        }
      });
    } catch (dbError) {
      console.error('Database error fetching user profile:', dbError);
      return createErrorResponse(
        'Failed to fetch user profile', 
        500, 
        (dbError as Error).message
      );
    }
  } catch (error) {
    console.error('Error in user API:', error);
    return createErrorResponse(
      'Failed to process request', 
      500, 
      (error as Error).message
    );
  }
}

/**
 * PATCH /api/user
 * Update user profile and settings
 */
export async function PATCH(req: NextRequest) {
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
    
    const { name, preferences } = body;
    
    // Ensure at least one field to update
    if (!name && !preferences) {
      return createErrorResponse('No fields to update provided', 400);
    }
    
    try {
      // Build update data
      const updateData: any = {};
      if (name) updateData.name = name;
      if (preferences) {
        // Get current preferences
        const currentUser = await prisma.user.findUnique({
          where: { id: user!.id },
          select: { preferences: true }
        });
        
        // Merge with new preferences
        updateData.preferences = {
          ...(currentUser?.preferences || {}),
          ...preferences
        };
      }
      
      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: user!.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          preferences: true,
          created_at: true,
          updated_at: true
        }
      });
      
      return NextResponse.json({ user: updatedUser });
    } catch (dbError) {
      console.error('Database error updating user profile:', dbError);
      return createErrorResponse(
        'Failed to update user profile', 
        500, 
        (dbError as Error).message
      );
    }
  } catch (error) {
    console.error('Error in user API:', error);
    return createErrorResponse(
      'Failed to process request', 
      500, 
      (error as Error).message
    );
  }
}

/**
 * OPTIONS /api/user
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
