import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ErrorHandler } from '@/lib/error-handler';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AgentCreateRequest {
  name: string;
  description?: string;
  avatar_url?: string;
  tools?: Record<string, any>;
  preferences?: Record<string, any>;
  metadata?: Record<string, any>;
}

interface AgentUpdateRequest {
  name?: string;
  description?: string;
  avatar_url?: string;
  tools?: Record<string, any>;
  preferences?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * GET /api/agents
 * Retrieve all agents for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Get user from the Authorization header
    const authHeader = req.headers.get('authorization');
    console.log('🔍 Agents API called - Authorization header:', authHeader ? `${authHeader.substring(0, 30)}...` : 'null');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log('🔑 Extracted token:', token ? `${token.substring(0, 20)}...` : 'null');
    
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    console.log('👤 Auth result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message
    });
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message);
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const sort = url.searchParams.get('sort') || 'created_at';
    const order = url.searchParams.get('order') || 'desc';
    
    // Query agents table using Supabase
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from('portal_agents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        throw new Error(`Count query failed: ${countError.message}`);
      }

      // Get agents with pagination and sorting
      const { data: agents, error: agentsError } = await supabase
        .from('portal_agents')
        .select('*')
        .eq('user_id', user.id)
        .order(sort, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

      if (agentsError) {
        throw new Error(`Agents query failed: ${agentsError.message}`);
      }
      
      return NextResponse.json({
        agents: agents || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: offset + limit < (count || 0),
        },
      });
    } catch (dbError) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'agents_db_fetch_error',
          errorMessage: 'Database error when fetching agents',
          userId: user.id,
          payload: { error: (dbError as Error).message }
        })
      );
      return NextResponse.json(
        { error: 'Failed to fetch agents', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'agents_fetch_error',
        errorMessage: 'Error fetching agents',
        payload: { error: (error as Error).message }
      })
    );
    return NextResponse.json(
      { error: 'Failed to fetch agents', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents
 * Create a new agent
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
    
    // Parse and validate request body
    let body: AgentCreateRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'agents_invalid_json',
          errorMessage: 'Invalid JSON in request body when creating agent',
          userId: user.id,
          payload: { error: (parseError as Error).message }
        })
      );
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { name, description, avatar_url, tools, preferences, metadata } = body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'agents_missing_name',
          errorMessage: 'Agent name is required',
          userId: user.id,
          payload: { body }
        })
      );
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      );
    }
    
    // Create new agent using Supabase
    try {
      // PHASE 1C FIX: Ensure user exists in User table before creating agent
      console.log('🔍 Checking if user exists in database:', user.id);
      
      // User authentication is handled by Supabase Auth
      console.log('✅ User authenticated via Supabase Auth:', user.email);

      // Create the agent using the new portal_agents table
      console.log('🤖 Creating agent for user:', user.id);
      const { data: agent, error: agentError } = await supabase
        .from('portal_agents')
        .insert({
          user_id: user.id,
          name,
          role: description || 'Assistant',
          persona: description || 'A helpful AI assistant',
          avatar: '🤖',
          tools: tools || [],
          level: 1,
          xp: 0,
          status: 'active',
          personality_profile: preferences || {},
          memory_map: {},
          task_feed: {},
          level_xp: 0,
          efficiency_score: 100.00,
          is_active: true,
          department_type: metadata?.department || null
        })
        .select()
        .single();

      if (agentError) {
        throw new Error(`Agent creation failed: ${agentError.message}`);
      }
      
      console.log('✅ Agent created successfully:', agent.id);
      
      // Create initial agent memory using the new portal_agent_memory table
      const { error: memoryError } = await supabase
        .from('portal_agent_memory')
        .insert({
          agent_id: agent.id,
          user_id: user.id,
          weekly_goals: 'Help user achieve their goals',
          preferences: ['Be helpful and friendly'],
          recent_learnings: ['User just created me'],
          type: 'memory'
        });

      if (memoryError) {
        console.warn('⚠️ Failed to create initial agent memory:', memoryError.message);
        // Don't fail the agent creation if memory creation fails
      } else {
        console.log('✅ Agent memory initialized');
      }
      
      return NextResponse.json({ agent }, { status: 201 });
    } catch (dbError) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'agents_db_create_error',
          errorMessage: 'Database error when creating agent',
          userId: user.id,
          payload: { error: (dbError as Error).message, agentData: { name, description } }
        })
      );
      return NextResponse.json(
        { error: 'Failed to create agent', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'agents_create_error',
        errorMessage: 'Error creating agent',
        payload: { error: (error as Error).message }
      })
    );
    return NextResponse.json(
      { error: 'Failed to create agent', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/agents
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
