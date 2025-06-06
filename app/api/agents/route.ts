import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

/**
 * GET /api/agents
 * Retrieve all agents for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Get user ID from auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Query agents table
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { name, role, avatar, persona, tools } = body;
    
    // Validate required fields
    if (!name || !role || !avatar || !persona) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Insert new agent
    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        name,
        role,
        avatar,
        persona,
        tools: tools || [],
        user_id: user.id,
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Create initial agent memory
    const { error: memoryError } = await supabase
      .from('agent_memory')
      .insert({
        agent_id: agent.id,
        weekly_goals: 'Learn about my user and be helpful',
      });
    
    if (memoryError) {
      console.error('Error creating agent memory:', memoryError);
    }
    
    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
