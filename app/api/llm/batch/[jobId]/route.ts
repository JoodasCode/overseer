import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { batchProcessor } from '@/lib/ai/batch-processor';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * GET /api/llm/batch/[jobId]
 * 
 * Get status of a specific batch job
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
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

    // Get job status
    const job = await batchProcessor.getJobStatus(params.jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify ownership
    if (job.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to job' }, { status: 403 });
    }

    // Get job results if completed
    let results = [];
    if (job.status === 'completed') {
      results = await prisma.$queryRaw`
        SELECT * FROM "BatchProcessResult"
        WHERE "job_id" = ${params.jobId}
        ORDER BY "created_at" ASC
      `;
    }

    return NextResponse.json({
      job,
      results: job.status === 'completed' ? results : [],
    });
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'get_batch_job_error',
      errorMessage: error.message,
      payload: { jobId: params.jobId, error: error.stack }
    });
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/llm/batch/[jobId]
 * 
 * Cancel a batch job
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
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

    // Cancel job
    const success = await batchProcessor.cancelJob(params.jobId, user.id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to cancel job' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'cancel_batch_job_error',
      errorMessage: error.message,
      payload: { jobId: params.jobId, error: error.stack }
    });
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
