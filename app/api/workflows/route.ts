import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { workflowExecutor, type Workflow } from '@/lib/workflow-engine/workflow-executor';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/workflows
 * Retrieve all workflows for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: workflows, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching workflows:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workflows' },
        { status: 500 }
      );
    }

    return NextResponse.json({ workflows: workflows || [] });
  } catch (error) {
    console.error('Error in GET /api/workflows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows
 * Create a new workflow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, workflow } = body;

    if (!userId || !workflow) {
      return NextResponse.json(
        { error: 'User ID and workflow data are required' },
        { status: 400 }
      );
    }

    // Validate workflow structure
    if (!workflow.name || !workflow.trigger || !workflow.agent || !workflow.steps) {
      return NextResponse.json(
        { error: 'Workflow must have name, trigger, agent, and steps' },
        { status: 400 }
      );
    }

    const workflowToSave = {
      id: workflow.id || `workflow_${Date.now()}`,
      user_id: userId,
      name: workflow.name,
      description: workflow.description || '',
      trigger: workflow.trigger,
      agent: workflow.agent,
      steps: workflow.steps,
      status: workflow.status || 'draft',
      metadata: workflow.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('workflows')
      .insert(workflowToSave)
      .select()
      .single();

    if (error) {
      console.error('Error creating workflow:', error);
      return NextResponse.json(
        { error: 'Failed to create workflow' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      workflow: data,
      message: 'Workflow created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/workflows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/workflows - Update an existing workflow
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, workflowId, workflow } = body;

    if (!userId || !workflowId || !workflow) {
      return NextResponse.json(
        { error: 'User ID, workflow ID, and workflow data are required' },
        { status: 400 }
      );
    }

    const workflowUpdates = {
      name: workflow.name,
      description: workflow.description,
      trigger: workflow.trigger,
      agent: workflow.agent,
      steps: workflow.steps,
      status: workflow.status,
      metadata: workflow.metadata || {},
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('workflows')
      .update(workflowUpdates)
      .eq('id', workflowId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating workflow:', error);
      return NextResponse.json(
        { error: 'Failed to update workflow' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Workflow not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      workflow: data,
      message: 'Workflow updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/workflows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows - Delete a workflow
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const workflowId = searchParams.get('workflowId');

    if (!userId || !workflowId) {
      return NextResponse.json(
        { error: 'User ID and workflow ID are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting workflow:', error);
      return NextResponse.json(
        { error: 'Failed to delete workflow' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/workflows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
