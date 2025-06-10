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
 * Get available modes for an agent and current active mode
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

    // Get all available modes for this agent
    const { data: modes, error: modesError } = await supabaseAdmin
      .from('agent_modes')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: true });

    if (modesError) {
      console.error('Error fetching agent modes:', modesError);
      return NextResponse.json(
        { error: 'Failed to fetch agent modes' },
        { status: 500 }
      );
    }

    // Find the currently active mode
    const activeMode = modes?.find(mode => mode.is_active) || null;

    // Define default modes based on agent type/department
    const defaultModes = getDefaultModesForAgent(agent);

    return NextResponse.json({
      success: true,
      data: {
        agent: {
          id: agent.id,
          name: agent.name,
          role: agent.role,
          department: agent.department_type
        },
        modes: modes || [],
        active_mode: activeMode,
        default_modes: defaultModes,
        total_modes: modes?.length || 0
      }
    });

  } catch (error) {
    console.error('Agent modes API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/[id]/modes
 * Create a new custom mode for an agent
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
    const { 
      mode_name, 
      tone_override, 
      tool_preferences = {}, 
      response_length = 'normal',
      priority_threshold = 0.5 
    } = body;

    if (!mode_name) {
      return NextResponse.json(
        { error: 'Mode name is required' },
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

    // Check if mode already exists
    const { data: existingMode } = await supabaseAdmin
      .from('agent_modes')
      .select('id')
      .eq('agent_id', agentId)
      .eq('mode_name', mode_name)
      .single();

    if (existingMode) {
      return NextResponse.json(
        { error: 'Mode with this name already exists' },
        { status: 409 }
      );
    }

    // Create the new mode
    const { data: newMode, error: createError } = await supabaseAdmin
      .from('agent_modes')
      .insert({
        agent_id: agentId,
        mode_name,
        tone_override,
        tool_preferences,
        response_length,
        priority_threshold,
        is_active: false
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating mode:', createError);
      return NextResponse.json(
        { error: 'Failed to create mode' },
        { status: 500 }
      );
    }

    // Log the mode creation activity
    await supabaseAdmin
      .from('portal_activity_log')
      .insert({
        actor_type: 'user',
        actor_id: user.id,
        action: 'mode_create',
        description: `Created new ${mode_name} mode for ${agent.name}`,
        meta: { mode_name, tone_override, tool_preferences },
        user_id: user.id,
        agent_id: agentId
      });

    return NextResponse.json({
      success: true,
      data: {
        mode: newMode,
        message: `Successfully created ${mode_name} mode`
      }
    });

  } catch (error) {
    console.error('Agent mode creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agents/[id]/modes
 * Switch agent to a different mode
 */
export async function PATCH(
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
    const { mode_name, activated_by = 'user' } = body;

    if (!mode_name) {
      return NextResponse.json(
        { error: 'Mode name is required' },
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

    // Deactivate all current modes for this agent
    await supabaseAdmin
      .from('agent_modes')
      .update({ 
        is_active: false,
        activated_at: null,
        activated_by: null
      })
      .eq('agent_id', agentId);

    // Check if the requested mode exists
    let { data: targetMode, error: modeError } = await supabaseAdmin
      .from('agent_modes')
      .select('*')
      .eq('agent_id', agentId)
      .eq('mode_name', mode_name)
      .single();

    if (!targetMode) {
      // Create the mode if it doesn't exist (using default configuration)
      const defaultMode = createDefaultMode(mode_name, agentId, agent);
      
      const { data: newMode, error: createError } = await supabaseAdmin
        .from('agent_modes')
        .insert(defaultMode)
        .select()
        .single();

      if (createError) {
        console.error('Error creating new mode:', createError);
        return NextResponse.json(
          { error: 'Failed to create mode' },
          { status: 500 }
        );
      }
      
      targetMode = newMode;
    }

    // Activate the target mode
    const { data: activatedMode, error: activateError } = await supabaseAdmin
      .from('agent_modes')
      .update({
        is_active: true,
        activated_at: new Date().toISOString(),
        activated_by
      })
      .eq('id', targetMode.id)
      .select()
      .single();

    if (activateError) {
      console.error('Error activating mode:', activateError);
      return NextResponse.json(
        { error: 'Failed to activate mode' },
        { status: 500 }
      );
    }

    // Log the mode switch activity
    await supabaseAdmin
      .from('portal_activity_log')
      .insert({
        actor_type: activated_by === 'user' ? 'user' : 'agent',
        actor_id: activated_by === 'user' ? user.id : agentId,
        action: 'mode_switch',
        description: `${agent.name} switched to ${mode_name} mode`,
        meta: { 
          mode_name, 
          activated_by,
          previous_mode: null // Could track this if needed
        },
        user_id: user.id,
        agent_id: agentId
      });

    return NextResponse.json({
      success: true,
      data: {
        active_mode: activatedMode,
        message: `Successfully switched to ${mode_name} mode`
      }
    });

  } catch (error) {
    console.error('Agent mode switch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
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
    const { data: mode, error: modeError } = await supabaseAdmin
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
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('portal_agents')
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

    const { error: deleteError } = await supabaseAdmin
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

// Helper function to get default modes based on agent type
function getDefaultModesForAgent(agent: any) {
  const baseModes = [
    {
      mode_name: 'default',
      description: 'Standard operational mode',
      tone_override: null,
      response_length: 'normal',
      priority_threshold: 0.5
    },
    {
      mode_name: 'urgent',
      description: 'High-priority, fast response mode',
      tone_override: 'urgent, concise',
      response_length: 'brief',
      priority_threshold: 0.2
    },
    {
      mode_name: 'detailed',
      description: 'Comprehensive, thorough response mode',
      tone_override: 'thorough, analytical',
      response_length: 'detailed',
      priority_threshold: 0.7
    }
  ];

  // Add department-specific modes
  if (agent.department_type === 'communications') {
    baseModes.push(
      {
        mode_name: 'creative',
        description: 'Enhanced creativity for content creation',
        tone_override: 'creative, inspiring',
        response_length: 'normal',
        priority_threshold: 0.6
      },
      {
        mode_name: 'executive',
        description: 'Professional mode for executive communications',
        tone_override: 'professional, executive',
        response_length: 'brief',
        priority_threshold: 0.8
      }
    );
  }

  return baseModes;
}

// Helper function to create a default mode configuration
function createDefaultMode(modeName: string, agentId: string, agent: any) {
  const defaultModes = getDefaultModesForAgent(agent);
  const modeConfig = defaultModes.find(m => m.mode_name === modeName) || defaultModes[0];

  return {
    agent_id: agentId,
    mode_name: modeName,
    tone_override: modeConfig.tone_override,
    tool_preferences: {},
    response_length: modeConfig.response_length,
    priority_threshold: modeConfig.priority_threshold,
    is_active: false
  };
} 