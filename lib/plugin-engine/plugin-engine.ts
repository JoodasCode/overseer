/**
 * Core Plugin Engine for AgentOS
 * Handles routing of tasks to appropriate adapters
 */

import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { Scheduler } from './scheduler';
import { ErrorHandler } from './error-handler';
import { BaseAdapter } from './adapters/base-adapter';
import { PluginAdapter, TaskIntent, ScheduledTask, PluginResult, ErrorLog } from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export class PluginEngine {
  private static instance: PluginEngine;
  private adapters: Map<string, PluginAdapter> = new Map();
  private scheduler: Scheduler;
  private errorHandler: ErrorHandler;

  private constructor() {
    // Private constructor for singleton pattern
    this.scheduler = Scheduler.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PluginEngine {
    if (!PluginEngine.instance) {
      PluginEngine.instance = new PluginEngine();
    }
    return PluginEngine.instance;
  }

  /**
   * Register a plugin adapter
   */
  public registerAdapter(tool: string, adapter: PluginAdapter): void {
    this.adapters.set(tool, adapter);
  }

  /**
   * Get a registered adapter
   */
  public getAdapter(tool: string): PluginAdapter | undefined {
    return this.adapters.get(tool);
  }

  /**
   * List all registered adapters
   */
  public listAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Process an intent with the appropriate adapter
   */
  public async processIntent(intent: TaskIntent): Promise<PluginResult> {
    const adapter = this.getAdapter(intent.tool);

    if (!adapter) {
      return {
        success: false,
        message: `No adapter found for tool: ${intent.tool}`,
        data: null,
      };
    }

    // Check if tool should be disabled due to excessive errors
    const shouldDisable = await this.errorHandler.shouldDisableTool(intent.agentId, intent.tool);
    if (shouldDisable) {
      const fallbackMessage = this.errorHandler.getFallbackMessage(intent.tool, intent.agentId);
      return {
        success: false,
        message: `Tool ${intent.tool} is currently disabled due to excessive errors. ${fallbackMessage}`,
        data: null,
      };
    }

    try {
      // Process the intent based on the action
      if (intent.intent === 'send') {
        return await adapter.send(intent.agentId, intent.context);
      } else if (intent.intent === 'fetch') {
        return await adapter.fetch(intent.agentId, intent.context);
      } else {
        return {
          success: false,
          message: `Unsupported action: ${intent.intent}`,
          data: null,
        };
      }
    } catch (error) {
      console.error(`Error processing intent for ${intent.tool}:`, error);
      
      // Log the error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = error instanceof Error && error.name ? error.name : 'UNKNOWN_ERROR';
      
      await this.errorHandler.logError({
        agentId: intent.agentId,
        userId: intent.userId,
        tool: intent.tool,
        action: intent.intent,
        errorCode,
        errorMessage,
        payload: intent.context,
        timestamp: new Date().toISOString(),
        resolved: false
      });
      
      // Get fallback message
      const fallbackMessage = this.errorHandler.getFallbackMessage(intent.tool, intent.agentId);
      
      return {
        success: false,
        message: `Error processing intent: ${errorMessage}. ${fallbackMessage}`,
        data: null,
      };
    }
  }

  /**
   * Execute a task immediately
   */
  private async executeTask(intent: TaskIntent): Promise<PluginResult> {
    const { tool, agentId, userId } = intent;
    const adapter = this.adapters.get(tool);

    if (!adapter) {
      throw new Error(`No adapter found for tool: ${tool}`);
    }

    // Check if the user has connected this tool
    const isConnected = await adapter.isConnected(userId);
    if (!isConnected) {
      return {
        success: false,
        message: `Tool ${tool} is not connected for this user`,
        error: {
          code: 'TOOL_NOT_CONNECTED',
          message: `Please connect ${tool} before using it`
        }
      };
    }

    // Normalize context for the adapter
    const normalizedContext = this.normalizeContext(intent);

    // Execute the appropriate method based on intent type
    // For now we'll use a simple convention: send for write operations, fetch for read operations
    const isReadOperation = intent.intent.startsWith('get_') || 
                           intent.intent.startsWith('fetch_') || 
                           intent.intent.startsWith('list_') ||
                           intent.intent.startsWith('search_');

    try {
      let result: PluginResult;
      
      if (isReadOperation) {
        result = await adapter.fetch(agentId, normalizedContext);
      } else {
        result = await adapter.send(agentId, normalizedContext);
      }

      // Cache successful results
      if (result.success) {
        await this.cacheResult(intent, result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logError({
        agentId,
        userId,
        tool,
        action: intent.intent,
        errorCode: 'EXECUTE_TASK_ERROR',
        errorMessage,
        payload: intent.context,
        timestamp: new Date().toISOString(),
        resolved: false
      });
      
      return {
        success: false,
        message: `Failed to execute task: ${errorMessage}`,
        error: {
          code: 'EXECUTE_TASK_ERROR',
          message: errorMessage
        }
      };
    }
  }

  /**
   * Schedule a task for later execution
   */
  private async scheduleTask(intent: TaskIntent): Promise<PluginResult> {
    const { agentId, userId, tool, intent: action, context, scheduledTime } = intent;
    
    if (!scheduledTime) {
      throw new Error('No scheduled time provided');
    }

    const task: Omit<ScheduledTask, 'id' | 'createdAt' | 'updatedAt'> = {
      agentId,
      userId,
      tool,
      action,
      payload: context,
      executeAt: scheduledTime,
      status: 'scheduled',
      attempts: 0
    };

    // Store in Supabase
    const { data, error } = await supabase
      .from('scheduled_tasks')
      .insert(task)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to schedule task: ${error.message}`);
    }

    // Also store in Redis for quick lookup
    const taskId = data.id;
    await redis.set(`scheduled_task:${taskId}`, JSON.stringify(data), {
      ex: this.getSecondsUntil(scheduledTime)
    });

    return {
      success: true,
      message: `Task scheduled for ${scheduledTime}`,
      externalId: taskId,
      metadata: {
        scheduledTime,
        taskId
      }
    };
  }

  /**
   * Normalize context for adapter
   */
  private normalizeContext(intent: TaskIntent): any {
    // This is where we would transform generic context into tool-specific format
    // For now, just pass through the context
    return intent.context;
  }

  /**
   * Cache successful results
   */
  private async cacheResult(intent: TaskIntent, result: PluginResult): Promise<void> {
    const cacheKey = `result:${intent.agentId}:${intent.tool}:${intent.intent}`;
    
    // Cache for 5 minutes
    await redis.set(cacheKey, JSON.stringify(result), { ex: 300 });
  }

  /**
   * Log an error
   */
  private async logError(errorLog: Omit<ErrorLog, 'id'>): Promise<void> {
    // Store in Supabase
    await supabase.from('error_logs').insert(errorLog);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Plugin Engine Error:', errorLog);
    }
  }

  /**
   * Get seconds until a future date
   */
  private getSecondsUntil(futureDate: string): number {
    const future = new Date(futureDate).getTime();
    const now = Date.now();
    const diffSeconds = Math.floor((future - now) / 1000);
    return Math.max(1, diffSeconds); // Minimum 1 second
  }

  /**
   * Process scheduled tasks that are due
   * This should be called by a cron job every minute
   * @returns Array of processed tasks with their results
   */
  public async processScheduledTasks(): Promise<ScheduledTask[]> {
    const now = new Date().toISOString();
    
    // Get tasks that are due
    const { data: tasks, error } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('status', 'scheduled')
      .lte('executeAt', now)
      .limit(10); // Process in batches
    
    if (error) {
      console.error('Failed to fetch scheduled tasks:', error);
      return [];
    }
    
    if (!tasks || tasks.length === 0) {
      return [];
    }
    
    // Process each task
    for (const task of tasks) {
      // Mark as processing
      await supabase
        .from('scheduled_tasks')
        .update({ status: 'processing', attempts: task.attempts + 1 })
        .eq('id', task.id);
      
      try {
        // Convert to task intent
        const intent: TaskIntent = {
          agentId: task.agentId,
          userId: task.userId,
          tool: task.tool,
          intent: task.action,
          context: task.payload
        };
        
        // Execute the task
        const result = await this.executeTask(intent);
        
        // Update task with result
        await supabase
          .from('scheduled_tasks')
          .update({
            status: result.success ? 'completed' : 'failed',
            result,
            updatedAt: new Date().toISOString()
          })
          .eq('id', task.id);
          
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Update task with error
        await supabase
          .from('scheduled_tasks')
          .update({
            status: 'failed',
            error: errorMessage,
            updatedAt: new Date().toISOString()
          })
          .eq('id', task.id);
      }
    }
    
    // Return the processed tasks
    return tasks;
  }
}
