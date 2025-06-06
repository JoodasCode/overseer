import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

/**
 * POST /api/workflows/[id]/execute
 * Execute a specific workflow
 */
export async function POST(
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

    const workflowId = params.id;
    
    // Get workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('user_id', user.id)
      .single();
    
    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    // Check if workflow is active
    if (workflow.status !== 'active') {
      return NextResponse.json(
        { error: 'Cannot execute inactive workflow' },
        { status: 400 }
      );
    }
    
    // Parse request body for input data
    const { input_data = {} } = await req.json();
    
    // Create workflow execution record
    const { data: execution, error: executionError } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        status: 'running',
        input_data,
      })
      .select()
      .single();
    
    if (executionError) {
      return NextResponse.json(
        { error: executionError.message },
        { status: 500 }
      );
    }
    
    // Start workflow execution in background
    // In a real implementation, this would be handled by a queue or background worker
    // For now, we'll simulate execution with a simple timeout
    executeWorkflowAsync(workflow, execution.id, input_data);
    
    return NextResponse.json({
      message: 'Workflow execution started',
      execution_id: execution.id,
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}

/**
 * Execute workflow asynchronously
 * This is a placeholder for actual workflow execution logic
 */
async function executeWorkflowAsync(
  workflow: any,
  executionId: string,
  inputData: Record<string, any>
) {
  try {
    console.log(`Starting execution of workflow ${workflow.id}`);
    const startTime = Date.now();
    
    // Simulate workflow processing
    // In a real implementation, this would process the workflow nodes
    // and execute the corresponding actions
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo purposes, we'll just update some workflow stats
    const executionTime = Date.now() - startTime;
    const success = Math.random() > 0.2; // 80% success rate for demo
    
    // Update workflow execution record
    const { error: updateError } = await supabase
      .from('workflow_executions')
      .update({
        status: success ? 'completed' : 'failed',
        output_data: success ? { result: 'Workflow executed successfully' } : {},
        error_message: success ? null : 'Simulated workflow failure',
        execution_time: executionTime,
        completed_at: new Date().toISOString(),
      })
      .eq('id', executionId);
    
    if (updateError) {
      console.error('Error updating workflow execution:', updateError);
      return;
    }
    
    // Update workflow stats
    await supabase
      .from('workflows')
      .update({
        run_count: workflow.run_count + 1,
        success_rate: ((workflow.success_rate * workflow.run_count) + (success ? 1 : 0)) / (workflow.run_count + 1),
        last_run: new Date().toISOString(),
      })
      .eq('id', workflow.id);
    
    console.log(`Completed execution of workflow ${workflow.id}`);
  } catch (error) {
    console.error('Error in workflow execution:', error);
    
    // Update execution record with error
    await supabase
      .from('workflow_executions')
      .update({
        status: 'failed',
        error_message: `Internal error: ${error}`,
        completed_at: new Date().toISOString(),
      })
      .eq('id', executionId);
  }
}
