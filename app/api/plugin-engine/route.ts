/**
 * Main API route for the Plugin Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPluginEngine, TaskIntent } from '@/lib/plugin-engine';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize plugin engine
const pluginEngine = createPluginEngine();

/**
 * Process a task intent
 * POST /api/plugin-engine
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Validate the request
    if (!body.agentId || !body.intent || !body.tool) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, intent, tool' },
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
    
    const userId = session.user.id;
    
    // Create the task intent
    const taskIntent: TaskIntent = {
      agentId: body.agentId,
      intent: body.intent,
      tool: body.tool,
      context: body.context || {},
      userId,
      scheduledTime: body.scheduledTime
    };
    
    // Process the intent
    const result = await pluginEngine.processIntent(taskIntent);
    
    // Return the result
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing task intent:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to process task intent: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Get available tools
 * GET /api/plugin-engine
 */
export async function GET() {
  try {
    // Get the list of registered adapters
    const adapters = pluginEngine.listAdapters();
    
    // Get metadata for each adapter
    const tools = adapters.map(tool => {
      const adapter = pluginEngine.getAdapter(tool);
      return adapter?.getMetadata();
    }).filter(Boolean);
    
    return NextResponse.json({ tools });
  } catch (error) {
    console.error('Error getting available tools:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to get available tools: ${errorMessage}` },
      { status: 500 }
    );
  }
}
