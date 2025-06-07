import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/api-utils/auth';
import { isValidUUID, createErrorResponse } from '@/lib/api-utils/validation';
import { WorkflowStatus, WorkflowExecutionStatus } from '@prisma/client';

/**
 * GET /api/workflows/[id]/executions
 * Retrieve all executions for a specific workflow
 */
export async function GET(
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
    
    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const status = url.searchParams.get('status') || undefined;
    
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
      
      // Build where clause
      const where: any = {
        workflow_id: workflowId
      };
      
      // Add status filter if specified
      if (status) {
        where.status = status;
      }
      
      // Get total count
      const totalCount = await prisma.workflowExecution.count({ where });
      
      // Get executions
      const executions = await prisma.workflowExecution.findMany({
        where,
        orderBy: {
          started_at: 'desc'
        },
        skip: offset,
        take: limit
      });
      
      return NextResponse.json({
        executions,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      });
    } catch (dbError) {
      console.error('Database error fetching workflow executions:', dbError);
      return createErrorResponse(
        'Failed to fetch workflow executions', 
        500, 
        (dbError as Error).message
      );
    }
  } catch (error) {
    console.error('Error in workflow executions API:', error);
    return createErrorResponse(
      'Failed to process request', 
      500, 
      (error as Error).message
    );
  }
}

/**
 * POST /api/workflows/[id]/executions
 * Start a new workflow execution
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
      // Body is optional for this endpoint
      body = {};
    }
    
    const { input = {} } = body;
    
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
      
      // Check if workflow is active
      if (workflow.status !== WorkflowStatus.ACTIVE) {
        return createErrorResponse(
          'Cannot execute workflow that is not active', 
          400,
          `Current status: ${workflow.status}`
        );
      }
      
      // Create execution record
      const execution = await prisma.workflowExecution.create({
        data: {
          workflow_id: workflowId,
          status: WorkflowExecutionStatus.RUNNING,
          trigger_data: input,
          user_id: user!.id
        }
      });
      
      // Start workflow execution asynchronously
      // This would typically be handled by a background job or queue
      // For now, we'll just update the execution record directly
      
      // In a real implementation, this would be where we'd trigger the workflow engine
      setTimeout(async () => {
        try {
          // Simulate workflow execution
          const config = workflow.config as Record<string, any>;
          const nodes = config.nodes || [];
          
          const logs = [`Workflow execution started at ${new Date().toISOString()}`];
          
          // Process each node (simplified simulation)
          for (const node of nodes) {
            logs.push(`Processing node: ${node.id || 'unknown'}`);
          }
          
          logs.push(`Workflow execution completed at ${new Date().toISOString()}`);
          
          // Update execution record
          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
              status: WorkflowExecutionStatus.COMPLETED,
              completed_at: new Date(),
              result: { success: true, message: 'Workflow executed successfully' }
              // Note: logs field is not in the schema
            }
          });
        } catch (execError) {
          console.error('Error executing workflow:', execError);
          
          // Update execution record with error
          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
              status: WorkflowExecutionStatus.FAILED,
              completed_at: new Date(),
              error: (execError as Error).message
              // Note: logs field is not in the schema
            }
          });
        }
      }, 100); // Small delay to simulate async execution
      
      return NextResponse.json({ execution }, { status: 201 });
    } catch (dbError) {
      console.error('Database error creating workflow execution:', dbError);
      return createErrorResponse(
        'Failed to create workflow execution', 
        500, 
        (dbError as Error).message
      );
    }
  } catch (error) {
    console.error('Error in workflow executions API:', error);
    return createErrorResponse(
      'Failed to process request', 
      500, 
      (error as Error).message
    );
  }
}

/**
 * OPTIONS /api/workflows/[id]/executions
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
