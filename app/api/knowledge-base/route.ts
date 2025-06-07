import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate, UserRole, authorizeRole } from '@/lib/api-utils/auth';
import { validateRequiredFields, createErrorResponse } from '@/lib/api-utils/validation';

/**
 * GET /api/knowledge-base
 * Retrieve all knowledge base entries for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const { user, errorResponse } = await authenticate(req);
    if (errorResponse) return errorResponse;
    
    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const query = url.searchParams.get('query') || '';
    const type = url.searchParams.get('type') || undefined;
    
    // Build where clause
    const where: any = {
      user_id: user!.id
    };
    
    // Add type filter if specified
    if (type) {
      where.type = type;
    }
    
    // Add search filter if specified
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    try {
      // Get total count
      const totalCount = await prisma.knowledgeBase.count({ where });
      
      // Get knowledge base entries
      const entries = await prisma.knowledgeBase.findMany({
        where,
        orderBy: {
          created_at: 'desc'
        },
        skip: offset,
        take: limit,
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
          // Don't include the actual content or embeddings in the list view
          // as they can be large
        }
      });
      
      return NextResponse.json({
        entries,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      });
    } catch (dbError) {
      console.error('Database error fetching knowledge base:', dbError);
      return createErrorResponse(
        'Failed to fetch knowledge base entries', 
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
 * POST /api/knowledge-base
 * Create a new knowledge base entry
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
      ['title', 'type', 'content']
    );
    
    if (!isValid) return validationError;
    
    const { title, description, type, content, url, metadata } = body;
    
    // Validate content based on type
    if (type === 'text' && typeof content !== 'string') {
      return createErrorResponse('Content must be a string for text type', 400);
    }
    
    if (type === 'url' && !url) {
      return createErrorResponse('URL is required for url type', 400);
    }
    
    try {
      // Create knowledge base entry
      const entry = await prisma.knowledgeBase.create({
        data: {
          user_id: user!.id,
          title,
          description: description || '',
          type,
          content,
          url: url || null,
          file_path: null, // File upload will be handled separately
          metadata: metadata || {},
          embedding: {}, // Embeddings will be generated asynchronously
        }
      });
      
      // Remove content from response to reduce payload size
      const { content: _, embedding: __, ...entryWithoutContent } = entry;
      
      // Trigger async embedding generation
      // This would typically be handled by a background job
      // For now, we'll just log it
      console.log(`Embedding generation for knowledge base entry ${entry.id} queued`);
      
      return NextResponse.json({ entry: entryWithoutContent }, { status: 201 });
    } catch (dbError) {
      console.error('Database error creating knowledge base entry:', dbError);
      return createErrorResponse(
        'Failed to create knowledge base entry', 
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
 * OPTIONS /api/knowledge-base
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
