import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/api-utils/auth';
import { isValidUUID, createErrorResponse } from '@/lib/api-utils/validation';

/**
 * DELETE /api/user/api-keys/[id]
 * Delete a specific API key
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const { user, errorResponse } = await authenticate(req);
    if (errorResponse) return errorResponse;
    
    const { id: keyId } = await params;
    
    // Validate UUID format
    if (!isValidUUID(keyId)) {
      return createErrorResponse('Invalid API key ID format', 400);
    }
    
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
      
      // Find the key metadata by ID
      const currentMetadata = currentUser.api_key_metadata as Record<string, any>[] || [];
      const keyMetadataIndex = currentMetadata.findIndex(meta => meta.id === keyId);
      
      if (keyMetadataIndex === -1) {
        return createErrorResponse('API key not found', 404);
      }
      
      // Get the key preview to find the actual key
      const keyPreview = currentMetadata[keyMetadataIndex].key_preview;
      
      // Find and remove the actual API key
      const currentApiKeys = currentUser.api_keys as string[] || [];
      const apiKeyIndex = currentApiKeys.findIndex(key => key.endsWith(keyPreview));
      
      if (apiKeyIndex === -1) {
        // This shouldn't happen if data is consistent, but handle it anyway
        console.error('API key not found in user.api_keys array');
      }
      
      // Remove the key and its metadata
      const updatedApiKeys = [...currentApiKeys];
      if (apiKeyIndex !== -1) {
        updatedApiKeys.splice(apiKeyIndex, 1);
      }
      
      const updatedMetadata = [
        ...currentMetadata.slice(0, keyMetadataIndex),
        ...currentMetadata.slice(keyMetadataIndex + 1)
      ];
      
      // Update the user record
      await prisma.user.update({
        where: { id: user!.id },
        data: {
          api_keys: updatedApiKeys,
          api_key_metadata: updatedMetadata
        }
      });
      
      return NextResponse.json(
        { message: 'API key deleted successfully' },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('Database error deleting API key:', dbError);
      return createErrorResponse(
        'Failed to delete API key', 
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
 * OPTIONS /api/user/api-keys/[id]
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
