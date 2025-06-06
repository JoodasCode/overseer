import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

/**
 * GET /api/workflows/executions/[id]
 * Retrieve a specific workflow execution by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const executionId = params.id;

    // Query execution with workflow details
    const { data: execution, error } = await supabase
      .from('workflow_executions')
      .select(`
        *,
        workflows (id, name, user_id)
      `)
      .eq('id', executionId)
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === '22P02' ? 400 : 500 }
      );
    }
    
    if (!execution) {
      return NextResponse.json(
        { error: 'Workflow execution not found' },
        { status: 404 }
      );
    }
    
    // Verify user owns the workflow
    if ((execution.workflows as any).user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ execution });
  } catch (error) {
    console.error('Error fetching workflow execution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow execution' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/executions/[id]
 * Delete a specific workflow execution
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const executionId = params.id;
    
    // First verify user owns the workflow
    const { data: execution, error: fetchError } = await supabase
      .from('workflow_executions')
      .select(`
        id,
        workflows (id, user_id)
      `)
      .eq('id', executionId)
      .single();
    
    if (fetchError || !execution) {
      return NextResponse.json(
        { error: 'Workflow execution not found' },
        { status: 404 }
      );
    }
    
    // Check ownership
    if ((execution.workflows as any).user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Delete execution
    const { error } = await supabase
      .from('workflow_executions')
      .delete()
      .eq('id', executionId);
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Workflow execution deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting workflow execution:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow execution' },
      { status: 500 }
    );
  }
}
