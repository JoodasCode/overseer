import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ErrorHandler } from '@/lib/error-handler';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AgentPersonalityUpdate {
  tone?: string;
  voice_style?: string;
  system_prompt?: string;
  personality_config?: Record<string, any>;
  active_mode?: string;
}

interface AgentPersonalityContext {
  agent: any;
  recentMemory: any[];
  sharedContext: any[];
  activeMode: any;
  availableTools: string[];
}

/**
 * Build personality prompt for LLM injection
 */
function buildPersonalityPrompt(context: AgentPersonalityContext): string {
  const { agent, recentMemory, sharedContext, activeMode } = context;
  
  const modeOverride = activeMode?.tone_override ? `\nCURRENT MODE: ${activeMode.mode_name} - ${activeMode.tone_override}` : '';
  const memoryContext = recentMemory.length > 0 ? `\nRECENT CONTEXT:\n${recentMemory.map(m => `- ${m.content}`).join('\n')}` : '';
  const teamContext = sharedContext.length > 0 ? `\nSHARED TEAM CONTEXT:\n${sharedContext.map(s => `- From ${s.from_agent}: ${s.content}`).join('\n')}` : '';
  
  return `
AGENT IDENTITY:
You are ${agent.name}, ${agent.role}.
Personality: ${agent.persona}
Tone: ${agent.tone}
Voice Style: ${agent.voice_style}${modeOverride}

PREFERRED TOOLS: ${agent.tools_preferred ? agent.tools_preferred.join(', ') : 'None configured'}

${agent.system_prompt}${memoryContext}${teamContext}

Remember to stay in character and maintain your unique personality throughout the conversation.
  `.trim();
}

/**
 * GET /api/agents/[id]/personality
 * Get agent personality context and prompt
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Await params for Next.js 13+
    const { id: agentId } = await params;

    // Get user from the Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }

    // Get agent with personality details
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(`
        *,
        agent_modes!inner(
          id,
          mode_name,
          tone_override,
          tool_preferences,
          response_length,
          priority_threshold,
          is_active
        )
      `)
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    if (agentError) {
      return NextResponse.json(
        { error: 'Agent not found', details: agentError.message },
        { status: 404 }
      );
    }

    // Get recent memory context (last 5 messages)
    const { data: recentMemory } = await supabase
      .from('chat_messages')
      .select('content, role, created_at')
      .eq('agent_id', agentId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get shared team context
    const { data: sharedContext } = await supabase
      .from('shared_agent_memory')
      .select(`
        content,
        memory_type,
        context,
        from_agent:agents!shared_agent_memory_from_agent_id_fkey(name)
      `)
      .eq('to_agent_id', agentId)
      .gt('context_expires_at', new Date().toISOString())
      .order('shared_at', { ascending: false })
      .limit(3);

    // Find active mode
    const activeMode = agent.agent_modes?.find((mode: any) => mode.is_active);

    // Build personality context
    const personalityContext: AgentPersonalityContext = {
      agent,
      recentMemory: recentMemory || [],
      sharedContext: sharedContext || [],
      activeMode,
      availableTools: agent.tools_preferred || []
    };

    // Generate personality prompt
    const personalityPrompt = buildPersonalityPrompt(personalityContext);

    return NextResponse.json({
      agent_id: agentId,
      personality: {
        tone: agent.tone,
        voice_style: agent.voice_style,
        system_prompt: agent.system_prompt,
        personality_config: agent.personality_config,
        active_mode: activeMode,
        available_modes: agent.agent_modes
      },
      context: {
        recent_memory_count: recentMemory?.length || 0,
        shared_context_count: sharedContext?.length || 0,
        available_tools: agent.tools_preferred || []
      },
      personality_prompt: personalityPrompt
    });

  } catch (error) {
    const { id: agentId } = await params;
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'agent_personality_fetch_error',
        errorMessage: 'Error fetching agent personality',
        payload: { agentId: agentId, error: (error as Error).message }
      })
    );
    return NextResponse.json(
      { error: 'Failed to fetch agent personality', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/agents/[id]/personality
 * Update agent personality settings
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Await params for Next.js 13+
    const { id: agentId } = await params;

    // Get user from the Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }

    // Parse request body
    let updates: AgentPersonalityUpdate;
    try {
      updates = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Verify agent exists and belongs to user
    const { data: existingAgent, error: checkError } = await supabase
      .from('agents')
      .select('id, name, tone, voice_style, system_prompt, personality_config')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    if (checkError) {
      return NextResponse.json(
        { error: 'Agent not found', details: checkError.message },
        { status: 404 }
      );
    }

    // Log personality evolution before change
    await supabase
      .from('agent_evolution_log')
      .insert({
        agent_id: agentId,
        change_type: 'personality_update',
        before_state: {
          tone: existingAgent.tone,
          voice_style: existingAgent.voice_style,
          system_prompt: existingAgent.system_prompt,
          personality_config: existingAgent.personality_config
        },
        after_state: {
          tone: updates.tone || existingAgent.tone,
          voice_style: updates.voice_style || existingAgent.voice_style,
          system_prompt: updates.system_prompt || existingAgent.system_prompt,
          personality_config: updates.personality_config || existingAgent.personality_config
        },
        trigger_event: 'user_update',
        user_feedback: 'Manual personality update via API'
      });

    // Prepare update object (only include provided fields)
    const updateData: any = {};
    if (updates.tone !== undefined) updateData.tone = updates.tone;
    if (updates.voice_style !== undefined) updateData.voice_style = updates.voice_style;
    if (updates.system_prompt !== undefined) updateData.system_prompt = updates.system_prompt;
    if (updates.personality_config !== undefined) updateData.personality_config = updates.personality_config;

    // Update agent personality
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', agentId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update agent personality: ${updateError.message}`);
    }

    // Handle mode switching if requested
    let activeModeResult = null;
    if (updates.active_mode) {
      // Deactivate all current modes
      await supabase
        .from('agent_modes')
        .update({ is_active: false, activated_at: null })
        .eq('agent_id', agentId);

      // Activate the requested mode
      const { data: newActiveMode, error: modeError } = await supabase
        .from('agent_modes')
        .update({ 
          is_active: true, 
          activated_at: new Date().toISOString(),
          activated_by: 'user'
        })
        .eq('agent_id', agentId)
        .eq('mode_name', updates.active_mode)
        .select()
        .single();

      if (modeError) {
        console.warn(`Failed to activate mode ${updates.active_mode}: ${modeError.message}`);
      } else {
        activeModeResult = newActiveMode;
      }
    }

    return NextResponse.json({
      message: 'Agent personality updated successfully',
      agent: updatedAgent,
      active_mode: activeModeResult,
      changes_applied: Object.keys(updateData)
    });

  } catch (error) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'agent_personality_update_error',
        errorMessage: 'Error updating agent personality',
        payload: { agentId: (await params).id, error: (error as Error).message }
      })
    );
    return NextResponse.json(
      { error: 'Failed to update agent personality', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/[id]/personality/prompt
 * Generate a fresh personality prompt for the agent
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Await params for Next.js 13+
    const { id: agentId } = await params;

    // Get user from the Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }

    // Get agent with personality details and active mode
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(`
        *,
        agent_modes!inner(*)
      `)
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    if (agentError) {
      return NextResponse.json(
        { error: 'Agent not found', details: agentError.message },
        { status: 404 }
      );
    }

    // Get context data
    const [memoryResult, sharedResult] = await Promise.all([
      // Recent memory
      supabase
        .from('chat_messages')
        .select('content, role, created_at')
        .eq('agent_id', agentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Shared context
      supabase
        .from('shared_agent_memory')
        .select(`
          content,
          memory_type,
          context,
          from_agent:agents!shared_agent_memory_from_agent_id_fkey(name)
        `)
        .eq('to_agent_id', agentId)
        .gt('context_expires_at', new Date().toISOString())
        .order('shared_at', { ascending: false })
        .limit(3)
    ]);

    const activeMode = agent.agent_modes?.find((mode: any) => mode.is_active);

    // Build personality context
    const personalityContext: AgentPersonalityContext = {
      agent,
      recentMemory: memoryResult.data || [],
      sharedContext: sharedResult.data || [],
      activeMode,
      availableTools: agent.tools_preferred || []
    };

    // Generate personality prompt
    const personalityPrompt = buildPersonalityPrompt(personalityContext);

    return NextResponse.json({
      agent_id: agentId,
      agent_name: agent.name,
      personality_prompt: personalityPrompt,
      context_summary: {
        recent_messages: memoryResult.data?.length || 0,
        shared_contexts: sharedResult.data?.length || 0,
        active_mode: activeMode?.mode_name || 'default',
        tools_available: agent.tools_preferred?.length || 0
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'agent_personality_prompt_error',
        errorMessage: 'Error generating agent personality prompt',
        payload: { agentId: params.id, error: (error as Error).message }
      })
    );
    return NextResponse.json(
      { error: 'Failed to generate personality prompt', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, PUT, POST, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 