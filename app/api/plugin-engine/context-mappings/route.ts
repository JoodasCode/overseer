/**
 * API Route: /api/plugin-engine/context-mappings
 * 
 * Handles CRUD operations for context mappings
 * - GET: List context mappings for an agent and tool
 * - POST: Create a new context mapping
 * - PUT: Update an existing context mapping
 * - DELETE: Delete a context mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ContextMapper } from '@/lib/plugin-engine';

// Initialize Supabase client for auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get the context mapper instance
const contextMapper = ContextMapper.getInstance();

/**
 * GET: List context mappings for an agent and tool
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');
    const tool = searchParams.get('tool');
    
    // Validate required parameters
    if (!agentId || !tool) {
      return NextResponse.json(
        { error: 'Missing required parameters: agentId and tool' },
        { status: 400 }
      );
    }
    
    // Verify user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get mappings
    const mappings = await contextMapper.listMappings(agentId, tool);
    
    // Return mappings with sensitive data removed
    const sanitizedMappings = mappings.map(mapping => ({
      ...mapping,
      // Remove any sensitive fields if needed
    }));
    
    return NextResponse.json({ mappings: sanitizedMappings });
  } catch (error) {
    console.error('Error listing context mappings:', error);
    return NextResponse.json(
      { error: 'Failed to list context mappings' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new context mapping
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { agentId, tool, contextKey, externalId, friendlyName, metadata, expiresAt } = body;
    
    // Validate required fields
    if (!agentId || !tool || !contextKey || !externalId) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, tool, contextKey, externalId' },
        { status: 400 }
      );
    }
    
    // Verify user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Create mapping
    const userId = session.user.id;
    const mappingId = await contextMapper.createMapping({
      agentId,
      userId,
      tool,
      contextKey,
      externalId,
      friendlyName,
      metadata,
      expiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ id: mappingId, success: true });
  } catch (error) {
    console.error('Error creating context mapping:', error);
    return NextResponse.json(
      { error: 'Failed to create context mapping' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update an existing context mapping
 */
export async function PUT(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { id, externalId, friendlyName, metadata, expiresAt } = body;
    
    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }
    
    // Verify user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Update mapping
    const success = await contextMapper.updateMapping(id, {
      externalId,
      friendlyName,
      metadata,
      expiresAt,
      updatedAt: new Date().toISOString()
    });
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update context mapping' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating context mapping:', error);
    return NextResponse.json(
      { error: 'Failed to update context mapping' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a context mapping
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    // Validate required parameters
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }
    
    // Verify user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Delete mapping
    const success = await contextMapper.deleteMapping(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete context mapping' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting context mapping:', error);
    return NextResponse.json(
      { error: 'Failed to delete context mapping' },
      { status: 500 }
    );
  }
}
