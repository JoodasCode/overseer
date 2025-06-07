import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { creditSystem } from '@/lib/ai/credit-system';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * GET /api/billing/usage
 * 
 * Get detailed token usage information for the authenticated user
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
    const period = searchParams.get('period') || 'month'; // day, week, month, year
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const agentId = searchParams.get('agentId') || undefined;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1); // Default to month
    }

    // Query token usage records
    const tokenUsage = await prisma.tokenUsage.findMany({
      where: {
        user_id: user.id,
        ...(agentId ? { agent_id: agentId } : {}),
        timestamp: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.tokenUsage.count({
      where: {
        user_id: user.id,
        ...(agentId ? { agent_id: agentId } : {}),
        timestamp: {
          gte: startDate,
          lte: now,
        },
      },
    });

    // Calculate aggregated statistics
    const stats = await prisma.$queryRaw`
      SELECT 
        SUM(prompt_tokens) as total_prompt_tokens,
        SUM(completion_tokens) as total_completion_tokens,
        SUM(total_tokens) as total_tokens,
        SUM(credits_used) as total_credits_used,
        COUNT(*) as request_count
      FROM "TokenUsage"
      WHERE 
        user_id = ${user.id}
        ${agentId ? prisma.$queryRaw`AND agent_id = ${agentId}` : prisma.$queryRaw``}
        AND timestamp >= ${startDate}
        AND timestamp <= ${now}
    `;

    // Get usage by model
    const usageByModel = await prisma.$queryRaw`
      SELECT 
        model_name,
        SUM(total_tokens) as total_tokens,
        SUM(credits_used) as credits_used,
        COUNT(*) as request_count
      FROM "TokenUsage"
      WHERE 
        user_id = ${user.id}
        ${agentId ? prisma.$queryRaw`AND agent_id = ${agentId}` : prisma.$queryRaw``}
        AND timestamp >= ${startDate}
        AND timestamp <= ${now}
      GROUP BY model_name
      ORDER BY credits_used DESC
    `;

    // Get usage by agent (if not filtered by agent)
    let usageByAgent = [];
    if (!agentId) {
      usageByAgent = await prisma.$queryRaw`
        SELECT 
          a.name as agent_name,
          a.id as agent_id,
          SUM(tu.total_tokens) as total_tokens,
          SUM(tu.credits_used) as credits_used,
          COUNT(*) as request_count
        FROM "TokenUsage" tu
        JOIN "Agent" a ON tu.agent_id = a.id
        WHERE 
          tu.user_id = ${user.id}
          AND tu.timestamp >= ${startDate}
          AND tu.timestamp <= ${now}
        GROUP BY a.id, a.name
        ORDER BY credits_used DESC
      `;
    }

    return NextResponse.json({
      usage: tokenUsage,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
      stats,
      usageByModel,
      usageByAgent,
    });
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'get_usage_error',
      errorMessage: error.message,
      payload: { error: error.stack }
    });
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
