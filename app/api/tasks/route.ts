import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase-client';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { emitEvent } from '@/lib/realtime/event-emitter';

// Define options for pagination
interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * GET /api/tasks
 * Retrieve all tasks for the authenticated user with filtering and pagination
 */
export async function GET(req: NextRequest) {
  try {
    // Get user ID from auth context
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status') as TaskStatus | null;
    const priority = url.searchParams.get('priority') as TaskPriority | null;
    const agentId = url.searchParams.get('agent_id');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const sortBy = url.searchParams.get('sort_by') || 'due_date';
    const sortOrder = url.searchParams.get('sort_order') || 'asc';
    
    // Validate pagination parameters
    const validatedPage = page > 0 ? page : 1;
    const validatedLimit = limit > 0 && limit <= 100 ? limit : 20;
    const skip = (validatedPage - 1) * validatedLimit;
    
    // Build where clause for filtering
    const where: any = { user_id: user.id };
    
    if (status) {
      // Validate status enum
      const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'];
      if (validStatuses.includes(status)) {
        where.status = status;
      }
    }
    
    if (priority) {
      // Validate priority enum
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      if (validPriorities.includes(priority)) {
        where.priority = priority;
      }
    }
    
    if (agentId) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(agentId)) {
        where.agent_id = agentId;
      }
    }
    
    // Validate sort parameters
    const validSortFields = ['due_date', 'created_at', 'priority', 'status', 'title'];
    const validatedSortBy = validSortFields.includes(sortBy) ? sortBy : 'due_date';
    const validatedSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
    
    // Build order by object
    const orderBy: any = {};
    orderBy[validatedSortBy] = validatedSortOrder;
    
    // Add secondary sort by created_at if not already sorting by it
    if (validatedSortBy !== 'created_at') {
      orderBy.created_at = 'desc';
    }
    
    try {
      // Get total count for pagination
      const totalCount = await prisma.task.count({ where });
      
      // Execute query with Prisma
      const tasks = await prisma.task.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
            },
          },
        },
        orderBy,
        skip,
        take: validatedLimit,
      });
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / validatedLimit);
      
      return NextResponse.json({
        tasks,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          totalItems: totalCount,
          totalPages,
          hasNextPage: validatedPage < totalPages,
          hasPrevPage: validatedPage > 1,
        },
      });
    } catch (dbError) {
      console.error('Database error fetching tasks:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(req: NextRequest) {
  try {
    // Get user ID from auth context
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON format in request body' },
        { status: 400 }
      );
    }
    const { title, description, priority, agent_id, due_date, metadata } = body;
    
    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      );
    }
    
    // Validate priority if provided
    let validatedPriority: TaskPriority = TaskPriority.MEDIUM; // Default
    if (priority) {
      try {
        // Check if priority is a valid enum value
        const validPriorities = Object.values(TaskPriority);
        if (validPriorities.includes(priority as TaskPriority)) {
          validatedPriority = priority as TaskPriority;
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
    
    // Validate due_date if provided
    let validatedDueDate = undefined;
    if (due_date) {
      try {
        validatedDueDate = new Date(due_date);
        if (isNaN(validatedDueDate.getTime())) {
          throw new Error('Invalid date format');
        }
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid due_date format. Please use ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)' },
          { status: 400 }
        );
      }
    }
    
    // If agent_id is provided, verify it belongs to the user
    if (agent_id) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(agent_id)) {
        return NextResponse.json(
          { error: 'Invalid agent ID format' },
          { status: 400 }
        );
      }
      
      // Check if agent exists and belongs to user
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
    }
    
    try {
      // Create new task with Prisma
      const task = await prisma.task.create({
        data: {
          title,
          description,
          status: TaskStatus.PENDING,
          priority: validatedPriority,
          user_id: user.id,
          agent_id: agent_id || null,
          due_date: validatedDueDate,
          metadata: metadata || {},
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
      // Emit real-time event
      emitEvent('broadcast', { type: 'task_created', task });
      return NextResponse.json({ task }, { status: 201 });
    } catch (dbError) {
      console.error('Database error creating task:', dbError);
      return NextResponse.json(
        { error: 'Failed to create task', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: (error as Error).message },
      { status: 500 }
    );
  }
}
