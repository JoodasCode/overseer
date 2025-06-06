/**
 * API route for checking integration status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { IntegrationManager } from '@/lib/plugin-engine';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize integration manager
const integrationManager = IntegrationManager.getInstance();

/**
 * Check status of an integration
 * GET /api/plugin-engine/integrations/status
 */
export async function GET(request: NextRequest) {
  try {
    // Get the query parameters
    const searchParams = request.nextUrl.searchParams;
    const toolName = searchParams.get('toolName');
    
    // Validate the request
    if (!toolName) {
      return NextResponse.json(
        { error: 'Missing required parameter: toolName' },
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
    
    // Check the integration status
    const status = await integrationManager.isConnected(userId, toolName);
    
    return NextResponse.json({
      connected: status.connected,
      expiresAt: status.expiresAt,
      scopes: status.scopes,
      error: status.error
    });
  } catch (error) {
    console.error('Error checking integration status:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to check integration status: ${errorMessage}` },
      { status: 500 }
    );
  }
}
