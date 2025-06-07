import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/api-utils/auth';
import { isValidUUID, createErrorResponse } from '@/lib/api-utils/validation';
import { WorkflowExecutionStatus } from '@prisma/client';

/**
 * GET /api/workflows/[id]/executions/[executionId]
 * Retrieve a specific workflow execution
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; executionId: string } }
) {
  try {
    // Authenticate user
    const { user, errorResponse } = await authenticate(req);
    if (errorResponse) return errorResponse;
    
    const workflowId = params.id;
    const executionId = params.executionId;
    
    // Validate UUID format
    if (!isValidUUID(workflowId)) {
      return createErrorResponse('Invalid workflow ID format', 400);
    }
    
    if (!isValidUUID(executionId)) {
      return createErrorResponse('Invalid execution ID format', 400);
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
      
      // Get execution
      const execution = await prisma.workflowExecution.findUnique({
        where: {
          id: executionId,
          workflow_id: workflowId // Ensure execution belongs to the specified workflow
        }
      });
      
      if (!execution) {
        return createErrorResponse('Workflow execution not found', 404);
      }
      
      return NextResponse.json({ execution });
    } catch (dbError) {
      console.error('Database error fetching workflow execution:', dbError);
      return createErrorResponse(
        'Failed to fetch workflow execution', 
        500, 
        (dbError as Error).message
      );
    }
  } catch (error) {
    console.error('Error in workflow execution API:', error);
    return createErrorResponse(
      'Failed to process request', 
      500, 
      (error as Error).message
    );
  }
}

/**
 * PATCH /api/workflows/[id]/executions/[executionId]
 * Update a specific workflow execution (e.g., cancel it)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; executionId: string } }
) {
  try {
    // Authenticate user
    const { user, errorResponse } = await authenticate(req);
    if (errorResponse) return errorResponse;
    
    const workflowId = params.id;
    const executionId = params.executionId;
    
    // Validate UUID format
    if (!isValidUUID(workflowId)) {
      return createErrorResponse('Invalid workflow ID format', 400);
    }
    
    if (!isValidUUID(executionId)) {
      return createErrorResponse('Invalid execution ID format', 400);
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
    if (action !== 'cancel') {
      return createErrorResponse('Invalid action. Supported actions: cancel', 400);
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
      
      // Get execution
      const execution = await prisma.workflowExecution.findUnique({
        where: {
          id: executionId,
          workflow_id: workflowId // Ensure execution belongs to the specified workflow
        }
      });
      
      if (!execution) {
        return createErrorResponse('Workflow execution not found', 404);
      }
      
      // Check if execution can be cancelled
      if (execution.status !== WorkflowExecutionStatus.RUNNING && execution.status !== WorkflowExecutionStatus.PENDING) {
        return createErrorResponse(
          `Cannot cancel execution with status: ${execution.status}`, 
          400
        );
      }
      
      // Create cancellation message
      const cancellationMessage = `Execution cancelled by user at ${new Date().toISOString()}`;
      
      // Update execution with minimal fields
      const updatedExecution = await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: WorkflowExecutionStatus.CANCELLED,
          completed_at: new Date()
          // Note: We're not updating logs or output as they don't exist in the schema
          // In a real implementation, you'd store this in a field that does exist
        }
      });
      
      return NextResponse.json({ execution: updatedExecution });
    } catch (dbError) {
      console.error('Database error updating workflow execution:', dbError);
      return createErrorResponse(
        'Failed to update workflow execution', 
        500, 
        (dbError as Error).message
      );
    }
  } catch (error) {
    console.error('Error in workflow execution API:', error);
    return createErrorResponse(
      'Failed to process request', 
      500, 
      (error as Error).message
    );
  }
}

/**
 * OPTIONS /api/workflows/[id]/executions/[executionId]
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
