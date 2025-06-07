import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { creditSystem, CreditOperationType } from '@/lib/ai/credit-system';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * GET /api/billing/audit
 * 
 * Get credit audit logs for the authenticated user
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
    const operationType = searchParams.get('type') as CreditOperationType | undefined;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Parse date filters if provided
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (searchParams.get('startDate')) {
      startDate = new Date(searchParams.get('startDate') as string);
    }
    
    if (searchParams.get('endDate')) {
      endDate = new Date(searchParams.get('endDate') as string);
    }

    // Get audit logs
    const result = await creditSystem.getCreditAuditLogs(user.id, {
      operationType,
      limit,
      offset,
      startDate,
      endDate,
    });

    return NextResponse.json({
      logs: result.logs,
      total: result.total,
      pagination: {
        limit,
        offset,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'get_audit_logs_error',
      errorMessage: error.message,
      payload: { error: error.stack }
    });
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
