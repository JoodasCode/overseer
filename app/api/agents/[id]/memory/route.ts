import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

/**
 * GET /api/agents/[id]/memory
 * Retrieve agent memory and recent memory logs
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const agentId = params.id;
    
    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();
    
    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Query agent memory
    const { data: memory, error: memoryError } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('agent_id', agentId)
      .single();
    
    if (memoryError) {
      return NextResponse.json(
        { error: memoryError.message },
        { status: 500 }
      );
    }
    
    // Query recent memory logs
    const { data: logs, error: logsError } = await supabase
      .from('memory_logs')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (logsError) {
      return NextResponse.json(
        { error: logsError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      memory,
      logs,
    });
  } catch (error) {
    console.error('Error fetching agent memory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent memory' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agents/[id]/memory
 * Update agent memory
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const agentId = params.id;
    
    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();
    
    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { weekly_goals, recent_learnings, preferences, skills_unlocked } = body;
    
    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (weekly_goals !== undefined) updateData.weekly_goals = weekly_goals;
    if (recent_learnings !== undefined) updateData.recent_learnings = recent_learnings;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (skills_unlocked !== undefined) updateData.skills_unlocked = skills_unlocked;
    
    // Update agent memory
    const { data: memory, error } = await supabase
      .from('agent_memory')
      .update(updateData)
      .eq('agent_id', agentId)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ memory });
  } catch (error) {
    console.error('Error updating agent memory:', error);
    return NextResponse.json(
      { error: 'Failed to update agent memory' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/[id]/memory
 * Add a new memory log entry
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const agentId = params.id;
    
    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();
    
    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { type, content, metadata } = body;
    
    // Validate required fields
    if (!type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Insert memory log
    const { data: log, error } = await supabase
      .from('memory_logs')
      .insert({
        agent_id: agentId,
        type,
        content,
        metadata: metadata || {},
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // If type is 'learning', update recent_learnings in agent_memory
    if (type === 'learning') {
      const { data: memory } = await supabase
        .from('agent_memory')
        .select('recent_learnings')
        .eq('agent_id', agentId)
        .single();
      
      if (memory) {
        const recentLearnings = memory.recent_learnings || [];
        // Add new learning to the beginning of the array and limit to 10 items
        const updatedLearnings = [content, ...recentLearnings].slice(0, 10);
        
        await supabase
          .from('agent_memory')
          .update({ recent_learnings: updatedLearnings })
          .eq('agent_id', agentId);
      }
    }
    
    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error('Error creating memory log:', error);
    return NextResponse.json(
      { error: 'Failed to create memory log' },
      { status: 500 }
    );
  }
}
