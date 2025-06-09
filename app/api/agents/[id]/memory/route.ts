import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
 * Retrieve agent memory entries
 */
export async function GET(
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const category = url.searchParams.get('category');
    const include_shared = url.searchParams.get('include_shared') === 'true';

    // Get agent's own memory
    let memoryQuery = supabase
      .from('agent_memory')
      .select('*')
      .eq('agent_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) {
      memoryQuery = memoryQuery.eq('category', category);
    }

    const { data: memory, error: memoryError } = await memoryQuery;

    if (memoryError) {
      return NextResponse.json(
        { error: 'Failed to fetch memory', details: memoryError.message },
        { status: 500 }
      );
    }

    let sharedMemory = [];
    if (include_shared) {
      // Get shared memory directed to this agent
      const { data: shared, error: sharedError } = await supabase
        .from('shared_agent_memory')
        .select(`
          *,
          from_agent:agents!shared_agent_memory_from_agent_id_fkey(name, avatar)
        `)
        .eq('to_agent_id', id)
        .or(`context_expires_at.is.null,context_expires_at.gt.${new Date().toISOString()}`)
        .order('shared_at', { ascending: false })
        .limit(10);

      if (!sharedError) {
        sharedMemory = shared || [];
      }
    }

    return NextResponse.json({
      memory: memory || [],
      shared_memory: sharedMemory,
      total: memory?.length || 0
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/[id]/memory
 * Create new memory entry or share memory with another agent
 */
export async function POST(
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, user_id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { type } = body;

    if (type === 'share_memory') {
      // Share memory with another agent
      const { to_agent_id, content, memory_type, context, expires_in_hours }: SharedMemoryRequest = body;

      if (!to_agent_id || !content || !memory_type) {
        return NextResponse.json(
          { error: 'Missing required fields for memory sharing' },
          { status: 400 }
        );
      }

      // Verify target agent exists and belongs to same user
      const { data: targetAgent, error: targetError } = await supabase
        .from('agents')
        .select('id, user_id')
        .eq('id', to_agent_id)
        .eq('user_id', user.id)
        .single();

      if (targetError || !targetAgent) {
        return NextResponse.json(
          { error: 'Target agent not found' },
          { status: 404 }
        );
      }

      const expiresAt = expires_in_hours 
        ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString()
        : null;

      const { data: sharedMemory, error: shareError } = await supabase
        .from('shared_agent_memory')
        .insert({
          from_agent_id: id,
          to_agent_id,
          memory_type,
          content,
          context,
          context_expires_at: expiresAt
        })
        .select()
        .single();

      if (shareError) {
        return NextResponse.json(
          { error: 'Failed to share memory', details: shareError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ shared_memory: sharedMemory });

    } else {
      // Create regular memory entry
      const { content, category, context, shareable, importance }: MemoryCreateRequest = body;

      if (!content) {
        return NextResponse.json(
          { error: 'Memory content is required' },
          { status: 400 }
        );
      }

      const { data: memory, error: memoryError } = await supabase
        .from('agent_memory')
        .insert({
          agent_id: id,
          user_id: user.id,
          content,
          category: category || 'general',
          context,
          shareable: shareable || false,
          importance: importance || 'medium'
        })
        .select()
        .single();

      if (memoryError) {
        return NextResponse.json(
          { error: 'Failed to create memory', details: memoryError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ memory });
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
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
    const { data: memory, error: memoryError } = await supabase
      .from('agent_memory')
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

    const { error: deleteError } = await supabase
      .from('agent_memory')
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
