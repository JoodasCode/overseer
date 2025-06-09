/**
 * Individual Batch Job API
 * Endpoints for retrieving, canceling, and managing individual batch jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { batchProcessor } from '@/lib/ai/batch-processor';
import { ErrorHandler } from '@/lib/error-handler';
import { prisma } from '@/lib/db/prisma';

interface BatchJobParams {
  params: Promise<{
    jobId: string;
  }>;
}

/**
 * GET /api/batch/jobs/[jobId]
 * Get status of a specific batch job
 */
export async function GET(req: NextRequest, { params }: BatchJobParams) {
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
    const { jobId } = await params;
    
    // Get job status
    const job = await batchProcessor.getJobStatus(jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Verify ownership
    if (job.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(job);
  } catch (error: any) {
    const paramsResolved = await params;
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'get_batch_job_error',
        errorMessage: `Failed to get batch job: ${error.message}`,
        userId: undefined,
        payload: { error: error.message, jobId: paramsResolved.jobId }
      })
    );
    
    return NextResponse.json(
      { error: 'Failed to get batch job' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/batch/jobs/[jobId]
 * Cancel a batch job
 */
export async function DELETE(req: NextRequest, { params }: BatchJobParams) {
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
    const { jobId } = await params;
    
    // Cancel job
    const success = await batchProcessor.cancelJob(jobId, userId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cancel job. Job may not exist, be already completed, or not belong to you.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const paramsResolved = await params;
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'cancel_batch_job_error',
        errorMessage: `Failed to cancel batch job: ${error.message}`,
        userId: undefined,
        payload: { error: error.message, jobId: paramsResolved.jobId }
      })
    );
    
    return NextResponse.json(
      { error: 'Failed to cancel batch job' },
      { status: 500 }
    );
  }
}
