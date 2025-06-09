/**
 * OAuth Authorization Route
 * Generates OAuth authorization URLs for tool connections
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { universalIntegrationsCore } from '@/lib/integrations/universal-integrations-core';

// Initialize Supabase client with service role key for JWT validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/integrations/oauth/authorize?tool=gmail
 * 
 * Query params:
 * - tool: The integration tool to authorize (gmail, slack, notion)
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

    if (!tool) {
      return NextResponse.json(
        { error: 'Missing required parameter: tool' },
        { status: 400 }
      );
    }

    // Generate OAuth URL via Universal Integrations Core
    const authUrl = universalIntegrationsCore.generateAuthUrl(tool, user.id);

    if (!authUrl) {
      return NextResponse.json(
        { error: `OAuth not supported for tool: ${tool}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        tool,
        userId: user.id
      }
    });

  } catch (error) {
    console.error('OAuth authorization error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 