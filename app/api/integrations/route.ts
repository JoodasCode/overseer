/**
 * Universal Integrations API Route
 * Main gateway for all third-party tool integrations
 * Routes requests through the Universal Integrations Core (UIC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { universalIntegrationsCore } from '@/lib/integrations/universal-integrations-core';

// Initialize Supabase client with service role key for JWT validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

/**
 * POST /api/integrations - Execute integration action
 * 
 * Body format:
 * {
 *   "tool": "gmail|slack|notion",
 *   "action": "send|fetch|connect|disconnect|isConnected",
 *   "params": { ... },
 *   "agentId": "optional-agent-id"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user via JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { tool, action, params = {}, agentId } = body;

    // Validate required fields
    if (!tool || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: tool, action' },
        { status: 400 }
      );
    }

    // Execute via Universal Integrations Core
    const result = await universalIntegrationsCore.executeIntegration({
      tool,
      action,
      params,
      agentId,
      userId: user.id
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });

  } catch (error) {
    console.error('Integration API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations - Get integration status
 * 
 * Query params:
 * - tool: specific tool to check (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user via JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const tool = searchParams.get('tool');

    // Get integration status
    const statuses = await universalIntegrationsCore.getIntegrationStatus(user.id, tool || undefined);

    return NextResponse.json({
      success: true,
      data: statuses
    });

  } catch (error) {
    console.error('Integration status API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations - Disconnect from integration
 * 
 * Body format:
 * {
 *   "tool": "gmail|slack|notion"
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user via JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { tool } = body;

    if (!tool) {
      return NextResponse.json(
        { error: 'Missing required field: tool' },
        { status: 400 }
      );
    }

    // Disconnect via Universal Integrations Core
    const result = await universalIntegrationsCore.executeIntegration({
      tool,
      action: 'disconnect',
      params: {},
      userId: user.id
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });

  } catch (error) {
    console.error('Integration disconnect API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 