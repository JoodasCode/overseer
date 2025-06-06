import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

/**
 * GET /api/tasks
 * Retrieve all tasks for the authenticated user
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

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const agentId = url.searchParams.get('agent_id');
    
    // Build query
    let query = supabase
      .from('tasks')
      .select(`
        *,
        agents (id, name, avatar)
      `)
      .eq('user_id', user.id);
    
    // Apply filters if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    if (priority) {
      query = query.eq('priority', priority);
    }
    
    if (agentId) {
      query = query.eq('agent_id', agentId);
    }
    
    // Execute query with sorting
    const { data: tasks, error } = await query
      .order('due_date', { ascending: true, nullsLast: true })
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task
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
    const { title, details, priority, agent_id, due_date, xp_reward } = body;
    
    // Validate required fields
    if (!title || !details || !priority) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate priority
    if (!['low', 'medium', 'high'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority value' },
        { status: 400 }
      );
    }
    
    // If agent_id is provided, verify it belongs to the user
    if (agent_id) {
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('id', agent_id)
        .eq('user_id', user.id)
        .single();
      
      if (agentError || !agent) {
        return NextResponse.json(
          { error: 'Invalid agent ID' },
          { status: 400 }
        );
      }
    }
    
    // Insert new task
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        details,
        priority,
        agent_id,
        user_id: user.id,
        due_date: due_date || null,
        xp_reward: xp_reward || Math.floor(Math.random() * 50) + 10, // Random XP between 10-60 if not specified
      })
      .select(`
        *,
        agents (id, name, avatar)
      `)
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
