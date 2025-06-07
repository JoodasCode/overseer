import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/api-utils/auth';
import { isValidUUID, createErrorResponse } from '@/lib/api-utils/validation';

/**
 * GET /api/knowledge-base/[id]
 * Retrieve a specific knowledge base entry
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const { user, errorResponse } = await authenticate(req);
    if (errorResponse) return errorResponse;
    
    const id = params.id;
    
    // Validate UUID format
    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid knowledge base entry ID format', 400);
    }
    
    try {
      // Get knowledge base entry
      const entry = await prisma.knowledgeBase.findUnique({
        where: {
          id,
          user_id: user!.id // Ensure user owns this entry
        }
      });
      
      if (!entry) {
        return createErrorResponse('Knowledge base entry not found', 404);
      }
      
      return NextResponse.json({ entry });
    } catch (dbError) {
      console.error('Database error fetching knowledge base entry:', dbError);
      return createErrorResponse(
        'Failed to fetch knowledge base entry', 
        500, 
        (dbError as Error).message
      );
    }
  } catch (error) {
    console.error('Error in knowledge base API:', error);
    return createErrorResponse(
      'Failed to process request', 
      500, 
      (error as Error).message
    );
  }
}

/**
 * PATCH /api/knowledge-base/[id]
 * Update a specific knowledge base entry
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const { user, errorResponse } = await authenticate(req);
    if (errorResponse) return errorResponse;
    
    const id = params.id;
    
    // Validate UUID format
    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid knowledge base entry ID format', 400);
    }
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }
    
    const { title, description, metadata } = body;
    
    // Ensure at least one field to update
    if (!title && !description && !metadata) {
      return createErrorResponse('No fields to update provided', 400);
    }
    
    try {
      // Check if entry exists and belongs to user
      const existingEntry = await prisma.knowledgeBase.findUnique({
        where: {
          id,
          user_id: user!.id // Ensure user owns this entry
        }
      });
      
      if (!existingEntry) {
        return createErrorResponse('Knowledge base entry not found', 404);
      }
      
      // Build update data
      const updateData: any = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (metadata) updateData.metadata = {
        ...existingEntry.metadata,
        ...metadata
      };
      
      // Update knowledge base entry
      const updatedEntry = await prisma.knowledgeBase.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          url: true,
          file_path: true,
          metadata: true,
          created_at: true,
          updated_at: true,
          // Don't include the actual content or embeddings in the response
        }
      });
      
      return NextResponse.json({ entry: updatedEntry });
    } catch (dbError) {
      console.error('Database error updating knowledge base entry:', dbError);
      return createErrorResponse(
        'Failed to update knowledge base entry', 
        500, 
        (dbError as Error).message
      );
    }
  } catch (error) {
    console.error('Error in knowledge base API:', error);
    return createErrorResponse(
      'Failed to process request', 
      500, 
      (error as Error).message
    );
  }
}

/**
 * DELETE /api/knowledge-base/[id]
 * Delete a specific knowledge base entry
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const { user, errorResponse } = await authenticate(req);
    if (errorResponse) return errorResponse;
    
    const id = params.id;
    
    // Validate UUID format
    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid knowledge base entry ID format', 400);
    }
    
    try {
      // Check if entry exists and belongs to user
      const existingEntry = await prisma.knowledgeBase.findUnique({
        where: {
          id,
          user_id: user!.id // Ensure user owns this entry
        }
      });
      
      if (!existingEntry) {
        return createErrorResponse('Knowledge base entry not found', 404);
      }
      
      // Delete knowledge base entry
      await prisma.knowledgeBase.delete({
        where: { id }
      });
      
      return NextResponse.json(
        { message: 'Knowledge base entry deleted successfully' },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('Database error deleting knowledge base entry:', dbError);
      return createErrorResponse(
        'Failed to delete knowledge base entry', 
        500, 
        (dbError as Error).message
      );
    }
  } catch (error) {
    console.error('Error in knowledge base API:', error);
    return createErrorResponse(
      'Failed to process request', 
      500, 
      (error as Error).message
    );
  }
}

/**
 * OPTIONS /api/knowledge-base/[id]
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
