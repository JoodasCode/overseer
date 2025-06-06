import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

/**
 * GET /api/tasks/[id]
 * Retrieve a specific task by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const taskId = params.id;

    // Query task with agent details
    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        agents (id, name, avatar)
      `)
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === '22P02' ? 400 : 500 }
      );
    }
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update a specific task
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const taskId = params.id;
    
    // Parse request body
    const body = await req.json();
    const { title, details, status, priority, agent_id, due_date, xp_reward } = body;
    
    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (details !== undefined) updateData.details = details;
    if (status !== undefined) {
      // Validate status
      if (!['pending', 'in-progress', 'waiting', 'completed'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        );
      }
      updateData.status = status;
      
      // If status is completed, set completed_at timestamp
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }
    }
    
    if (priority !== undefined) {
      // Validate priority
      if (!['low', 'medium', 'high'].includes(priority)) {
        return NextResponse.json(
          { error: 'Invalid priority value' },
          { status: 400 }
        );
      }
      updateData.priority = priority;
    }
    
    if (agent_id !== undefined) {
      // If agent_id is null, allow removing assignment
      if (agent_id === null) {
        updateData.agent_id = null;
      } else {
        // Verify agent belongs to user
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
        updateData.agent_id = agent_id;
      }
    }
    
    if (due_date !== undefined) updateData.due_date = due_date;
    if (xp_reward !== undefined) updateData.xp_reward = xp_reward;
    
    // Update task
    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('user_id', user.id)
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
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // If task was completed and has an agent, update agent's stats
    if (status === 'completed' && task.agent_id) {
      await supabase
        .from('agents')
        .update({
          total_tasks_completed: supabase.rpc('increment', { inc: 1 }),
          xp: supabase.rpc('increment', { inc: task.xp_reward || 0 }),
        })
        .eq('id', task.agent_id);
    }
    
    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a specific task
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const taskId = params.id;
    
    // Delete task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
