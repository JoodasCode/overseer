/**
 * Core Plugin Engine for AgentOS
 * Handles routing of tasks to appropriate adapters
 */

import { createClient } from '@supabase/supabase-js';
import { getRedisClient } from '../redis-client';
import { Scheduler } from './scheduler';
import { ErrorHandler } from './error-handler';
import { IntegrationManager } from './integration-manager';
import { BaseAdapter } from './adapters/base-adapter';
// import { TrelloAdapter } from './adapters/trello-adapter'; // Not implemented yet
import { AsanaAdapter } from './adapters/asana-adapter';
import { PluginAdapter, TaskIntent, ScheduledTask, PluginResult, ErrorLog } from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export class PluginEngine {
  private static instance: PluginEngine;
  private adapters: Map<string, PluginAdapter> = new Map();
  private scheduler: Scheduler;
  private errorHandler: ErrorHandler;
  private integrationManager: IntegrationManager;

  private constructor() {
    // Private constructor for singleton pattern
    this.scheduler = Scheduler.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
    this.integrationManager = IntegrationManager.getInstance();
    
    // Initialize adapters
    this.initializeAdapters();
  }
  
  /**
   * Initialize and register default adapters
   */
  private initializeAdapters(): void {
    // Register Asana adapter
    const asanaAdapter = new AsanaAdapter();
    this.registerAdapter('asana', asanaAdapter);
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
    // If this is a scheduled task, handle it differently
    if (intent.scheduledTime) {
      return await this.scheduleTask(intent);
    }

    return await this.executeTask(intent);
  }

  /**
   * Execute a task immediately
   */
  private async executeTask(intent: TaskIntent): Promise<PluginResult> {
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
      if (intent.intent === 'fetch' || intent.intent.startsWith('fetch_') || 
          intent.intent.startsWith('get_') || intent.intent.startsWith('list_') || 
          intent.intent.startsWith('search_')) {
        return await adapter.fetch(intent.agentId, intent.context);
      } else if (intent.intent === 'send' || intent.intent.startsWith('send_') ||
                 intent.intent.startsWith('create_') || intent.intent.startsWith('update_') ||
                 intent.intent.startsWith('delete_') || intent.intent.startsWith('post_') ||
                 intent.intent === 'test_intent') {
        return await adapter.send(intent.agentId, intent.context);
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
   * Schedule a task for later execution
   */
  private async scheduleTask(intent: TaskIntent): Promise<PluginResult> {
    try {
      const taskId = await this.scheduler.scheduleTask(intent);
      return {
        success: true,
        message: `Task scheduled successfully with ID: ${taskId}`,
        data: { taskId, scheduledTime: intent.scheduledTime }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Failed to schedule task: ${errorMessage}`,
        data: null
      };
    }
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
    const redis = getRedisClient();
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
