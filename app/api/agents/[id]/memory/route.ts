import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase-client';

/**
 * GET /api/agents/[id]/memory
 * Retrieve agent memory and recent memory logs
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
    
    try {
      // Verify agent belongs to user
      const agent = await prisma.agent.findUnique({
        where: {
          id: agentId,
          user_id: user.id
        }
      });
      
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found or you do not have permission to access it' },
          { status: 404 }
        );
      }

      // Query agent memory
      const memory = await prisma.agentMemory.findMany({
        where: {
          agent_id: agentId
        }
      });
      
      // Query recent memory logs
      const logs = await prisma.memoryLog.findMany({
        where: {
          agent_id: agentId
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 20
      });
      
      return NextResponse.json({
        memory,
        logs,
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch agent memory', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching agent memory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent memory' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agents/[id]/memory
 * Update agent memory
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
    
    try {
      // Verify agent belongs to user
      const agent = await prisma.agent.findUnique({
        where: {
          id: agentId,
          user_id: user.id
        }
      });
      
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found or you do not have permission to update it' },
          { status: 404 }
        );
      }
      
      // Parse request body
      const body = await req.json();
      const { key, value, type, metadata } = body;
      
      if (!key) {
        return NextResponse.json(
          { error: 'Memory key is required' },
          { status: 400 }
        );
      }
      
      // Check if memory exists
      const existingMemory = await prisma.agentMemory.findUnique({
        where: {
          agent_id_key: {
            agent_id: agentId,
            key: key
          }
        }
      });
      
      let memory;
      
      if (existingMemory) {
        // Update existing memory
        memory = await prisma.agentMemory.update({
          where: {
            agent_id_key: {
              agent_id: agentId,
              key: key
            }
          },
          data: {
            value: value !== undefined ? value : existingMemory.value,
            type: type !== undefined ? type : existingMemory.type,
            metadata: metadata !== undefined ? metadata : existingMemory.metadata,
          }
        });
      } else {
        // Create new memory if it doesn't exist
        memory = await prisma.agentMemory.create({
          data: {
            agent_id: agentId,
            key: key,
            value: value || '',
            type: type || 'string',
            metadata: metadata || {}
          }
        });
      }
      
      return NextResponse.json({ memory });
    } catch (dbError) {
      console.error('Database error updating agent memory:', dbError);
      return NextResponse.json(
        { error: 'Failed to update agent memory', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating agent memory:', error);
    return NextResponse.json(
      { error: 'Failed to update agent memory' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/[id]/memory
 * Add a new memory log entry
 */
export async function POST(
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
      // Verify agent belongs to user
      const agent = await prisma.agent.findUnique({
        where: {
          id: agentId,
          user_id: user.id
        }
      });
      
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found or you do not have permission to access it' },
          { status: 404 }
        );
      }
      
      // Parse request body
      const body = await req.json();
      const { operation, key, new_value, old_value, metadata } = body;
      
      if (!operation || !key || new_value === undefined) {
        return NextResponse.json(
          { error: 'Missing required fields: operation, key, new_value' },
          { status: 400 }
        );
      }
      
      // Create memory log entry
      const log = await prisma.memoryLog.create({
        data: {
          agent_id: agentId,
          operation,
          key,
          new_value: typeof new_value === 'string' ? new_value : JSON.stringify(new_value),
          old_value: old_value ? (typeof old_value === 'string' ? old_value : JSON.stringify(old_value)) : null,
          metadata: metadata || {},
          created_at: new Date()
        }
      });
      
      // If operation is 'learning', update recent_learnings in agent memory
      if (operation === 'learning') {
        // Get existing memory
        const existingMemory = await prisma.agentMemory.findFirst({
          where: {
            agent_id: agentId,
            key: 'recent_learnings'
          }
        });
        
        if (existingMemory) {
          // Parse existing learnings
          let recentLearnings = [];
          try {
            recentLearnings = typeof existingMemory.value === 'string' 
              ? JSON.parse(existingMemory.value) 
              : existingMemory.value || [];
          } catch (e) {
            // If parsing fails, start with empty array
            console.error('Failed to parse recent learnings:', e);
          }
          
          // Add new learning to the beginning and limit to 10 items
          const updatedLearnings = [new_value, ...recentLearnings].slice(0, 10);
          
          // Update memory
          await prisma.agentMemory.update({
            where: {
              id: existingMemory.id
            },
            data: {
              value: JSON.stringify(updatedLearnings)
            }
          });
        } else {
          // Create new memory entry for recent learnings
          await prisma.agentMemory.create({
            data: {
              agent_id: agentId,
              key: 'recent_learnings',
              value: JSON.stringify([new_value]),
              type: 'json',
              metadata: {}
            }
          });
        }
      }
      
      return NextResponse.json({ log }, { status: 201 });
    } catch (dbError) {
      console.error('Database error creating memory log:', dbError);
      return NextResponse.json(
        { error: 'Failed to create memory log', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating memory log:', error);
    return NextResponse.json(
      { error: 'Failed to create memory log' },
      { status: 500 }
    );
  }
}
