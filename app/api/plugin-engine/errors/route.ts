/**
 * API route for managing error logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ErrorHandler } from '@/lib/plugin-engine';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize error handler
const errorHandler = ErrorHandler.getInstance();

/**
 * Get error logs for an agent
 * GET /api/plugin-engine/errors?agentId=abc&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    
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
    
    // Get errors for the agent
    const errors = await errorHandler.getAgentErrors(agentId, limit);
    
    return NextResponse.json({ errors });
  } catch (error) {
    console.error('Error getting error logs:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to get error logs: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Resolve an error
 * PATCH /api/plugin-engine/errors
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Validate the request
    if (!body.errorId) {
      return NextResponse.json(
        { error: 'Missing required field: errorId' },
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
    
    // Resolve the error
    await errorHandler.resolveError(body.errorId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resolving error log:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to resolve error log: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Log a new error
 * POST /api/plugin-engine/errors
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Validate the request
    if (!body.agentId || !body.tool || !body.action || !body.errorCode || !body.errorMessage) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, tool, action, errorCode, errorMessage' },
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
    
    // Create error log
    const errorId = await errorHandler.logError({
      agentId: body.agentId,
      userId: session.user.id,
      tool: body.tool,
      action: body.action,
      errorCode: body.errorCode,
      errorMessage: body.errorMessage,
      payload: body.payload || {},
      timestamp: new Date().toISOString(),
      resolved: false
    });
    
    // Get fallback message
    const fallbackMessage = errorHandler.getFallbackMessage(body.tool, body.agentId);
    
    return NextResponse.json({
      success: true,
      errorId,
      fallbackMessage
    });
  } catch (error) {
    console.error('Error logging error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to log error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
