/**
 * Batch Job Results API
 * Endpoint for retrieving the results of a completed batch job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { batchProcessor } from '@/lib/ai/batch-processor';
import { ErrorHandler } from '@/lib/error-handler';
import { prisma } from '@/lib/db/prisma';

interface BatchJobResultsParams {
  params: {
    jobId: string;
  };
}

/**
 * GET /api/batch/jobs/[jobId]/results
 * Get results of a specific batch job
 */
export async function GET(req: NextRequest, { params }: BatchJobResultsParams) {
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
    const { jobId } = params;
    
    // Get job status first to verify ownership
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
    
    // Parse query parameters for pagination
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    
    // Fetch results from database
    try {
      const results = await prisma.$queryRaw`
        SELECT * FROM "BatchProcessResult"
        WHERE "job_id" = ${jobId}
        ORDER BY "created_at" ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      // Get total count
      const totalResult = await prisma.$queryRaw`
        SELECT COUNT(*) as total FROM "BatchProcessResult"
        WHERE "job_id" = ${jobId}
      `;
      
      const total = Array.isArray(totalResult) && totalResult.length > 0
        ? parseInt(totalResult[0].total, 10)
        : 0;
      
      return NextResponse.json({
        results: Array.isArray(results) ? results : [],
        total,
        job
      });
    } catch (dbError: any) {
      ErrorHandler.logError({
        errorCode: 'get_batch_results_db_error',
        errorMessage: `Database error retrieving batch results: ${dbError.message}`,
        userId,
        payload: { jobId, error: dbError.message }
      });
      
      return NextResponse.json(
        { error: 'Failed to retrieve batch results' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'get_batch_results_error',
      errorMessage: `Failed to get batch results: ${error.message}`,
      payload: { error: error.message, jobId: params.jobId }
    });
    
    return NextResponse.json(
      { error: 'Failed to get batch results' },
      { status: 500 }
    );
  }
}
