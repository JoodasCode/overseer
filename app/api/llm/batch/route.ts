import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { batchProcessor, BatchProcessItem } from '@/lib/ai/batch-processor';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * POST /api/llm/batch
 * 
 * Create a new batch processing job
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const { items, agentId, model, tokenEstimateMultiplier } = body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items format' }, { status: 400 });
    }

    // Create batch job
    const job = await batchProcessor.createJob(
      user.id,
      items as BatchProcessItem[],
      {
        agentId,
        model,
        tokenEstimateMultiplier,
      }
    );

    if (!job) {
      return NextResponse.json({ error: 'Failed to create batch job. Check credit availability.' }, { status: 400 });
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      totalItems: job.totalItems,
      estimatedTokens: job.estimatedTokens,
      creditsPreAuthorized: job.creditsPreAuthorized,
    });
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'create_batch_job_api_error',
      errorMessage: error.message,
      payload: { error: error.stack }
    });
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/llm/batch
 * 
 * List batch jobs for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as 'pending' | 'processing' | 'completed' | 'failed' | undefined;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // List jobs
    const result = await batchProcessor.listJobs(user.id, {
      status,
      limit,
      offset,
    });

    return NextResponse.json({
      jobs: result.jobs,
      total: result.total,
      pagination: {
        limit,
        offset,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'list_batch_jobs_error',
      errorMessage: error.message,
      payload: { error: error.stack }
    });
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
