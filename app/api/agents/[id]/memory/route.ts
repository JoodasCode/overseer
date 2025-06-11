import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create server-side Supabase client with service role key for JWT validation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface MemoryCreateRequest {
  content: string;
  category?: string;
  context?: string;
  shareable?: boolean;
  importance?: 'low' | 'medium' | 'high';
}

interface SharedMemoryRequest {
  to_agent_id: string;
  content: string;
  memory_type: string;
  context?: string;
  expires_in_hours?: number;
}

/**
 * GET /api/agents/[id]/memory
 * Retrieve agent memory and context
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;

    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Verify agent exists and user has access
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('portal_agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found or access denied' },
        { status: 404 }
      );
    }

    // Get agent memory
    const { data: memory, error: memoryError } = await supabaseAdmin
      .from('portal_agent_memory')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    // Get recent chat history for context
    const { data: recentChats, error: chatsError } = await supabaseAdmin
      .from('portal_agent_logs')
      .select('*')
      .eq('agent_id', agentId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get shared memory from other agents
    const { data: sharedMemory, error: sharedError } = await supabaseAdmin
      .from('shared_agent_memory')
      .select(`
        *,
        from_agent:portal_agents!shared_agent_memory_from_agent_id_fkey(name, role)
      `)
      .eq('to_agent_id', agentId)
      .eq('context_expires_at', null)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        agent: {
          id: agent.id,
          name: agent.name,
          role: agent.role,
          personality_profile: agent.personality_profile || {},
          memory_map: agent.memory_map || {}
        },
        memory: memory || {
          weekly_goals: '',
          preferences: [],
          recent_learnings: []
        },
        recentChats: recentChats || [],
        sharedMemory: sharedMemory || [],
        contextSummary: {
          totalInteractions: recentChats?.length || 0,
          lastActive: agent.updated_at,
          memoryEntries: memory ? Object.keys(memory).length : 0,
          sharedContexts: sharedMemory?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('Agent memory API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/[id]/memory
 * Update agent memory
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;

    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { type, content, metadata = {} } = body;

    if (!type || !content) {
      return NextResponse.json(
        { error: 'Type and content are required' },
        { status: 400 }
      );
    }

    // Verify agent exists and user has access
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('portal_agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found or access denied' },
        { status: 404 }
      );
    }

    // Update or create memory entry
    const { data: existingMemory } = await supabaseAdmin
      .from('portal_agent_memory')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    let memoryData;
    if (existingMemory) {
      // Update existing memory
      const updatedMemory = { ...existingMemory };
      
      switch (type) {
        case 'weekly_goals':
          updatedMemory.weekly_goals = content;
          break;
        case 'preference':
          const preferences = Array.isArray(updatedMemory.preferences) ? updatedMemory.preferences : [];
          if (!preferences.includes(content)) {
            preferences.push(content);
          }
          updatedMemory.preferences = preferences;
          break;
        case 'learning':
          const learnings = Array.isArray(updatedMemory.recent_learnings) ? updatedMemory.recent_learnings : [];
          learnings.unshift(content);
          updatedMemory.recent_learnings = learnings.slice(0, 10); // Keep only last 10
          break;
        default:
          // Store in metadata
          updatedMemory[type] = content;
      }

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('portal_agent_memory')
        .update(updatedMemory)
        .eq('agent_id', agentId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      memoryData = updated;
    } else {
      // Create new memory entry
      const newMemory: any = {
        agent_id: agentId,
        user_id: user.id,
        type: 'memory'
      };

      switch (type) {
        case 'weekly_goals':
          newMemory.weekly_goals = content;
          break;
        case 'preference':
          newMemory.preferences = [content];
          break;
        case 'learning':
          newMemory.recent_learnings = [content];
          break;
        default:
          newMemory[type] = content;
      }

      const { data: created, error: createError } = await supabaseAdmin
        .from('portal_agent_memory')
        .insert(newMemory)
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      memoryData = created;
    }

    // Log the memory update activity
    await supabaseAdmin
      .from('portal_activity_log')
      .insert({
        actor_type: 'user',
        actor_id: user.id,
        action: 'memory_update',
        description: `Updated ${type} for ${agent.name}`,
        meta: { type, content, agentId },
        user_id: user.id,
        agent_id: agentId
      });

    return NextResponse.json({
      success: true,
      data: {
        memory: memoryData,
        message: `Memory updated successfully`
      }
    });

  } catch (error) {
    console.error('Agent memory update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agents/[id]/memory
 * Update agent memory (alias for POST)
 */
export const PATCH = POST;

/**
 * DELETE /api/agents/[id]/memory/[memory_id]
 * Delete specific memory entry
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Await params for Next.js 13+
    const { id } = await params;
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const memoryId = url.searchParams.get('memory_id');

    if (!memoryId) {
      return NextResponse.json(
        { error: 'Memory ID is required' },
        { status: 400 }
      );
    }

    // Verify agent and memory belong to user
    const { data: memory, error: memoryError } = await supabaseAdmin
      .from('portal_agent_memory')
      .select('id, agent_id, user_id')
      .eq('id', memoryId)
      .eq('agent_id', id)
      .eq('user_id', user.id)
      .single();

    if (memoryError || !memory) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from('portal_agent_memory')
      .delete()
      .eq('id', memoryId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete memory', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
