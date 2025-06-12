/**
 * Workflow Execution Engine
 * Handles the runtime execution of workflows created through the conversational builder
 */

import { createClient } from '@supabase/supabase-js'
import { UniversalIntegrationsCore } from '../integrations/universal-integrations-core'
import type { Agent } from '../types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export interface WorkflowTrigger {
  type: 'gmail' | 'slack' | 'notion' | 'schedule' | 'manual'
  event: string
  config?: Record<string, any>
}

export interface WorkflowAction {
  type: 'gmail' | 'slack' | 'notion' | 'agent'
  action: string
  target?: any
  config?: Record<string, any>
}

export interface WorkflowStep {
  id: string
  action: WorkflowAction
  agentId?: string
  conditions?: any[]
  nextSteps?: string[]
}

export interface Workflow {
  id: string
  name: string
  description: string
  trigger: WorkflowTrigger
  agent: {
    id: string
    name: string
    role: string
  }
  steps: WorkflowStep[]
  status: 'draft' | 'active' | 'paused' | 'error'
  metadata?: Record<string, any>
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt: Date
  completedAt?: Date
  input?: any
  output?: any
  errors?: string[]
  logs: ExecutionLog[]
}

export interface ExecutionLog {
  timestamp: Date
  level: 'info' | 'warn' | 'error'
  message: string
  data?: any
}

export class WorkflowExecutor {
  private static instance: WorkflowExecutor
  private integrationCore: UniversalIntegrationsCore
  private activeExecutions: Map<string, WorkflowExecution> = new Map()

  private constructor() {
    this.integrationCore = UniversalIntegrationsCore.getInstance()
  }

  public static getInstance(): WorkflowExecutor {
    if (!WorkflowExecutor.instance) {
      WorkflowExecutor.instance = new WorkflowExecutor()
    }
    return WorkflowExecutor.instance
  }

  /**
   * Execute a workflow with given input data
   */
  public async executeWorkflow(workflow: Workflow, input: any = {}): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: this.generateExecutionId(),
      workflowId: workflow.id,
      status: 'pending',
      startedAt: new Date(),
      input,
      logs: []
    }

    this.activeExecutions.set(execution.id, execution)
    
    try {
      await this.log(execution, 'info', `Starting workflow execution: ${workflow.name}`)
      
      // Validate workflow
      await this.validateWorkflow(workflow)
      
      // Execute steps sequentially
      execution.status = 'running'
      const result = await this.executeSteps(workflow, execution, input)
      
      execution.status = 'completed'
      execution.completedAt = new Date()
      execution.output = result
      
      await this.log(execution, 'info', 'Workflow execution completed successfully')
      await this.saveExecution(execution)
      
      return execution
      
    } catch (error) {
      execution.status = 'failed'
      execution.completedAt = new Date()
      execution.errors = [error instanceof Error ? error.message : 'Unknown error']
      
      await this.log(execution, 'error', `Workflow execution failed: ${error}`)
      await this.saveExecution(execution)
      
      throw error
    } finally {
      this.activeExecutions.delete(execution.id)
    }
  }

  /**
   * Execute workflow steps in sequence
   */
  private async executeSteps(workflow: Workflow, execution: WorkflowExecution, input: any): Promise<any> {
    let currentData = input
    
    for (const step of workflow.steps) {
      await this.log(execution, 'info', `Executing step: ${step.action.type}.${step.action.action}`)
      
      try {
        const stepResult = await this.executeStep(workflow, step, currentData, execution)
        currentData = { ...currentData, ...stepResult }
        
        await this.log(execution, 'info', `Step completed successfully`, stepResult)
        
      } catch (error) {
        await this.log(execution, 'error', `Step failed: ${error}`)
        throw error
      }
    }
    
    return currentData
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    workflow: Workflow, 
    step: WorkflowStep, 
    data: any, 
    execution: WorkflowExecution
  ): Promise<any> {
    const { action } = step
    
    switch (action.type) {
      case 'agent':
        return await this.executeAgentAction(workflow.agent, action, data, execution)
      
      case 'gmail':
        return await this.executeGmailAction(action, data, execution)
      
      case 'slack':
        return await this.executeSlackAction(action, data, execution)
      
      case 'notion':
        return await this.executeNotionAction(action, data, execution)
      
      default:
        throw new Error(`Unsupported action type: ${action.type}`)
    }
  }

  /**
   * Execute an agent-based action (like summarize, analyze, etc.)
   */
  private async executeAgentAction(
    agent: { id: string; name: string; role: string },
    action: WorkflowAction,
    data: any,
    execution: WorkflowExecution
  ): Promise<any> {
    await this.log(execution, 'info', `Executing agent action: ${action.action} with ${agent.name}`)
    
    switch (action.action) {
      case 'summarize':
        return await this.summarizeContent(agent, data, execution)
      
      case 'analyze':
        return await this.analyzeContent(agent, data, execution)
      
      case 'process':
        return await this.processContent(agent, data, execution)
      
      default:
        throw new Error(`Unsupported agent action: ${action.action}`)
    }
  }

  /**
   * Summarize content using an agent
   */
  private async summarizeContent(
    agent: { id: string; name: string; role: string },
    data: any,
    execution: WorkflowExecution
  ): Promise<any> {
    // This would integrate with your actual agent system
    // For now, we'll simulate the summarization
    
    const content = data.content || data.text || data.body || JSON.stringify(data)
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const summary = {
      summary: `Summary of content by ${agent.name}: ${content.substring(0, 100)}...`,
      keyPoints: [
        'Key point 1 extracted from content',
        'Key point 2 extracted from content',
        'Key point 3 extracted from content'
      ],
      sentiment: 'neutral',
      wordCount: content.length,
      processedBy: agent.name,
      processedAt: new Date().toISOString()
    }
    
    await this.log(execution, 'info', `Content summarized by ${agent.name}`)
    
    return { summary, originalData: data }
  }

  /**
   * Execute Gmail actions
   */
  private async executeGmailAction(action: WorkflowAction, data: any, execution: WorkflowExecution): Promise<any> {
    await this.log(execution, 'info', `Executing Gmail action: ${action.action}`)
    
    const gmailRequest = {
      tool: 'gmail',
      action: action.action,
      params: {
        ...action.config,
        ...data
      },
      userId: execution.workflowId // This should be the actual user ID
    }
    
    const result = await this.integrationCore.processRequest(gmailRequest)
    
    if (!result.success) {
      throw new Error(`Gmail action failed: ${result.error}`)
    }
    
    return result.data
  }

  /**
   * Execute Slack actions
   */
  private async executeSlackAction(action: WorkflowAction, data: any, execution: WorkflowExecution): Promise<any> {
    await this.log(execution, 'info', `Executing Slack action: ${action.action}`)
    
    const slackRequest = {
      tool: 'slack',
      action: action.action,
      params: {
        ...action.config,
        ...data,
        // Ensure we have the required Slack parameters
        channel: action.target?.channel || action.config?.channel || '#general',
        text: data.summary?.summary || data.content || data.text || 'Workflow result'
      },
      userId: execution.workflowId // This should be the actual user ID
    }
    
    const result = await this.integrationCore.processRequest(slackRequest)
    
    if (!result.success) {
      throw new Error(`Slack action failed: ${result.error}`)
    }
    
    return result.data
  }

  /**
   * Execute Notion actions
   */
  private async executeNotionAction(action: WorkflowAction, data: any, execution: WorkflowExecution): Promise<any> {
    await this.log(execution, 'info', `Executing Notion action: ${action.action}`)
    
    const notionRequest = {
      tool: 'notion',
      action: action.action,
      params: {
        ...action.config,
        ...data,
        // Ensure we have the required Notion parameters
        title: data.title || `Workflow Result - ${new Date().toISOString()}`,
        content: data.summary?.summary || data.content || JSON.stringify(data)
      },
      userId: execution.workflowId // This should be the actual user ID
    }
    
    const result = await this.integrationCore.processRequest(notionRequest)
    
    if (!result.success) {
      throw new Error(`Notion action failed: ${result.error}`)
    }
    
    return result.data
  }

  /**
   * Analyze content using an agent
   */
  private async analyzeContent(
    agent: { id: string; name: string; role: string },
    data: any,
    execution: WorkflowExecution
  ): Promise<any> {
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    return {
      analysis: `Analysis by ${agent.name}: Content appears to be professional and relevant.`,
      confidence: 0.85,
      categories: ['business', 'communication'],
      processedBy: agent.name
    }
  }

  /**
   * Process content using an agent
   */
  private async processContent(
    agent: { id: string; name: string; role: string },
    data: any,
    execution: WorkflowExecution
  ): Promise<any> {
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      processed: true,
      processedData: { ...data, processedBy: agent.name },
      processedAt: new Date().toISOString()
    }
  }

  /**
   * Validate workflow before execution
   */
  private async validateWorkflow(workflow: Workflow): Promise<void> {
    if (!workflow.id || !workflow.name) {
      throw new Error('Workflow must have id and name')
    }
    
    if (!workflow.steps || workflow.steps.length === 0) {
      throw new Error('Workflow must have at least one step')
    }
    
    if (!workflow.agent || !workflow.agent.id) {
      throw new Error('Workflow must have an assigned agent')
    }
    
    // Validate each step
    for (const step of workflow.steps) {
      if (!step.action || !step.action.type || !step.action.action) {
        throw new Error('Each step must have a valid action')
      }
    }
  }

  /**
   * Log execution information
   */
  private async log(
    execution: WorkflowExecution,
    level: 'info' | 'warn' | 'error',
    message: string,
    data?: any
  ): Promise<void> {
    const logEntry: ExecutionLog = {
      timestamp: new Date(),
      level,
      message,
      data
    }
    
    execution.logs.push(logEntry)
    
    // Also log to console for debugging
    console.log(`[Workflow ${execution.workflowId}] ${level.toUpperCase()}: ${message}`, data || '')
  }

  /**
   * Save execution to database
   */
  private async saveExecution(execution: WorkflowExecution): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_executions')
        .upsert({
          id: execution.id,
          workflow_id: execution.workflowId,
          status: execution.status,
          started_at: execution.startedAt.toISOString(),
          completed_at: execution.completedAt?.toISOString(),
          input: execution.input,
          output: execution.output,
          errors: execution.errors,
          logs: execution.logs
        })
      
      if (error) {
        console.error('Failed to save workflow execution:', error)
      }
    } catch (error) {
      console.error('Error saving workflow execution:', error)
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Get active executions
   */
  public getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values())
  }

  /**
   * Get execution by ID
   */
  public getExecution(executionId: string): WorkflowExecution | undefined {
    return this.activeExecutions.get(executionId)
  }

  /**
   * Cancel a running execution
   */
  public async cancelExecution(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId)
    if (execution) {
      execution.status = 'failed'
      execution.completedAt = new Date()
      execution.errors = ['Execution cancelled by user']
      
      await this.log(execution, 'warn', 'Execution cancelled by user')
      await this.saveExecution(execution)
      
      this.activeExecutions.delete(executionId)
    }
  }
}

// Export singleton instance
export const workflowExecutor = WorkflowExecutor.getInstance() 