import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/api-utils/auth';
import { createErrorResponse } from '@/lib/api-utils/validation';
import { KnowledgeRetriever } from '@/lib/knowledge-base/knowledge-retriever';

/**
 * POST /api/knowledge-base/search
 * Search the knowledge base using semantic search
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
    
    const { query, limit = 5, type = 'semantic' } = body;
    
    // Validate query
    if (!query || typeof query !== 'string') {
      return createErrorResponse('Query is required and must be a string', 400);
    }
    
    try {
      let results;
      
      // Perform search based on type
      if (type === 'semantic') {
        // Semantic search using embeddings
        results = await KnowledgeRetriever.retrieveKnowledge(query, user!.id, limit);
      } else if (type === 'keyword') {
        // Keyword search
        results = await KnowledgeRetriever.searchByKeyword(query, user!.id, limit);
      } else {
        return createErrorResponse('Invalid search type. Must be "semantic" or "keyword"', 400);
      }
      
      // Format results to exclude large content fields
      const formattedResults = results.map(item => {
        // Extract a snippet from the content (first 200 characters)
        const contentSnippet = item.content ? 
          item.content.substring(0, 200) + (item.content.length > 200 ? '...' : '') : '';
        
        return {
          id: item.id,
          title: item.title,
          contentType: item.content_type,
          snippet: contentSnippet,
          metadata: item.metadata,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          similarity: item.similarity || null,
        };
      });
      
      return NextResponse.json({
        results: formattedResults,
        query,
        type,
      });
    } catch (searchError) {
      console.error('Error searching knowledge base:', searchError);
      return createErrorResponse(
        'Failed to search knowledge base', 
        500, 
        (searchError as Error).message
      );
    }
  } catch (error) {
    console.error('Error in knowledge base search API:', error);
    return createErrorResponse(
      'Failed to process request', 
      500, 
      (error as Error).message
    );
  }
}

/**
 * OPTIONS /api/knowledge-base/search
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
