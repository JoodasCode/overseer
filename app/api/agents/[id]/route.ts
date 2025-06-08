import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase-client';
import { ErrorHandler } from '@/lib/error-handler';

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
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from auth context
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }

    const agentId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agentId)) {
      return NextResponse.json(
        { error: 'Invalid agent ID format' },
        { status: 400 }
      );
    }

    // Query agent with memory using Prisma for better type safety
    try {
      const agent = await prisma.agent.findUnique({
        where: {
          id: agentId,
          user_id: user.id,
        },
        include: {
          agentMemory: true,
        },
      });
      
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
    const agentId = params?.id;
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
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from auth context
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }

    const agentId = params.id;
    
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
    
    // Update agent using Prisma
    try {
      // First check if agent exists and belongs to user
      const existingAgent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          user_id: user.id,
        },
      });
      
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
      const updatedAgent = await prisma.agent.update({
        where: {
          id: agentId,
        },
        data: updateData,
        include: {
          agentMemory: true,
        },
      });
      
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
    const agentId = params?.id;
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
 * Delete a specific agent
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from auth context
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }

    const agentId = params.id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agentId)) {
      return NextResponse.json(
        { error: 'Invalid agent ID format' },
        { status: 400 }
      );
    }
    
    try {
      // First check if agent exists and belongs to user
      const existingAgent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          user_id: user.id,
        },
      });
      
      if (!existingAgent) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'agent_delete_not_found',
            errorMessage: 'Agent not found or permission denied for deletion',
            userId: user.id,
            payload: { agentId }
          })
        );
        return NextResponse.json(
          { error: 'Agent not found or you do not have permission to delete it' },
          { status: 404 }
        );
      }
      
      // Delete agent (agent_memory will be cascade deleted due to schema relation)
      await prisma.agent.delete({
        where: {
          id: agentId,
        },
      });
      
      return NextResponse.json(
        { message: 'Agent deleted successfully' },
        { status: 200 }
      );
    } catch (dbError) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'agent_delete_db_error',
          errorMessage: 'Database error deleting agent',
          userId: user.id,
          agentId,
          payload: { error: (dbError as Error).message }
        })
      );
      return NextResponse.json(
        { error: 'Failed to delete agent', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    const agentId = params?.id;
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'agent_delete_error',
        errorMessage: 'Error deleting agent',
        payload: { error: (error as Error).message, agentId }
      })
    );
    return NextResponse.json(
      { error: 'Failed to delete agent', details: (error as Error).message },
      { status: 500 }
    );
  }
}
