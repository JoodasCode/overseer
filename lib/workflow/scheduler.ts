import { prisma } from '@/lib/prisma';
import { WorkflowStatus, WorkflowExecutionStatus } from '@prisma/client';
import { executeWorkflow } from './engine';
import { Workflow } from './types';

interface ScheduleConfig {
  cron: string;
  timezone?: string;
  startDate?: Date;
  endDate?: Date;
}

export async function scheduleWorkflow(workflow: Workflow, config: ScheduleConfig) {
  try {
    // Update workflow with schedule configuration
    await prisma.workflow.update({
      where: { id: workflow.id },
      data: {
        status: WorkflowStatus.ACTIVE,
        config: {
          ...(workflow.config || {}),
          schedule: {
            cron: config.cron,
            timezone: config.timezone,
            startDate: config.startDate?.toISOString(),
            endDate: config.endDate?.toISOString()
          }
        }
      }
    });

    // Create initial execution record
    await prisma.workflowExecution.create({
      data: {
        workflow_id: workflow.id,
        user_id: workflow.user_id,
        status: WorkflowExecutionStatus.PENDING,
        trigger_data: {
          scheduled: true,
          scheduleConfig: {
            cron: config.cron,
            timezone: config.timezone,
            startDate: config.startDate?.toISOString(),
            endDate: config.endDate?.toISOString()
          }
        },
        started_at: new Date()
      }
    });

    // In a real implementation, this would be where we'd integrate with a job scheduler
    // like Bull, Agenda, or a cloud service like AWS EventBridge
    console.log(`Scheduled workflow ${workflow.id} with cron: ${config.cron}`);
  } catch (error) {
    console.error('Error scheduling workflow:', error);
    throw error;
  }
}

export async function cancelScheduledWorkflow(workflowId: string) {
  try {
    // Update workflow status
    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        status: WorkflowStatus.ARCHIVED,
        config: {
          schedule: null
        }
      }
    });

    // In a real implementation, this would be where we'd cancel the scheduled job
    console.log(`Cancelled scheduled workflow ${workflowId}`);
  } catch (error) {
    console.error('Error cancelling scheduled workflow:', error);
    throw error;
  }
}

export async function pauseScheduledWorkflow(workflowId: string) {
  try {
    // Update workflow status
    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        status: WorkflowStatus.DRAFT
      }
    });

    // In a real implementation, this would be where we'd pause the scheduled job
    console.log(`Paused scheduled workflow ${workflowId}`);
  } catch (error) {
    console.error('Error pausing scheduled workflow:', error);
    throw error;
  }
}

export async function resumeScheduledWorkflow(workflowId: string) {
  try {
    // Update workflow status
    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        status: WorkflowStatus.ACTIVE
      }
    });

    // In a real implementation, this would be where we'd resume the scheduled job
    console.log(`Resumed scheduled workflow ${workflowId}`);
  } catch (error) {
    console.error('Error resuming scheduled workflow:', error);
    throw error;
  }
}

// This function would be called by the job scheduler when it's time to execute a workflow
export async function handleScheduledExecution(workflowId: string) {
  try {
    const dbWorkflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    });

    if (!dbWorkflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (dbWorkflow.status !== WorkflowStatus.ACTIVE) {
      console.log(`Skipping execution of inactive workflow ${workflowId}`);
      return;
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

    await executeWorkflow(workflow);
  } catch (error) {
    console.error('Error handling scheduled workflow execution:', error);
    throw error;
  }
} 