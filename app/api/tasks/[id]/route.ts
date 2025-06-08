import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase-client';
import { TaskPriority, TaskStatus } from '@prisma/client';

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * GET /api/tasks/[id]
 * Retrieve a specific task by ID
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

    const taskId = params.id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID format' },
        { status: 400 }
      );
    }

    try {
      // Query task with agent details using Prisma
      const task = await prisma.task.findUnique({
        where: {
          id: taskId,
          user_id: user.id,
        },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
            },
          },
        },
      });
      
      if (!task) {
        return NextResponse.json(
          { error: 'Task not found or you do not have permission to access it' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ task });
    } catch (dbError) {
      console.error('Database error fetching task:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch task', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update a specific task
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

    const taskId = params.id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID format' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { title, description, status, priority, agent_id, due_date, metadata } = body;
    
    // First check if task exists and belongs to user
    const existingTask = await prisma.task.findUnique({
      where: {
        id: taskId,
        user_id: user.id,
      },
    });
    
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found or you do not have permission to update it' },
        { status: 404 }
      );
    }
    
    // Build update object with only provided fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    
    // Validate and process status if provided
    if (status !== undefined) {
      try {
        // Check if status is a valid enum value
        const validStatuses = Object.values(TaskStatus);
        if (validStatuses.includes(status as TaskStatus)) {
          updateData.status = status as TaskStatus;
          
          // If status is COMPLETED, set completed_at timestamp
          if (status === TaskStatus.COMPLETED) {
            updateData.completed_at = new Date();
          } else if (existingTask.status === TaskStatus.COMPLETED && status !== TaskStatus.COMPLETED) {
            // If task was previously completed but now isn't, clear completed_at
            updateData.completed_at = null;
          }
        } else {
          return NextResponse.json(
            { error: 'Invalid status value', validValues: validStatuses },
            { status: 400 }
          );
        }
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid status value', validValues: Object.values(TaskStatus) },
          { status: 400 }
        );
      }
    }
    
    // Validate and process priority if provided
    if (priority !== undefined) {
      try {
        // Check if priority is a valid enum value
        const validPriorities = Object.values(TaskPriority);
        if (validPriorities.includes(priority as TaskPriority)) {
          updateData.priority = priority as TaskPriority;
        } else {
          return NextResponse.json(
            { error: 'Invalid priority value', validValues: validPriorities },
            { status: 400 }
          );
        }
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid priority value', validValues: Object.values(TaskPriority) },
          { status: 400 }
        );
      }
    }
    
    // Process agent_id if provided
    if (agent_id !== undefined) {
      // If agent_id is null, allow removing assignment
      if (agent_id === null) {
        updateData.agent_id = null;
      } else {
        // Validate UUID format
        if (!uuidRegex.test(agent_id)) {
          return NextResponse.json(
            { error: 'Invalid agent ID format' },
            { status: 400 }
          );
        }
        
        // Verify agent exists and belongs to user
        const agent = await prisma.agent.findFirst({
          where: {
            id: agent_id,
            user_id: user.id,
          },
        });
        
        if (!agent) {
          return NextResponse.json(
            { error: 'Agent not found or you do not have permission to assign tasks to it' },
            { status: 400 }
          );
        }
        
        updateData.agent_id = agent_id;
      }
    }
    
    // Validate due_date if provided
    if (due_date !== undefined) {
      if (due_date === null) {
        updateData.due_date = null;
      } else {
        try {
          const validatedDueDate = new Date(due_date);
          if (isNaN(validatedDueDate.getTime())) {
            throw new Error('Invalid date format');
          }
          updateData.due_date = validatedDueDate;
        } catch (e) {
          return NextResponse.json(
            { error: 'Invalid due_date format. Please use ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)' },
            { status: 400 }
          );
        }
      }
    }
    
    // Process metadata if provided
    if (metadata !== undefined) {
      // Merge with existing metadata if it exists
      updateData.metadata = {
        ...(existingTask.metadata as object || {}),
        ...(metadata as object),
      };
    }
    
    try {
      // Update task with Prisma
      const updatedTask = await prisma.task.update({
        where: {
          id: taskId,
          user_id: user.id,
        },
        data: updateData,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
            },
          },
        },
      });
      
      // If task was completed and has an agent, update agent's stats
      if (status === TaskStatus.COMPLETED && updatedTask.agent_id && existingTask.status !== TaskStatus.COMPLETED) {
        // Get current agent stats
        const agent = await prisma.agent.findUnique({
          where: { id: updatedTask.agent_id },
          select: { stats: true }
        });
        
        // Parse current stats or initialize with defaults
        const currentStats = agent?.stats ? (agent.stats as any) : {};
        const tasksCompleted = (currentStats.tasks_completed || 0) + 1;
        const currentXp = currentStats.xp || 0;
        const xpReward = metadata?.xp_reward ? Number(metadata.xp_reward) : 0;
        
        // Update agent stats
        await prisma.agent.update({
          where: { id: updatedTask.agent_id },
          data: {
            stats: {
              // Explicitly cast to Record<string, any> to avoid spread type error
              ...(currentStats as Record<string, any>),
              tasks_completed: tasksCompleted,
              xp: currentXp + xpReward,
              last_task_completed_at: new Date().toISOString()
            }
          },
        });
      }
      
      return NextResponse.json({ task: updatedTask });
    } catch (dbError) {
      console.error('Database error updating task:', dbError);
      return NextResponse.json(
        { error: 'Failed to update task', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a specific task
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

    const taskId = params.id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID format' },
        { status: 400 }
      );
    }
    
    // First check if task exists and belongs to user
    const existingTask = await prisma.task.findUnique({
      where: {
        id: taskId,
        user_id: user.id,
      },
    });
    
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }
    
    try {
      // Delete task with Prisma
      await prisma.task.delete({
        where: {
          id: taskId,
          user_id: user.id,
        },
      });
      
      return new NextResponse(null, { status: 204 });
    } catch (dbError) {
      console.error('Database error deleting task:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete task', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task', details: (error as Error).message },
      { status: 500 }
    );
  }
}
