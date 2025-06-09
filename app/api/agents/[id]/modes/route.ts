import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ModeCreateRequest {
  mode_name: string;
  tone_override?: string;
  tool_preferences?: Record<string, any>;
  response_length?: 'brief' | 'normal' | 'detailed';
  priority_threshold?: number;
}

interface ModeActivateRequest {
  mode_name: string;
  activated_by?: 'user' | 'agent' | 'system';
}

/**
 * GET /api/agents/[id]/modes
 * Get all available modes for an agent
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

    // Get all modes for this agent
    const { data: modes, error: modesError } = await supabase
      .from('agent_modes')
      .select('*')
      .eq('agent_id', id)
      .order('created_at', { ascending: false });

    if (modesError) {
      return NextResponse.json(
        { error: 'Failed to fetch modes', details: modesError.message },
        { status: 500 }
      );
    }

    // Find active mode
    const activeMode = modes?.find(mode => mode.is_active) || null;

    return NextResponse.json({
      modes: modes || [],
      active_mode: activeMode,
      total: modes?.length || 0
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/[id]/modes
 * Create a new mode for an agent
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

    const body = await req.json();
    const { mode_name, tone_override, tool_preferences, response_length, priority_threshold }: ModeCreateRequest = body;

    if (!mode_name) {
      return NextResponse.json(
        { error: 'Mode name is required' },
        { status: 400 }
      );
    }

    // Check if mode already exists
    const { data: existingMode } = await supabase
      .from('agent_modes')
      .select('id')
      .eq('agent_id', id)
      .eq('mode_name', mode_name)
      .single();

    if (existingMode) {
      return NextResponse.json(
        { error: 'Mode with this name already exists' },
        { status: 409 }
      );
    }

    // Create new mode
    const { data: newMode, error: createError } = await supabase
      .from('agent_modes')
      .insert({
        agent_id: id,
        mode_name,
        tone_override,
        tool_preferences: tool_preferences || {},
        response_length: response_length || 'normal',
        priority_threshold: priority_threshold || 0.5,
        is_active: false
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create mode', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ mode: newMode });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agents/[id]/modes
 * Activate a specific mode for an agent
 */
export async function PATCH(
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

    const body = await req.json();
    const { mode_name, activated_by }: ModeActivateRequest = body;

    if (!mode_name) {
      return NextResponse.json(
        { error: 'Mode name is required' },
        { status: 400 }
      );
    }

    // Start a transaction to handle mode switching
    const { data: targetMode, error: targetError } = await supabase
      .from('agent_modes')
      .select('id')
      .eq('agent_id', params.id)
      .eq('mode_name', mode_name)
      .single();

    if (targetError || !targetMode) {
      return NextResponse.json(
        { error: 'Mode not found' },
        { status: 404 }
      );
    }

    // Deactivate all other modes for this agent
    const { error: deactivateError } = await supabase
      .from('agent_modes')
      .update({ 
        is_active: false,
        activated_at: null,
        activated_by: null
      })
      .eq('agent_id', params.id);

    if (deactivateError) {
      return NextResponse.json(
        { error: 'Failed to deactivate existing modes', details: deactivateError.message },
        { status: 500 }
      );
    }

    // Activate the target mode
    const { data: activatedMode, error: activateError } = await supabase
      .from('agent_modes')
      .update({
        is_active: true,
        activated_at: new Date().toISOString(),
        activated_by: activated_by || 'user'
      })
      .eq('id', targetMode.id)
      .select()
      .single();

    if (activateError) {
      return NextResponse.json(
        { error: 'Failed to activate mode', details: activateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ mode: activatedMode });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents/[id]/modes/[mode_name]
 * Delete a specific mode
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const modeName = url.searchParams.get('mode_name');

    if (!modeName) {
      return NextResponse.json(
        { error: 'Mode name is required' },
        { status: 400 }
      );
    }

    // Verify agent and mode belong to user
    const { data: mode, error: modeError } = await supabase
      .from('agent_modes')
      .select('id, agent_id, mode_name, is_active')
      .eq('agent_id', params.id)
      .eq('mode_name', modeName)
      .single();

    if (modeError || !mode) {
      return NextResponse.json(
        { error: 'Mode not found' },
        { status: 404 }
      );
    }

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, user_id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Don't allow deletion of active mode without switching first
    if (mode.is_active) {
      return NextResponse.json(
        { error: 'Cannot delete active mode. Switch to another mode first.' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('agent_modes')
      .delete()
      .eq('id', mode.id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete mode', details: deleteError.message },
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