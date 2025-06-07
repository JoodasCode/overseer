import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/api-utils/auth';
import { createErrorResponse } from '@/lib/api-utils/validation';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { JobProcessor } from '@/lib/knowledge-base/job-processor';

// Initialize Supabase client for file storage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define allowed file types and size limits
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/knowledge-base/upload
 * Upload a file to the knowledge base
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { user, errorResponse } = await authenticate(req);
    if (errorResponse) return errorResponse;
    
    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const category = formData.get('category') as string | null;
    const description = formData.get('description') as string | null;
    
    // Validate file
    if (!file) {
      return createErrorResponse('No file provided', 400);
    }
    
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return createErrorResponse(
        `File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
        400
      );
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return createErrorResponse(
        `File size exceeds the maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        400
      );
    }
    
    // Generate a unique file name
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    const filePath = `${user!.id}/${fileName}`;
    
    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error('Error uploading file to Supabase Storage:', uploadError);
      return createErrorResponse(
        'Failed to upload file',
        500,
        uploadError.message
      );
    }
    
    // Create knowledge base entry in database
    const knowledgeEntry = await prisma.knowledgeBase.create({
      data: {
        user_id: user!.id,
        title: title || file.name,
        content: '', // Will be populated after text extraction
        content_type: 'document',
        metadata: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          filePath: filePath,
          category: category || 'uncategorized',
          description: description || '',
          uploadedAt: new Date().toISOString(),
          processingStatus: 'pending',
        },
      },
    });
    
    // Queue document for processing
    await JobProcessor.queueDocument(knowledgeEntry.id);
    
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully and queued for processing',
      data: {
        id: knowledgeEntry.id,
        title: knowledgeEntry.title,
        contentType: knowledgeEntry.content_type,
        createdAt: knowledgeEntry.created_at,
        metadata: knowledgeEntry.metadata,
      },
    });
  } catch (error) {
    console.error('Error in knowledge base upload API:', error);
    return createErrorResponse(
      'Failed to process upload',
      500,
      (error as Error).message
    );
  }
}

/**
 * OPTIONS /api/knowledge-base/upload
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
