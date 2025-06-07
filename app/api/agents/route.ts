import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase-client';

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
    // Get user ID from auth context
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
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
    
    // Query agents table using Prisma for better type safety
    try {
      // Get total count
      const totalCount = await prisma.agent.count({
        where: {
          user_id: user.id
        }
      });
      
      // Get agents with pagination and sorting
      const agents = await prisma.agent.findMany({
        where: {
          user_id: user.id
        },
        orderBy: {
          [sort]: order === 'asc' ? 'asc' : 'desc'
        },
        skip: offset,
        take: limit,
        include: {
          // Include related data if needed
          agentMemory: false // Set to true if you want to include memory
        }
      });
      
      return NextResponse.json({
        agents,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch agents', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching agents:', error);
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
    // Get user ID from auth context
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
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
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { name, description, avatar_url, tools, preferences, metadata } = body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      );
    }
    
    // Create new agent using Prisma for better type safety
    try {
      const agent = await prisma.agent.create({
        data: {
          user_id: user.id,
          name,
          description,
          avatar_url,
          tools: tools || {},
          preferences: preferences || {},
          metadata: metadata || {},
        },
      });
      
      // Create initial agent memory
      await prisma.agentMemory.create({
        data: {
          agent_id: agent.id,
          key: 'system_prompt',
          value: 'I am a helpful AI assistant.',
          type: 'string',
          metadata: {
            importance: 10,
            category: 'system',
            goals: ['Learn about my user and be helpful']
          },
        },
      });
      
      return NextResponse.json({ agent }, { status: 201 });
    } catch (dbError) {
      console.error('Database error creating agent:', dbError);
      return NextResponse.json(
        { error: 'Failed to create agent', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating agent:', error);
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
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
