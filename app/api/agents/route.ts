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
        .from('Agent')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        throw new Error(`Count query failed: ${countError.message}`);
      }

      // Get agents with pagination and sorting
      const { data: agents, error: agentsError } = await supabase
        .from('Agent')
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
      const { data: agent, error: agentError } = await supabase
        .from('Agent')
        .insert({
          user_id: user.id,
          name,
          description,
          avatar_url,
          tools: tools || {},
          preferences: preferences || {},
          metadata: metadata || {},
        })
        .select()
        .single();

      if (agentError) {
        throw new Error(`Agent creation failed: ${agentError.message}`);
      }
      
      // Create initial agent memory
      const { error: memoryError } = await supabase
        .from('AgentMemory')
        .insert({
          agent_id: agent.id,
          key: 'system_prompt',
          value: 'I am a helpful AI assistant.',
          type: 'string',
          embedding: [], // Empty array for now
          metadata: {
            importance: 10,
            category: 'system',
            goals: ['Learn about my user and be helpful']
          },
        });

      if (memoryError) {
        console.warn('Failed to create initial agent memory:', memoryError.message);
        // Don't fail the agent creation if memory creation fails
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
