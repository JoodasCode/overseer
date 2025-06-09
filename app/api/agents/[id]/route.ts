import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ErrorHandler } from '@/lib/error-handler';

// Create Supabase client for server-side operations  
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AgentUpdateRequest {
  name?: string;
  description?: string;
  avatar_url?: string;
  tools?: Record<string, any>;
  preferences?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * GET /api/agents/[id]
 * Retrieve a specific agent by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user from the Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Auth session missing!' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const agentId = resolvedParams.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agentId)) {
      return NextResponse.json(
        { error: 'Invalid agent ID format' },
        { status: 400 }
      );
    }

    // Query agent using Supabase REST API
    try {
      const { data: agent, error: agentError } = await supabase
        .from('Agent')
        .select('*')
        .eq('id', agentId)
        .eq('user_id', user.id)
        .single();
      
      if (agentError && agentError.code !== 'PGRST116') {
        throw new Error(agentError.message);
      }
      
      if (!agent) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'agent_detail_not_found',
            errorMessage: 'Agent not found',
            userId: user.id,
            payload: { agentId }
          })
        );
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ agent });
    } catch (dbError) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'agent_detail_db_error',
          errorMessage: 'Database error fetching agent',
          userId: user.id,
          agentId,
          payload: { error: (dbError as Error).message }
        })
      );
      return NextResponse.json(
        { error: 'Failed to fetch agent', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    const resolvedParams = await params;
    const agentId = resolvedParams?.id;
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'agent_detail_error',
        errorMessage: 'Error fetching agent',
        payload: { error: (error as Error).message, agentId }
      })
    );
    return NextResponse.json(
      { error: 'Failed to fetch agent', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agents/[id]
 * Update a specific agent
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user from the Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Auth session missing!' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const agentId = resolvedParams.id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agentId)) {
      return NextResponse.json(
        { error: 'Invalid agent ID format' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await req.json() as AgentUpdateRequest;
    
    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url;
    if (body.tools !== undefined) updateData.tools = body.tools;
    if (body.preferences !== undefined) updateData.preferences = body.preferences;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    
    // Update agent using Supabase REST API
    try {
      // First check if agent exists and belongs to user
      const { data: existingAgent, error: checkError } = await supabase
        .from('Agent')
        .select('*')
        .eq('id', agentId)
        .eq('user_id', user.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'agent_update_check_error',
            errorMessage: 'Error checking agent existence for update',
            userId: user.id,
            payload: { agentId, error: checkError.message }
          })
        );
        return NextResponse.json(
          { error: 'Failed to verify agent ownership' },
          { status: 500 }
        );
      }
      
      if (!existingAgent) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'agent_update_not_found',
            errorMessage: 'Agent not found or permission denied for update',
            userId: user.id,
            payload: { agentId }
          })
        );
        return NextResponse.json(
          { error: 'Agent not found or you do not have permission to update it' },
          { status: 404 }
        );
      }
      
      // Update the agent
      const { data: updatedAgent, error: updateError } = await supabase
        .from('Agent')
        .update(updateData)
        .eq('id', agentId)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }
      
      return NextResponse.json({ agent: updatedAgent });
    } catch (dbError) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'agent_update_db_error',
          errorMessage: 'Database error updating agent',
          userId: user.id,
          agentId,
          payload: { error: (dbError as Error).message, updateData }
        })
      );
      return NextResponse.json(
        { error: 'Failed to update agent', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    const resolvedParams = await params;
    const agentId = resolvedParams?.id;
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'agent_update_error',
        errorMessage: 'Error updating agent',
        payload: { error: (error as Error).message, agentId }
      })
    );
    return NextResponse.json(
      { error: 'Failed to update agent', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents/[id]
 * Delete a specific agent - 100% Supabase REST API implementation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const agentId = resolvedParams.id;

  try {
    // Extract user ID from Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agentId)) {
      return NextResponse.json(
        { error: 'Invalid agent ID format' },
        { status: 400 }
      );
    }

    // 100% Supabase REST API - No Prisma dependencies
    
    // Check if agent exists and belongs to user
    const { data: existingAgent, error: checkError } = await supabase
      .from('Agent')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'agent_delete_check_error',
          errorMessage: 'Error checking agent existence',
          userId,
          agentId,
          payload: { error: checkError.message }
        })
      );
      return NextResponse.json(
        { error: 'Failed to verify agent ownership' },
        { status: 500 }
      );
    }

    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found or access denied' },
        { status: 404 }
      );
    }

    // Delete via Supabase REST API - Fixed table name consistency
    const { error: deleteError } = await supabase
      .from('Agent')
      .delete()
      .eq('id', agentId)
      .eq('user_id', userId);

    if (deleteError) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'agent_delete_db_error',
          errorMessage: 'Database error deleting agent via Supabase',
          userId,
          agentId,
          payload: { error: deleteError.message }
        })
      );
      return NextResponse.json(
        { error: 'Failed to delete agent' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Agent deleted successfully',
        agentId 
      },
      { status: 200 }
    );

  } catch (error) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'agent_delete_error',
        errorMessage: 'Error deleting agent',
        payload: { error: (error as Error).message, agentId }
      })
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
