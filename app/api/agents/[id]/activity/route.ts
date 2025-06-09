/**
 * Agent Activity API Route
 * 
 * Demonstrates Redis integration with real-time pub/sub and intelligent caching.
 * Provides agent activity tracking and live updates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redisService } from '@/lib/redis/redis-service';
import { withRateLimit, rateLimiters } from '@/lib/middleware/rate-limit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET - Get agent activity with caching
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await withRateLimit(req, rateLimiters.default);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const agentId = params.id;
    
    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user from token (simplified)
    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.user.id;

    // Try to get cached agent context first
    const cachedContext = await redisService.getCachedAgentContext(agentId);
    let agentData: any = null;

    if (cachedContext) {
      agentData = cachedContext;
      await redisService.trackCacheHit('agent_context', true);
    } else {
      // Fetch from database
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select(`
          *,
          agent_memory (
            id,
            content,
            memory_type,
            importance,
            created_at
          ),
          workflow_executions (
            id,
            status,
            created_at,
            updated_at
          )
        `)
        .eq('id', agentId)
        .eq('user_id', userId)
        .single();

      if (agentError || !agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      agentData = {
        ...agent,
        activity: {
          recentMemories: agent.agent_memory?.slice(0, 10) || [],
          recentExecutions: agent.workflow_executions?.slice(0, 5) || [],
          lastActive: agent.updated_at,
        }
      };

      // Cache the agent context
      await redisService.cacheAgentContext(agentId, {
        memory: agent.agent_memory || [],
        knowledge: [], // Would fetch from knowledge base
        recentTasks: agent.workflow_executions || [],
        preferences: agent.preferences || {},
      });

      await redisService.trackCacheHit('agent_context', false);
    }

    // Get activity metrics from Redis
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    const activityMetrics = await redisService.getMetrics(
      'agent_activity',
      hourAgo,
      now
    );

    // Track this API call
    await redisService.storeMetric('agent_activity_request', 1, {
      agentId: agentId.substring(0, 8),
      userId: userId.substring(0, 8),
    });

    return NextResponse.json({
      agent: agentData,
      metrics: {
        hourlyActivity: activityMetrics.length,
        cacheHit: cachedContext !== null,
        lastUpdated: now,
      },
      realTimeChannel: `agent_activity:${userId}`,
    });

  } catch (error) {
    console.error('Error getting agent activity:', error);
    
    // Track error
    await redisService.trackError(params.id, 'activity_api', 'fetch_error');
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Update agent activity and publish real-time update
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting for agent updates
    const rateLimitResponse = await withRateLimit(req, rateLimiters.agentChat);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const agentId = params.id;
    const body = await req.json();
    
    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.user.id;
    const { activityType, data: activityData } = body;

    // Validate activity type
    const validActivityTypes = ['task_started', 'task_completed', 'memory_updated', 'error_occurred'];
    if (!validActivityTypes.includes(activityType)) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 });
    }

    // Update agent's last activity timestamp
    const { error: updateError } = await supabase
      .from('agents')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', agentId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating agent activity:', updateError);
    }

    // Invalidate cached agent context
    await redisService.invalidateAgentContext(agentId);

    // Store activity metric
    await redisService.storeMetric('agent_activity', 1, {
      agentId: agentId.substring(0, 8),
      activityType,
      userId: userId.substring(0, 8),
    });

    // Publish real-time activity update
    await redisService.publishAgentActivity(userId, agentId, {
      type: activityType as any,
      data: activityData,
      timestamp: Date.now(),
    });

    // Also publish dashboard update
    await redisService.publishDashboardUpdate(userId, {
      type: 'agent_status',
      data: {
        agentId,
        status: activityType,
        timestamp: Date.now(),
        details: activityData,
      },
      timestamp: Date.now(),
    });

    // Update user presence (they're actively using the system)
    await redisService.updateUserPresence(userId, 'online', {
      lastActivity: 'agent_interaction',
      agentId: agentId.substring(0, 8),
    });

    return NextResponse.json({
      success: true,
      activityType,
      timestamp: Date.now(),
      published: true,
    });

  } catch (error) {
    console.error('Error updating agent activity:', error);
    
    // Track error
    await redisService.trackError(params.id, 'activity_api', 'update_error');
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear agent activity cache
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    
    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.user.id;

    // Verify agent ownership
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .eq('user_id', userId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Clear agent context cache
    await redisService.invalidateAgentContext(agentId);

    // Track cache clear action
    await redisService.storeMetric('agent_cache_cleared', 1, {
      agentId: agentId.substring(0, 8),
      userId: userId.substring(0, 8),
    });

    return NextResponse.json({
      success: true,
      message: 'Agent activity cache cleared',
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Error clearing agent activity cache:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 