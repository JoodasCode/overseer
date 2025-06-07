import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/workflows/[id]
 * Retrieve a specific workflow by ID
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

    const workflowId = params.id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(workflowId)) {
      return NextResponse.json(
        { error: 'Invalid workflow ID format' },
        { status: 400 }
      );
    }

    try {
      // Query workflow first to check if it exists
      const workflow = await prisma.workflow.findUnique({
        where: {
          id: workflowId
        }
      });
      
      if (!workflow) {
        return NextResponse.json(
          { error: 'Workflow not found' },
          { status: 404 }
        );
      }
      
      // Verify ownership
      if (workflow.user_id !== user.id) {
        return NextResponse.json(
          { error: 'You do not have permission to access this workflow' },
          { status: 403 }
        );
      }
      
      // Get workflow with executions
      const workflowWithExecutions = await prisma.workflow.findUnique({
        where: {
          id: workflowId
        },
        include: {
          executions: {
            orderBy: {
              started_at: 'desc'
            },
            take: 5
          }
        }
      });
      
      return NextResponse.json({ workflow: workflowWithExecutions });
    } catch (dbError) {
      console.error('Database error fetching workflow:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch workflow', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workflows/[id]
 * Update a specific workflow
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

    const workflowId = params.id;
    
    // Parse request body
    const body = await req.json();
    const { name, description, nodes, status } = body;
    
    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (nodes !== undefined) {
      // Validate nodes structure (basic validation)
      if (!Array.isArray(nodes) && typeof nodes !== 'object') {
        return NextResponse.json(
          { error: 'Invalid nodes structure' },
          { status: 400 }
        );
      }
      updateData.nodes = nodes;
    }
    
    if (status !== undefined) {
      // Validate status
      if (!['draft', 'active', 'paused'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(workflowId)) {
      return NextResponse.json(
        { error: 'Invalid workflow ID format' },
        { status: 400 }
      );
    }
    
    try {
      // Check if workflow exists and belongs to user
      const existingWorkflow = await prisma.workflow.findUnique({
        where: {
          id: workflowId
        }
      });
      
      if (!existingWorkflow) {
        return NextResponse.json(
          { error: 'Workflow not found' },
          { status: 404 }
        );
      }
      
      // Verify ownership
      if (existingWorkflow.user_id !== user.id) {
        return NextResponse.json(
          { error: 'You do not have permission to modify this workflow' },
          { status: 403 }
        );
      }
      
      // Update workflow with Prisma
      const workflow = await prisma.workflow.update({
        where: {
          id: workflowId
        },
        data: {
          ...updateData,
          updated_at: new Date()
        }
      });
      
      return NextResponse.json({ workflow });
    } catch (dbError) {
      console.error('Database error updating workflow:', dbError);
      return NextResponse.json(
        { error: 'Failed to update workflow', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/[id]
 * Delete a specific workflow
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

    const workflowId = params.id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(workflowId)) {
      return NextResponse.json(
        { error: 'Invalid workflow ID format' },
        { status: 400 }
      );
    }
    
    try {
      // Check if workflow exists
      const existingWorkflow = await prisma.workflow.findUnique({
        where: {
          id: workflowId
        }
      });
      
      if (!existingWorkflow) {
        return NextResponse.json(
          { error: 'Workflow not found' },
          { status: 404 }
        );
      }
      
      // Verify ownership
      if (existingWorkflow.user_id !== user.id) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this workflow' },
          { status: 403 }
        );
      }
      
      // Delete workflow with Prisma (workflow_executions will be cascade deleted via schema)
      await prisma.workflow.delete({
        where: {
          id: workflowId
        }
      });
      
      return NextResponse.json(
        { message: 'Workflow deleted successfully' },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('Database error deleting workflow:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete workflow', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow', details: (error as Error).message },
      { status: 500 }
    );
  }
}
