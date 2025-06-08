import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/api-utils/auth';
import { isValidUUID, createErrorResponse } from '@/lib/api-utils/validation';
import { WorkflowStatus } from '@prisma/client';
import { scheduleWorkflow, cancelScheduledWorkflow, pauseScheduledWorkflow, resumeScheduledWorkflow } from '@/lib/workflow/scheduler';
import { Workflow } from '@/lib/workflow/types';

/**
 * POST /api/workflows/[id]/schedule
 * Schedule a workflow to run at specified intervals
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const { user, errorResponse } = await authenticate(req);
    if (errorResponse) return errorResponse;
    
    const workflowId = params.id;
    
    // Validate UUID format
    if (!isValidUUID(workflowId)) {
      return createErrorResponse('Invalid workflow ID format', 400);
    }
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }
    
    const { cron, timezone, startDate, endDate } = body;
    
    // Validate required fields
    if (!cron) {
      return createErrorResponse('Missing required field: cron', 400);
    }
    
    try {
      // Check if workflow exists and belongs to user
      const dbWorkflow = await prisma.workflow.findUnique({
        where: {
          id: workflowId,
          user_id: user!.id // Ensure user owns this workflow
        }
      });
      
      if (!dbWorkflow) {
        return createErrorResponse('Workflow not found', 404);
      }
      
      // Check if workflow is active
      if (dbWorkflow.status !== WorkflowStatus.ACTIVE) {
        return createErrorResponse(
          'Cannot schedule workflow that is not active', 
          400,
          `Current status: ${dbWorkflow.status}`
        );
      }
      
      // Convert database workflow to our Workflow type
      const workflow: Workflow = {
        id: dbWorkflow.id,
        name: dbWorkflow.name,
        description: dbWorkflow.description || undefined,
        nodes: (dbWorkflow.config as any)?.nodes || [],
        agent_id: (dbWorkflow.config as any)?.agent_id || '',
        user_id: dbWorkflow.user_id,
        status: dbWorkflow.status,
        config: dbWorkflow.config as Record<string, any>,
        triggers: dbWorkflow.triggers as Record<string, any>,
        actions: dbWorkflow.actions as Record<string, any>,
        created_at: dbWorkflow.created_at,
        updated_at: dbWorkflow.updated_at
      };
      
      // Schedule the workflow
      await scheduleWorkflow(workflow, {
        cron,
        timezone,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      });
      
      return NextResponse.json({ 
        message: 'Workflow scheduled successfully',
        schedule: {
          cron,
          timezone,
          startDate,
          endDate
        }
      });
    } catch (dbError) {
      console.error('Database error scheduling workflow:', dbError);
      return createErrorResponse(
        'Failed to schedule workflow', 
        500, 
        (dbError as Error).message
      );
    }
  } catch (error) {
    console.error('Error in workflow scheduling API:', error);
    return createErrorResponse(
      'Failed to process request', 
      500, 
      (error as Error).message
    );
  }
}

/**
 * DELETE /api/workflows/[id]/schedule
 * Cancel a scheduled workflow
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const { user, errorResponse } = await authenticate(req);
    if (errorResponse) return errorResponse;
    
    const workflowId = params.id;
    
    // Validate UUID format
    if (!isValidUUID(workflowId)) {
      return createErrorResponse('Invalid workflow ID format', 400);
    }
    
    try {
      // Check if workflow exists and belongs to user
      const workflow = await prisma.workflow.findUnique({
        where: {
          id: workflowId,
          user_id: user!.id // Ensure user owns this workflow
        }
      });
      
      if (!workflow) {
        return createErrorResponse('Workflow not found', 404);
      }
      
      // Cancel the scheduled workflow
      await cancelScheduledWorkflow(workflowId);
      
      return NextResponse.json({ 
        message: 'Workflow schedule cancelled successfully'
      });
    } catch (dbError) {
      console.error('Database error cancelling workflow schedule:', dbError);
      return createErrorResponse(
        'Failed to cancel workflow schedule', 
        500, 
        (dbError as Error).message
      );
    }
  } catch (error) {
    console.error('Error in workflow scheduling API:', error);
    return createErrorResponse(
      'Failed to process request', 
      500, 
      (error as Error).message
    );
  }
}

/**
 * PATCH /api/workflows/[id]/schedule
 * Pause or resume a scheduled workflow
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const { user, errorResponse } = await authenticate(req);
    if (errorResponse) return errorResponse;
    
    const workflowId = params.id;
    
    // Validate UUID format
    if (!isValidUUID(workflowId)) {
      return createErrorResponse('Invalid workflow ID format', 400);
    }
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }
    
    const { action } = body;
    
    // Validate action
    if (!['pause', 'resume'].includes(action)) {
      return createErrorResponse('Invalid action. Supported actions: pause, resume', 400);
    }
    
    try {
      // Check if workflow exists and belongs to user
      const workflow = await prisma.workflow.findUnique({
        where: {
          id: workflowId,
          user_id: user!.id // Ensure user owns this workflow
        }
      });
      
      if (!workflow) {
        return createErrorResponse('Workflow not found', 404);
      }
      
      // Perform the requested action
      if (action === 'pause') {
        await pauseScheduledWorkflow(workflowId);
      } else {
        await resumeScheduledWorkflow(workflowId);
      }
      
      return NextResponse.json({ 
        message: `Workflow schedule ${action}d successfully`
      });
    } catch (dbError) {
      console.error('Database error updating workflow schedule:', dbError);
      return createErrorResponse(
        'Failed to update workflow schedule', 
        500, 
        (dbError as Error).message
      );
    }
  } catch (error) {
    console.error('Error in workflow scheduling API:', error);
    return createErrorResponse(
      'Failed to process request', 
      500, 
      (error as Error).message
    );
  }
} 