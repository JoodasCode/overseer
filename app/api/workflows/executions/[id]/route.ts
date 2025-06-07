import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/workflows/executions/[id]
 * Retrieve a specific workflow execution by ID
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

    const executionId = params.id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(executionId)) {
      return NextResponse.json(
        { error: 'Invalid execution ID format' },
        { status: 400 }
      );
    }

    try {
      // Query execution with workflow details using Prisma
      const execution = await prisma.workflowExecution.findUnique({
        where: {
          id: executionId
        },
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
              user_id: true
            }
          }
        }
      });
      
      if (!execution) {
        return NextResponse.json(
          { error: 'Workflow execution not found' },
          { status: 404 }
        );
      }
      
      // Verify user owns the workflow
      if (execution.workflow.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
      
      return NextResponse.json({ execution });
    } catch (dbError) {
      console.error('Database error fetching workflow execution:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch workflow execution', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching workflow execution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow execution', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/executions/[id]
 * Delete a specific workflow execution
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

    const executionId = params.id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(executionId)) {
      return NextResponse.json(
        { error: 'Invalid execution ID format' },
        { status: 400 }
      );
    }
    
    try {
      // First verify user owns the workflow using Prisma
      const execution = await prisma.workflowExecution.findUnique({
        where: {
          id: executionId
        },
        include: {
          workflow: {
            select: {
              id: true,
              user_id: true
            }
          }
        }
      });
      
      if (!execution) {
        return NextResponse.json(
          { error: 'Workflow execution not found' },
          { status: 404 }
        );
      }
      
      // Check ownership
      if (execution.workflow.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
      
      // Delete execution using Prisma
      await prisma.workflowExecution.delete({
        where: {
          id: executionId
        }
      });
      
      return NextResponse.json(
        { message: 'Workflow execution deleted successfully' },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('Database error deleting workflow execution:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete workflow execution', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting workflow execution:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow execution', details: (error as Error).message },
      { status: 500 }
    );
  }
}
