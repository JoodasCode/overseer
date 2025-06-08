import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/workflows
 * Retrieve all workflows for the authenticated user
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
    const status = url.searchParams.get('status');
    
    // Build query with Prisma
    const whereClause: any = {
      user_id: user.id
    };
    
    // Apply filters if provided
    if (status) {
      whereClause.status = status;
    }
    
    try {
      // Execute query with Prisma
      const workflows = await prisma.workflow.findMany({
        where: whereClause,
        orderBy: {
          updated_at: 'desc'
        }
      });
      
      return NextResponse.json({ workflows });
    } catch (dbError) {
      console.error('Database error fetching workflows:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch workflows', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows
 * Create a new workflow
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
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const { name, description, nodes, status, agent_id } = body;
    
    // Validate required fields
    if (!name || !nodes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get or create default agent for user if agent_id not provided
    let finalAgentId = agent_id;
    if (!finalAgentId) {
      const defaultAgent = await prisma.agent.findFirst({
        where: { user_id: user.id }
      });
      if (!defaultAgent) {
        return NextResponse.json(
          { error: 'No agent found for user' },
          { status: 400 }
        );
      }
      finalAgentId = defaultAgent.id;
    }
    
    // Validate nodes structure (basic validation)
    if (!Array.isArray(nodes) && typeof nodes !== 'object') {
      return NextResponse.json(
        { error: 'Invalid nodes structure' },
        { status: 400 }
      );
    }
    
    try {
      // Insert new workflow with Prisma
      const workflow = await prisma.workflow.create({
        data: {
          name,
          description: description || '',
          config: { nodes }, // Store nodes in config field as JSON
          status: status || 'draft',
          user_id: user.id,
          agent_id: finalAgentId,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      
      return NextResponse.json({ workflow }, { status: 201 });
    } catch (dbError) {
      console.error('Database error creating workflow:', dbError);
      return NextResponse.json(
        { error: 'Failed to create workflow', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow', details: (error as Error).message },
      { status: 500 }
    );
  }
}
