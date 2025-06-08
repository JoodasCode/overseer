import { Workflow, WorkflowNode } from '@/lib/workflow/types';
import { createPluginEngine } from '@/lib/plugin-engine';
import { TaskIntent } from '@/lib/plugin-engine/types';
import { prisma } from '@/lib/prisma';
import { WorkflowStatus, WorkflowExecutionStatus } from '@prisma/client';
import WebSocketServer from '@/lib/websocket/server';

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

async function executeTaskWithRetry(
  taskIntent: any,
  retryCount = 0
): Promise<{ success: boolean; error?: string }> {
  try {
    const pluginEngine = await createPluginEngine() as any;
    await pluginEngine.executeTaskIntent(taskIntent);
    return { success: true };
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying task (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return executeTaskWithRetry(taskIntent, retryCount + 1);
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function executeWorkflow(workflow: Workflow): Promise<{ success: boolean; error?: string }> {
  const wsServer = WebSocketServer.getInstance();
  
  try {
    // Update workflow status to active
    await prisma.workflow.update({
      where: { id: workflow.id },
      data: { status: WorkflowStatus.ACTIVE }
    });

    wsServer.broadcastWorkflowUpdate({
      workflowId: workflow.id,
      status: WorkflowStatus.ACTIVE,
      timestamp: new Date()
    });

    // Execute each task in sequence
    for (let i = 0; i < workflow.nodes.length; i++) {
      const node = workflow.nodes[i];
      const progress = (i / workflow.nodes.length);
      
      wsServer.broadcastWorkflowProgress(
        workflow.id,
        progress,
        node.name
      );

      const taskIntent = {
        type: node.type,
        config: node.config,
        agent_id: workflow.agent_id,
        user_id: workflow.user_id
      };

      const result = await executeTaskWithRetry(taskIntent);
      
      if (!result.success) {
        wsServer.broadcastWorkflowError(workflow.id, result.error || 'Task execution failed');
        
        await prisma.workflow.update({
          where: { id: workflow.id },
          data: { status: WorkflowStatus.ARCHIVED }
        });

        wsServer.broadcastWorkflowUpdate({
          workflowId: workflow.id,
          status: WorkflowStatus.ARCHIVED,
          error: result.error,
          timestamp: new Date()
        });

        return { success: false, error: result.error || 'Task execution failed' };
      }
    }

    // Update workflow status to completed
    await prisma.workflow.update({
      where: { id: workflow.id },
      data: { status: WorkflowStatus.ARCHIVED }
    });

    wsServer.broadcastWorkflowUpdate({
      workflowId: workflow.id,
      status: WorkflowStatus.ARCHIVED,
      progress: 1,
      timestamp: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Workflow execution failed:', error);
    
    wsServer.broadcastWorkflowError(
      workflow.id,
      error instanceof Error ? error.message : 'Workflow execution failed'
    );

    await prisma.workflow.update({
      where: { id: workflow.id },
      data: { status: WorkflowStatus.ARCHIVED }
    });

    wsServer.broadcastWorkflowUpdate({
      workflowId: workflow.id,
      status: WorkflowStatus.ARCHIVED,
      error: error instanceof Error ? error.message : 'Workflow execution failed',
      timestamp: new Date()
    });

    return { success: false, error: error instanceof Error ? error.message : 'Workflow execution failed' };
  }
} 