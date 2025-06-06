/**
 * API route for managing integrations
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
 * List integrations for the current user
 * GET /api/plugin-engine/integrations
 */
export async function GET() {
  try {
    // Get the user ID from the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get integrations from Supabase
    const { data: integrations, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('userId', userId);
    
    if (error) {
      throw new Error(`Failed to get integrations: ${error.message}`);
    }
    
    // Remove sensitive data
    const sanitizedIntegrations = integrations.map(integration => ({
      id: integration.id,
      toolName: integration.toolName,
      status: integration.status,
      expiresAt: integration.expiresAt,
      scopes: integration.scopes,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt
    }));
    
    return NextResponse.json({ integrations: sanitizedIntegrations });
  } catch (error) {
    console.error('Error getting integrations:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to get integrations: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Connect a new integration
 * POST /api/plugin-engine/integrations
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Validate the request
    const requiredFields = ['toolName', 'accessToken', 'expiresAt'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
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
    
    // Store the integration
    const integration = await integrationManager.storeIntegration({
      userId,
      toolName: body.toolName,
      accessToken: body.accessToken,
      refreshToken: body.refreshToken || null,
      expiresAt: body.expiresAt,
      status: 'active',
      scopes: body.scopes || [],
      metadata: body.metadata || {}
    });
    
    // Return a sanitized version of the integration
    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        toolName: integration.toolName,
        status: integration.status,
        expiresAt: integration.expiresAt,
        scopes: integration.scopes,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt
      }
    });
  } catch (error) {
    console.error('Error connecting integration:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to connect integration: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Disconnect an integration
 * DELETE /api/plugin-engine/integrations
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Validate the request
    if (!body.toolName) {
      return NextResponse.json(
        { error: 'Missing required field: toolName' },
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
    
    // Disconnect the integration
    await integrationManager.disconnect(userId, body.toolName);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to disconnect integration: ${errorMessage}` },
      { status: 500 }
    );
  }
}
