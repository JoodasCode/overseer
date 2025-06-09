/**
 * Knowledge Base Files API Route
 * 
 * Handles file uploads and processes them for the knowledge base.
 * Integrates Supabase Storage with vector embeddings for semantic search.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FileProcessor } from '@/lib/knowledge-base/file-processor';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET - List files connected to knowledge base
 */
export async function GET(req: NextRequest) {
  try {
    // Get user from auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const agentId = url.searchParams.get('agentId');

    // Build query conditions
    let query = supabase
      .from('KnowledgeBase')
      .select(`
        id,
        title,
        content_type,
        metadata,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .not('metadata->fileId', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by agent if specified
    if (agentId) {
      query = query.eq('metadata->agentId', agentId);
    }

    const { data: knowledgeFiles, error: dbError } = await query;

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('KnowledgeBase')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('metadata->fileId', 'is', null);

    if (agentId) {
      countQuery = countQuery.eq('metadata->agentId', agentId);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      files: knowledgeFiles || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0),
      },
    });
  } catch (error) {
    console.error('Error in knowledge base files GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge base files' },
      { status: 500 }
    );
  }
}

/**
 * POST - Upload file and process for knowledge base
 */
export async function POST(req: NextRequest) {
  try {
    // Get user from auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const agentId = formData.get('agentId') as string;
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process file for knowledge base
    const result = await FileProcessor.processFileForKnowledgeBase(
      buffer,
      file.name,
      file.type,
      user.id,
      {
        description: title || file.name,
        category: category || 'document',
        agentId: agentId || undefined,
        isPublic: isPublic,
        extractText: true,
        generateEmbedding: true,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to process file' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded and processed for knowledge base',
      data: {
        knowledgeBaseId: result.knowledgeBaseId,
        fileId: result.fileMetadata?.id,
        title: title || file.name,
        contentType: result.fileMetadata?.mimeType,
        hasEmbedding: result.embedding && result.embedding.length > 0,
        extractedContentLength: result.extractedContent?.length || 0,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in knowledge base files POST:', error);
    return NextResponse.json(
      { error: 'Failed to process file upload' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove file from knowledge base (but keep in storage)
 */
export async function DELETE(req: NextRequest) {
  try {
    // Get user from auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get file ID from query parameters
    const url = new URL(req.url);
    const fileId = url.searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Remove from knowledge base
    const success = await FileProcessor.removeFromKnowledgeBase(fileId, user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove file from knowledge base' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File removed from knowledge base (file preserved in storage)',
    });
  } catch (error) {
    console.error('Error in knowledge base files DELETE:', error);
    return NextResponse.json(
      { error: 'Failed to remove file from knowledge base' },
      { status: 500 }
    );
  }
} 