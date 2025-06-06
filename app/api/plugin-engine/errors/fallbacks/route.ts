/**
 * API route for managing fallback messages
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
 * Get fallback message for a tool
 * GET /api/plugin-engine/errors/fallbacks?tool=gmail&agentId=abc
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const tool = searchParams.get('tool');
    const agentId = searchParams.get('agentId');
    
    // Validate the request
    if (!tool) {
      return NextResponse.json(
        { error: 'Missing required query parameter: tool' },
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
    
    // Get fallback message
    const message = errorHandler.getFallbackMessage(tool, agentId || undefined);
    
    return NextResponse.json({ 
      tool,
      agentId: agentId || null,
      message
    });
  } catch (error) {
    console.error('Error getting fallback message:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to get fallback message: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Set a fallback message for a tool
 * POST /api/plugin-engine/errors/fallbacks
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Validate the request
    if (!body.tool || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: tool, message' },
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
    
    // Set fallback message
    errorHandler.setFallbackMessage(body.tool, body.message, body.agentId || undefined);
    
    // Store in database for persistence
    const { error: dbError } = await supabase
      .from('fallback_messages')
      .upsert({
        tool: body.tool,
        agentId: body.agentId || null,
        message: body.message,
        updatedAt: new Date().toISOString(),
        updatedBy: session.user.id
      }, {
        onConflict: 'tool,agentId'
      });
    
    if (dbError) {
      console.error('Failed to store fallback message:', dbError);
      // Continue anyway since the message is set in memory
    }
    
    return NextResponse.json({
      success: true,
      tool: body.tool,
      agentId: body.agentId || null,
      message: body.message
    });
  } catch (error) {
    console.error('Error setting fallback message:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to set fallback message: ${errorMessage}` },
      { status: 500 }
    );
  }
}
