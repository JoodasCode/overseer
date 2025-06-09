/**
 * Integration Tools Discovery Route
 * Lists all available integration tools and their capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { universalIntegrationsCore } from '@/lib/integrations/universal-integrations-core';

// Initialize Supabase client with service role key for JWT validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/integrations/tools - Get all available integration tools
 * 
 * Returns a list of all tools with their capabilities, actions, and requirements
 */
export async function GET(request: NextRequest) {
  try {
    // Optional authentication (public endpoint for discovery)
    let userId: string | undefined;
    const authHeader = request.headers.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (!authError && user) {
        userId = user.id;
      }
    }

    // Get all available tools
    const tools = await universalIntegrationsCore.getAvailableTools();

    // If user is authenticated, also get their connection status
    let toolsWithStatus = tools;
    if (userId) {
      const statuses = await universalIntegrationsCore.getIntegrationStatus(userId);
      const statusMap = new Map(statuses.map(s => [s.tool, s.status]));
      
      toolsWithStatus = tools.map(tool => ({
        ...tool,
        connected: statusMap.get(tool.id) === 'connected'
      }));
    }

    return NextResponse.json({
      success: true,
      data: {
        tools: toolsWithStatus,
        totalCount: tools.length,
        authenticated: !!userId
      }
    });

  } catch (error) {
    console.error('Tools discovery error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 