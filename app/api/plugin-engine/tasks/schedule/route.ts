/**
 * API route for scheduling new tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PluginEngine } from '@/lib/plugin-engine';
import { TaskIntent } from '@/lib/plugin-engine/types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize plugin engine
const pluginEngine = PluginEngine.getInstance();

/**
 * Schedule a new task
 * POST /api/plugin-engine/tasks/schedule
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Validate the request
    if (!body.agentId || !body.tool || !body.intent || !body.scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, tool, intent, scheduledTime' },
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
    
    // Create task intent
    const taskIntent: TaskIntent = {
      agentId: body.agentId,
      userId: session.user.id,
      tool: body.tool,
      intent: body.intent,
      context: body.context || {},
      scheduledTime: body.scheduledTime
    };
    
    // Schedule the task
    const result = await pluginEngine.processIntent(taskIntent);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message, details: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: result.message,
      taskId: result.externalId,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Error scheduling task:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to schedule task: ${errorMessage}` },
      { status: 500 }
    );
  }
}
