import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { workflowExecutor, type Workflow } from '@/lib/workflow-engine/workflow-executor'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// POST /api/workflows/execute - Execute a workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, workflowId, input = {}, simulate = false } = body

    if (!userId || !workflowId) {
      return NextResponse.json(
        { error: 'User ID and workflow ID are required' },
        { status: 400 }
      )
    }

    // Fetch the workflow from the database
    const { data: workflowData, error: fetchError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !workflowData) {
      return NextResponse.json(
        { error: 'Workflow not found or access denied' },
        { status: 404 }
      )
    }

    // Check if workflow is active (unless it's a simulation)
    if (!simulate && workflowData.status !== 'active') {
      return NextResponse.json(
        { error: 'Workflow is not active. Only active workflows can be executed.' },
        { status: 400 }
      )
    }

    // Convert database workflow to execution format
    const workflow: Workflow = {
      id: workflowData.id,
      name: workflowData.name,
      description: workflowData.description,
      trigger: workflowData.trigger,
      agent: workflowData.agent,
      steps: workflowData.steps.map((step: any, index: number) => ({
        id: `step_${index}`,
        action: {
          type: step.action?.type || 'agent',
          action: step.action?.action || 'process',
          target: step.target,
          config: step.config || {}
        },
        agentId: workflowData.agent.id
      })),
      status: workflowData.status,
      metadata: workflowData.metadata || {}
    }

    if (simulate) {
      // Simulation mode - don't actually execute, just validate and return plan
      return NextResponse.json({
        success: true,
        simulation: true,
        workflow: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          steps: workflow.steps.length,
          estimatedDuration: workflow.steps.length * 2000, // 2 seconds per step
          agent: workflow.agent
        },
        plan: workflow.steps.map((step, index) => ({
          stepNumber: index + 1,
          action: `${step.action.type}.${step.action.action}`,
          description: getStepDescription(step.action),
          agent: workflow.agent.name
        })),
        message: 'Workflow simulation completed. No actual actions were performed.'
      })
    }

    // Execute the workflow
    const execution = await workflowExecutor.executeWorkflow(workflow, input)

    // Update workflow run count
    await supabase
      .from('workflows')
      .update({
        updated_at: new Date().toISOString(),
        metadata: {
          ...workflowData.metadata,
          lastRun: new Date().toISOString(),
          runCount: (workflowData.metadata?.runCount || 0) + 1
        }
      })
      .eq('id', workflowId)

    return NextResponse.json({
      success: true,
      execution: {
        id: execution.id,
        status: execution.status,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        output: execution.output,
        logs: execution.logs.map(log => ({
          timestamp: log.timestamp,
          level: log.level,
          message: log.message
        }))
      },
      message: 'Workflow executed successfully'
    })

  } catch (error) {
    console.error('Error executing workflow:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Workflow execution failed'
    }, { status: 500 })
  }
}

// GET /api/workflows/execute - Get execution status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const executionId = searchParams.get('executionId')

    if (!executionId) {
      // Return all active executions
      const activeExecutions = workflowExecutor.getActiveExecutions()
      
      return NextResponse.json({
        activeExecutions: activeExecutions.map(exec => ({
          id: exec.id,
          workflowId: exec.workflowId,
          status: exec.status,
          startedAt: exec.startedAt,
          logs: exec.logs.length
        }))
      })
    }

    // Get specific execution
    const execution = workflowExecutor.getExecution(executionId)
    
    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      execution: {
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        output: execution.output,
        errors: execution.errors,
        logs: execution.logs
      }
    })

  } catch (error) {
    console.error('Error getting execution status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/workflows/execute - Cancel execution
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const executionId = searchParams.get('executionId')

    if (!executionId) {
      return NextResponse.json(
        { error: 'Execution ID is required' },
        { status: 400 }
      )
    }

    await workflowExecutor.cancelExecution(executionId)

    return NextResponse.json({
      success: true,
      message: 'Execution cancelled successfully'
    })

  } catch (error) {
    console.error('Error cancelling execution:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getStepDescription(action: any): string {
  const actionMap: Record<string, string> = {
    'agent.summarize': 'Summarize content using AI agent',
    'agent.analyze': 'Analyze content using AI agent',
    'agent.process': 'Process content using AI agent',
    'gmail.send_email': 'Send email via Gmail',
    'gmail.reply': 'Reply to email via Gmail',
    'slack.send_message': 'Send message to Slack channel',
    'slack.post': 'Post message to Slack',
    'notion.create_page': 'Create new page in Notion',
    'notion.update_page': 'Update existing Notion page'
  }
  
  const key = `${action.type}.${action.action}`
  return actionMap[key] || `Execute ${action.action} action`
} 