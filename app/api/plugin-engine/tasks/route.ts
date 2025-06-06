/**
 * API route for managing scheduled tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Scheduler } from '@/lib/plugin-engine';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize scheduler
const scheduler = Scheduler.getInstance();

/**
 * List scheduled tasks for an agent
 * GET /api/plugin-engine/tasks?agentId=abc&status=scheduled
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');
    const status = searchParams.get('status');
    
    // Validate the request
    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: agentId' },
        { status: 400 }
      );
    }
    
    // Get the user ID from the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get tasks for the agent
    const tasks = await scheduler.getAgentTasks(agentId, status || undefined);
    
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error getting scheduled tasks:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to get scheduled tasks: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Cancel a scheduled task
 * DELETE /api/plugin-engine/tasks
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Validate the request
    if (!body.taskId) {
      return NextResponse.json(
        { error: 'Missing required field: taskId' },
        { status: 400 }
      );
    }
    
    // Get the user ID from the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Cancel the task
    const success = await scheduler.cancelTask(body.taskId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Task not found or already completed' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error canceling scheduled task:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to cancel scheduled task: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Retry a failed task
 * POST /api/plugin-engine/tasks
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Validate the request
    if (!body.taskId) {
      return NextResponse.json(
        { error: 'Missing required field: taskId' },
        { status: 400 }
      );
    }
    
    // Get the user ID from the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Retry the task
    const success = await scheduler.retryTask(body.taskId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Task not found or not failed' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error retrying scheduled task:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to retry scheduled task: ${errorMessage}` },
      { status: 500 }
    );
  }
}
