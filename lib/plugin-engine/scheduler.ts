/**
 * Scheduler for AgentOS
 * Handles deferred and scheduled tasks
 */

import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { ScheduledTask, TaskIntent } from './types';
import { PluginEngine } from './plugin-engine';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export class Scheduler {
  private static instance: Scheduler;
  private pluginEngine: PluginEngine;

  private constructor() {
    // Private constructor for singleton pattern
    this.pluginEngine = PluginEngine.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): Scheduler {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }

  /**
   * Schedule a task for later execution
   */
  public async scheduleTask(intent: TaskIntent): Promise<string> {
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

    return taskId;
  }

  /**
   * Get a scheduled task by ID
   */
  public async getTask(taskId: string): Promise<ScheduledTask | null> {
    // Try to get from cache first
    const cacheKey = `scheduled_task:${taskId}`;
    const cachedTask = await redis.get<ScheduledTask>(cacheKey);
    
    if (cachedTask) {
      return cachedTask;
    }
    
    // Get from database
    const { data, error } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('id', taskId)
      .maybeSingle();
    
    if (error) {
      throw new Error(`Failed to get task: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Cancel a scheduled task
   */
  public async cancelTask(taskId: string): Promise<boolean> {
    const task = await this.getTask(taskId);
    
    if (!task || task.status !== 'scheduled') {
      return false;
    }
    
    // Update in Supabase
    const { error } = await supabase
      .from('scheduled_tasks')
      .update({ 
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      })
      .eq('id', taskId);
    
    if (error) {
      throw new Error(`Failed to cancel task: ${error.message}`);
    }
    
    // Remove from Redis
    await redis.del(`scheduled_task:${taskId}`);
    
    return true;
  }

  /**
   * Process all scheduled tasks that are due
   * This should be called by a cron job every minute
   */
  public async processDueTasks(): Promise<number> {
    const now = new Date().toISOString();
    
    // Get tasks that are due
    const { data: tasks, error } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('status', 'scheduled')
      .lte('executeAt', now)
      .limit(20); // Process in batches
    
    if (error) {
      throw new Error(`Failed to fetch scheduled tasks: ${error.message}`);
    }
    
    if (!tasks || tasks.length === 0) {
      return 0;
    }
    
    let processedCount = 0;
    
    // Process each task
    for (const task of tasks) {
      // Mark as processing
      await supabase
        .from('scheduled_tasks')
        .update({ 
          status: 'processing', 
          attempts: task.attempts + 1,
          updatedAt: new Date().toISOString()
        })
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
        const result = await this.pluginEngine.processIntent(intent);
        
        // Update task with result
        await supabase
          .from('scheduled_tasks')
          .update({
            status: result.success ? 'completed' : 'failed',
            result,
            updatedAt: new Date().toISOString()
          })
          .eq('id', task.id);
        
        processedCount++;
          
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
      
      // Remove from Redis
      await redis.del(`scheduled_task:${task.id}`);
    }
    
    return processedCount;
  }

  /**
   * Retry a failed task
   */
  public async retryTask(taskId: string): Promise<boolean> {
    const task = await this.getTask(taskId);
    
    if (!task || task.status !== 'failed') {
      return false;
    }
    
    // Update in Supabase
    const { error } = await supabase
      .from('scheduled_tasks')
      .update({ 
        status: 'scheduled',
        attempts: task.attempts,
        executeAt: new Date().toISOString(), // Execute immediately
        updatedAt: new Date().toISOString()
      })
      .eq('id', taskId);
    
    if (error) {
      throw new Error(`Failed to retry task: ${error.message}`);
    }
    
    return true;
  }

  /**
   * Get tasks for an agent
   */
  public async getAgentTasks(agentId: string, status?: string, limit = 10): Promise<ScheduledTask[]> {
    let query = supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('agentId', agentId)
      .order('executeAt', { ascending: true })
      .limit(limit);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to get agent tasks: ${error.message}`);
    }
    
    return data || [];
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
   * Clean up tasks that have been completed for more than the specified number of days
   * @param days Number of days after which completed tasks should be cleaned up
   * @returns Number of tasks cleaned up
   */
  public async cleanupCompletedTasks(days: number = 7): Promise<number> {
    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString();
    
    // Get tasks that are completed and older than the cutoff date
    const { data: tasks, error } = await supabase
      .from('scheduled_tasks')
      .select('id')
      .in('status', ['completed', 'cancelled'])
      .lt('updatedAt', cutoffDateStr)
      .limit(100); // Process in batches
    
    if (error) {
      throw new Error(`Failed to fetch old tasks: ${error.message}`);
    }
    
    if (!tasks || tasks.length === 0) {
      return 0;
    }
    
    // Delete the tasks
    const taskIds = tasks.map(task => task.id);
    const { error: deleteError } = await supabase
      .from('scheduled_tasks')
      .delete()
      .in('id', taskIds);
    
    if (deleteError) {
      throw new Error(`Failed to delete old tasks: ${deleteError.message}`);
    }
    
    // Also remove from Redis if they exist
    for (const taskId of taskIds) {
      await redis.del(`scheduled_task:${taskId}`);
    }
    
    return taskIds.length;
  }
}
