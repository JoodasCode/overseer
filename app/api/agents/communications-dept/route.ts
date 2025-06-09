import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ErrorHandler } from '@/lib/error-handler';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CommunicationsDeptAgent {
  name: string;
  description: string;
  role: string;
  persona: string;
  avatar: string;
  tone: string;
  voice_style: string;
  system_prompt: string;
  tools_preferred: string[];
  personality_config: Record<string, any>;
  department: string;
  memory_enabled: boolean;
}

const COMMUNICATIONS_AGENTS: CommunicationsDeptAgent[] = [
  {
    name: "Alex",
    description: "Lead Communications Strategist with calm authority and tactical creativity",
    role: "Lead Communications Strategist",
    persona: "Calm, articulate, and tactically creative. Thinks long-term. Speaks with clarity and structure.",
    avatar: "👔",
    tone: "calm, professional, structured",
    voice_style: "composed",
    system_prompt: "You are Alex, the Lead Communications Strategist. You speak with calm authority, think strategically about long-term campaigns, and coordinate team efforts. You prefer structured approaches and clear communication.",
    tools_preferred: ["notion", "gmail", "google_calendar", "slack"],
    personality_config: {
      delegation_style: "clear_briefs",
      decision_making: "data_driven_strategic",
      communication_preference: "structured_detailed"
    },
    department: "communications",
    memory_enabled: true
  },
  {
    name: "Dana",
    description: "Visual Communications Assistant with quirky, expressive energy",
    role: "Visual Communications Assistant",
    persona: "Quirky, visual, expressive. Uses emojis and fast, enthusiastic language.",
    avatar: "🎨",
    tone: "quirky, enthusiastic, visual",
    voice_style: "expressive",
    system_prompt: "You are Dana, the Visual Communications Assistant. You're energetic, creative, and express yourself with emojis and visual metaphors. You love creating visual content and respond quickly with enthusiasm.",
    tools_preferred: ["canva", "figma", "slack", "supabase_storage"],
    personality_config: {
      creativity_level: "high",
      response_speed: "fast",
      emoji_usage: "frequent"
    },
    department: "communications",
    memory_enabled: true
  },
  {
    name: "Jamie",
    description: "Internal Comms Liaison focused on team morale and clarity",
    role: "Internal Communications Liaison",
    persona: "Friendly, empathetic, diplomatic. Prioritizes team morale and clarity.",
    avatar: "🤝",
    tone: "friendly, empathetic, diplomatic",
    voice_style: "warm",
    system_prompt: "You are Jamie, the Internal Communications Liaison. You prioritize team morale, clear communication, and diplomatic solutions. You remember important team events and foster positive relationships.",
    tools_preferred: ["slack", "gmail", "notion", "supabase_db"],
    personality_config: {
      empathy_level: "high",
      conflict_resolution: "diplomatic",
      team_focus: "morale_clarity"
    },
    department: "communications",
    memory_enabled: true
  },
  {
    name: "Riley",
    description: "Data-Driven PR Analyst with analytical precision",
    role: "Data-Driven PR Analyst",
    persona: "Analytical, precise, neutral tone. Speaks with graphs and impact metrics.",
    avatar: "📊",
    tone: "analytical, precise, neutral",
    voice_style: "factual",
    system_prompt: "You are Riley, the Data-Driven PR Analyst. You communicate through data, metrics, and analytical insights. You flag underperformance and provide evidence-based recommendations.",
    tools_preferred: ["supabase_db", "google_sheets", "posthog", "typeform"],
    personality_config: {
      analytical_depth: "high",
      threshold_sensitivity: "medium",
      reporting_style: "metric_focused"
    },
    department: "communications",
    memory_enabled: true
  },
  {
    name: "Toby",
    description: "Reactive Support Coordinator for crisis management",
    role: "Reactive Support Coordinator",
    persona: "Quick-thinking, slightly anxious but extremely thorough. Speaks fast but factually.",
    avatar: "⚡",
    tone: "urgent, thorough, factual",
    voice_style: "rapid",
    system_prompt: "You are Toby, the Reactive Support Coordinator. You respond quickly to issues, monitor for crises, and route urgent matters appropriately. You're thorough but speak with urgency when needed.",
    tools_preferred: ["slack", "gmail", "discord", "supabase_logs", "sentry"],
    personality_config: {
      response_urgency: "high",
      monitoring_frequency: "continuous",
      escalation_threshold: "low"
    },
    department: "communications",
    memory_enabled: true
  }
];

/**
 * GET /api/agents/communications-dept
 * Get all communications department agents for the user
 */
export async function GET(req: NextRequest) {
  try {
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

    // Query communications department agents
    const { data: agents, error: agentsError } = await supabase
      .from('Agent')
      .select('*')
      .eq('user_id', user.id)
      .contains('metadata', { department: 'communications' })
      .order('created_at', { ascending: true });

    if (agentsError) {
      throw new Error(`Failed to fetch communications agents: ${agentsError.message}`);
    }

    return NextResponse.json({
      department: 'communications',
      agents: agents || [],
      total: agents?.length || 0
    });

  } catch (error) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'communications_dept_fetch_error',
        errorMessage: 'Error fetching communications department agents',
        payload: { error: (error as Error).message }
      })
    );
    return NextResponse.json(
      { error: 'Failed to fetch communications department', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/communications-dept
 * Seed/create the communications department agents for the user
 */
export async function POST(req: NextRequest) {
  try {
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

    // Check if communications agents already exist for this user
    const { data: existingAgents, error: checkError } = await supabase
      .from('Agent')
      .select('id, name')
      .eq('user_id', user.id)
      .contains('metadata', { department: 'communications' });

    if (checkError) {
      throw new Error(`Failed to check existing agents: ${checkError.message}`);
    }

    // Parse request body to see if force recreate is requested
    let forceRecreate = false;
    try {
      const body = await req.json();
      forceRecreate = body.forceRecreate === true;
    } catch {
      // Ignore JSON parse errors, default to false
    }

    if (existingAgents && existingAgents.length > 0 && !forceRecreate) {
      return NextResponse.json({
        message: 'Communications department already exists',
        existing_agents: existingAgents,
        suggestion: 'Use forceRecreate: true to recreate the department'
      }, { status: 200 });
    }

    // Delete existing agents if force recreate
    if (forceRecreate && existingAgents && existingAgents.length > 0) {
      const { error: deleteError } = await supabase
        .from('Agent')
        .delete()
        .eq('user_id', user.id)
        .contains('metadata', { department: 'communications' });

      if (deleteError) {
        throw new Error(`Failed to delete existing agents: ${deleteError.message}`);
      }
    }

    const createdAgents = [];

    // Create each communications agent
    for (const agentTemplate of COMMUNICATIONS_AGENTS) {
      const { data: agent, error: agentError } = await supabase
        .from('Agent')
        .insert({
          name: agentTemplate.name,
          description: agentTemplate.description,
          avatar_url: agentTemplate.avatar,
          tools: agentTemplate.tools_preferred,
          personality: agentTemplate.persona,
          system_prompt: agentTemplate.system_prompt,
          stats: {},
          preferences: { 
            role: agentTemplate.role,
            tone: agentTemplate.tone,
            voice_style: agentTemplate.voice_style,
            personality_config: agentTemplate.personality_config
          },
          metadata: { 
            department: agentTemplate.department,
            memory_enabled: agentTemplate.memory_enabled
          },
          user_id: user.id
        })
        .select()
        .single();

      if (agentError) {
        throw new Error(`Failed to create agent ${agentTemplate.name}: ${agentError.message}`);
      }

      createdAgents.push(agent);

      // Create default permissions for this agent
      const permissions = [];
      for (const toolName of agentTemplate.tools_preferred) {
        permissions.push({
          agent_id: agent.id,
          tool_name: toolName,
          can_read: true,
          can_write: toolName !== 'supabase_logs' && toolName !== 'sentry' && toolName !== 'posthog', // Read-only for monitoring tools
          can_delete: toolName === 'canva' || toolName === 'figma' || toolName === 'google_calendar', // Only visual and calendar tools can delete
          can_admin: false,
          granted_by: user.id
        });
      }

      if (permissions.length > 0) {
        const { error: permError } = await supabase
          .from('agent_permissions')
          .insert(permissions);

        if (permError) {
          console.warn(`Failed to create permissions for ${agentTemplate.name}: ${permError.message}`);
        }
      }

      // Create default modes for this agent
      const modes = [
        {
          agent_id: agent.id,
          mode_name: 'default',
          tone_override: null,
          tool_preferences: {},
          response_length: 'normal',
          priority_threshold: 0.5,
          is_active: true,
          activated_by: 'system'
        },
        {
          agent_id: agent.id,
          mode_name: 'urgent',
          tone_override: 'urgent, focused',
          tool_preferences: { preferred_response_time: 'immediate' },
          response_length: 'brief',
          priority_threshold: 0.8,
          is_active: false,
          activated_by: 'system'
        },
        {
          agent_id: agent.id,
          mode_name: 'executive',
          tone_override: 'professional, executive-level',
          tool_preferences: { formality: 'high' },
          response_length: 'detailed',
          priority_threshold: 0.6,
          is_active: false,
          activated_by: 'system'
        }
      ];

      const { error: modesError } = await supabase
        .from('agent_modes')
        .insert(modes);

      if (modesError) {
        console.warn(`Failed to create modes for ${agentTemplate.name}: ${modesError.message}`);
      }
    }

    return NextResponse.json({
      message: 'Communications department created successfully',
      department: 'communications',
      agents: createdAgents,
      total: createdAgents.length
    }, { status: 201 });

  } catch (error) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'communications_dept_create_error',
        errorMessage: 'Error creating communications department',
        payload: { error: (error as Error).message }
      })
    );
    return NextResponse.json(
      { error: 'Failed to create communications department', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents/communications-dept
 * Delete all communications department agents for the user
 */
export async function DELETE(req: NextRequest) {
  try {
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

    // Delete all communications department agents for this user
    const { data: deletedAgents, error: deleteError } = await supabase
      .from('Agent')
      .delete()
      .eq('user_id', user.id)
      .contains('metadata', { department: 'communications' })
      .select('id, name');

    if (deleteError) {
      throw new Error(`Failed to delete communications agents: ${deleteError.message}`);
    }

    return NextResponse.json({
      message: 'Communications department deleted successfully',
      deleted_agents: deletedAgents || [],
      total_deleted: deletedAgents?.length || 0
    });

  } catch (error) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'communications_dept_delete_error',
        errorMessage: 'Error deleting communications department',
        payload: { error: (error as Error).message }
      })
    );
    return NextResponse.json(
      { error: 'Failed to delete communications department', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 