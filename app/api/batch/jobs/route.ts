/**
 * Batch Jobs API
 * Endpoints for creating and managing batch processing jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { batchProcessor } from '@/lib/ai/batch-processor';
import { ErrorHandler } from '@/lib/error-handler';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/batch/jobs
 * List batch jobs for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status') as 'pending' | 'processing' | 'completed' | 'failed' | undefined;
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    
    // Get jobs
    const result = await batchProcessor.listJobs(userId, {
      status,
      limit,
      offset,
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'list_batch_jobs_error',
      errorMessage: `Failed to list batch jobs: ${error.message}`,
      payload: { error: error.message }
    });
    
    return NextResponse.json(
      { error: 'Failed to list batch jobs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/batch/jobs
 * Create a new batch processing job
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Parse request body
    const body = await req.json();
    
    // Validate request
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and must not be empty' },
        { status: 400 }
      );
    }
    
    // Ensure each item has content
    const items = body.items.map((item: any) => ({
      id: item.id || uuidv4(),
      content: item.content,
      metadata: item.metadata || {},
    }));
    
    // Create job
    const job = await batchProcessor.createJob(userId, items, {
      agentId: body.agentId,
      model: body.model,
      tokenEstimateMultiplier: body.tokenEstimateMultiplier,
    });
    
    if (!job) {
      return NextResponse.json(
        { error: 'Failed to create job. Insufficient credits or invalid parameters.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(job);
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'create_batch_job_error',
      errorMessage: `Failed to create batch job: ${error.message}`,
      payload: { error: error.message }
    });
    
    return NextResponse.json(
      { error: 'Failed to create batch job' },
      { status: 500 }
    );
  }
}
