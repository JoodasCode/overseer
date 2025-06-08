/**
 * Error Handler for AgentOS
 * Manages error reporting, retries, and fallback behavior
 * 
 * Features:
 * - Centralized error logging across all adapters
 * - Customizable fallback messages by tool and agent
 * - Retry policy management
 * - Error statistics and monitoring
 * - Automatic tool disabling for excessive errors
 */

import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { ErrorLog } from './types';

// Mock Supabase client for development
const mockSupabase = {
  auth: {
    getUser: async () => ({ data: { user: { id: 'mock-user-id' } } }),
    signOut: async () => ({ error: null }),
  },
  from: (table: string) => ({
    select: () => ({
      eq: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
    }),
  }),
};

// Use mock client in development
const supabase = process.env.NODE_ENV === 'development' 
  ? mockSupabase 
  : createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

// Initialize Redis client (mock for development)
const redis = process.env.NODE_ENV === 'development'
  ? {
      get: async () => null,
      set: async () => 'OK',
      del: async () => 1,
      incr: async () => 1,
      expire: async () => 1,
    }
  : new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });

/**
 * Interface for fallback message record in database
 */
interface FallbackMessageRecord {
  id: string;
  tool: string;
  agentId: string | null;
  message: string;
  updatedAt: string;
  updatedBy: string;
}

/**
 * Interface for error trend data
 */
interface ErrorTrend {
  date: string;
  count: number;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private retryLimits: Map<string, number> = new Map();
  private fallbackMessages: Map<string, string> = new Map();
  private initialized: boolean = false;

  private constructor() {
    // Private constructor for singleton pattern
    this.initializeDefaults();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  /**
   * Load fallback messages from database
   */
  private async loadFallbackMessages(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('fallback_messages')
        .select('*');
      
      if (error) {
        console.error('Failed to load fallback messages:', error);
        return;
      }
      
      if (data && data.length > 0) {
        data.forEach((record: FallbackMessageRecord) => {
          const key = record.agentId ? `${record.tool}:${record.agentId}` : record.tool;
          this.fallbackMessages.set(key, record.message);
        });
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Error loading fallback messages:', error);
    }
  }

  /**
   * Initialize default settings
   */
  private initializeDefaults(): void {
    // Default retry limits by tool
    this.retryLimits.set('gmail', 3);
    this.retryLimits.set('notion', 3);
    this.retryLimits.set('slack', 3);
    this.retryLimits.set('asana', 3);
    this.retryLimits.set('default', 2);

    // Default fallback messages by tool
    this.fallbackMessages.set('gmail', 'Unable to complete email action. The message has been saved as a draft.');
    this.fallbackMessages.set('notion', 'Unable to complete Notion action. Your content has been saved locally.');
    this.fallbackMessages.set('slack', 'Unable to send message to Slack. Please try again later.');
    this.fallbackMessages.set('asana', 'Unable to complete Asana task action. Your changes have been saved locally.');
    this.fallbackMessages.set('default', 'The agent encountered an issue while trying to complete this task.');
    
    // Load persisted fallback messages from database
    this.loadFallbackMessages();
  }

  /**
   * Log an error
   */
  public async logError(error: Omit<ErrorLog, 'id'>): Promise<string> {
    // Store in Supabase
    const { data, error: dbError } = await supabase
      .from('error_logs')
      .insert({
        ...error,
        timestamp: error.timestamp || new Date().toISOString(),
        resolved: error.resolved || false
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to log error:', dbError);
      return '';
    }

    // Track error count in Redis for rate limiting
    const errorCountKey = `error_count:${error.agentId}:${error.tool}:${error.action}`;
    await redis.incr(errorCountKey);
    // Expire the counter after 1 hour
    await redis.expire(errorCountKey, 3600);

    return data.id;
  }

  /**
   * Get error count for an agent/tool/action combination
   */
  public async getErrorCount(agentId: string, tool: string, action: string): Promise<number> {
    const errorCountKey = `error_count:${agentId}:${tool}:${action}`;
    const count = await redis.get<number>(errorCountKey);
    return count || 0;
  }

  /**
   * Check if retry should be attempted
   */
  public async shouldRetry(agentId: string, tool: string, action: string): Promise<boolean> {
    const count = await this.getErrorCount(agentId, tool, action);
    const limit = this.retryLimits.get(tool) || this.retryLimits.get('default') || 2;
    return count < limit;
  }

  /**
   * Get fallback message for a tool
   */
  public getFallbackMessage(tool: string, agentId?: string): string {
    // If we have an agent-specific fallback, use that
    if (agentId) {
      const agentSpecificKey = `${tool}:${agentId}`;
      if (this.fallbackMessages.has(agentSpecificKey)) {
        return this.fallbackMessages.get(agentSpecificKey) || '';
      }
    }
    
    // Otherwise use the tool default or global default
    return this.fallbackMessages.get(tool) || 
           this.fallbackMessages.get('default') || 
           'The agent encountered an issue while trying to complete this task.';
  }

  /**
   * Set a custom fallback message
   */
  public setFallbackMessage(tool: string, message: string, agentId?: string): void {
    const key = agentId ? `${tool}:${agentId}` : tool;
    this.fallbackMessages.set(key, message);
  }

  /**
   * Set retry limit for a tool
   */
  public setRetryLimit(tool: string, limit: number): void {
    this.retryLimits.set(tool, limit);
  }

  /**
   * Mark an error as resolved
   */
  public async resolveError(errorId: string): Promise<void> {
    await supabase
      .from('error_logs')
      .update({ 
        resolved: true,
        resolvedAt: new Date().toISOString()
      })
      .eq('id', errorId);
  }

  /**
   * Get recent errors for an agent
   */
  public async getAgentErrors(agentId: string, limit = 10): Promise<ErrorLog[]> {
    const { data, error } = await supabase
      .from('error_logs')
      .select('*')
      .eq('agentId', agentId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get agent errors:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get error stats by tool
   */
  public async getErrorStatsByTool(days = 7): Promise<Record<string, number>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Use type assertion to handle the .group() method which is available in Supabase but not in the TypeScript definitions
    const { data, error } = await (supabase
      .from('error_logs')
      .select('tool, count')
      .gte('timestamp', startDate.toISOString())
      // @ts-ignore - group is available in Supabase but not in the TypeScript definitions
      .group('tool') as Promise<{ data: any[]; error: any }>);

    if (error) {
      console.error('Failed to get error stats:', error);
      return {};
    }

    const stats: Record<string, number> = {};
    data.forEach((item: { tool: string; count: number }) => {
      stats[item.tool] = item.count;
    });

    return stats;
  }

  /**
   * Check if a tool should be disabled due to errors
   */
  public async shouldDisableTool(agentId: string, tool: string): Promise<boolean> {
    const errorCountKey = `error_count:${agentId}:${tool}`;
    const count = await redis.get<number>(errorCountKey);
    
    // Disable if more than 10 errors in the last hour
    return (count || 0) > 10;
  }
  
  /**
   * Get error trends over time
   * @param days Number of days to analyze
   * @param tool Optional tool to filter by
   * @returns Array of daily error counts
   */
  public async getErrorTrends(days = 30, tool?: string): Promise<ErrorTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    let query = supabase
      .from('error_logs')
      .select('timestamp')
      .gte('timestamp', startDate.toISOString());
    
    if (tool) {
      query = query.eq('tool', tool);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Failed to get error trends:', error);
      return [];
    }
    
    // Group by day
    const dailyCounts: Record<string, number> = {};
    
    data?.forEach((log: { timestamp: string }) => {
      const date = log.timestamp.split('T')[0]; // Get YYYY-MM-DD part
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    
    // Fill in missing days with zero counts
    const trends: ErrorTrend[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trends.push({
        date: dateStr,
        count: dailyCounts[dateStr] || 0
      });
    }
    
    // Sort by date ascending
    return trends.sort((a, b) => a.date.localeCompare(b.date));
  }
  
  /**
   * Get most frequent error codes
   * @param limit Maximum number of error codes to return
   * @param days Number of days to analyze
   * @returns Record of error codes and their counts
   */
  public async getMostFrequentErrorCodes(limit = 5, days = 7): Promise<Record<string, number>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();
    
    // Use rpc for aggregation query to avoid TypeScript issues with group
    const { data, error } = await supabase
      .rpc('get_frequent_error_codes', {
        start_date: startDateStr,
        max_results: limit
      });
    
    if (error) {
      console.error('Failed to get frequent error codes:', error);
      return {};
    }
    
    const errorCounts: Record<string, number> = {};
    if (Array.isArray(data)) {
      data.forEach((item: { error_code: string; error_count: number }) => {
        errorCounts[item.error_code] = item.error_count;
      });
    }
    
    return errorCounts;
  }
  
  /**
   * Bulk resolve multiple errors
   * @param errorIds Array of error IDs to resolve
   * @returns Number of errors successfully resolved
   */
  public async bulkResolveErrors(errorIds: string[]): Promise<number> {
    if (!errorIds.length) {
      return 0;
    }
    
    const { data, error } = await supabase
      .from('error_logs')
      .update({
        resolved: true,
        resolvedAt: new Date().toISOString()
      })
      .in('id', errorIds)
      .select('id');
    
    if (error) {
      console.error('Failed to bulk resolve errors:', error);
      return 0;
    }
    
    return data?.length || 0;
  }
}

export { supabase, redis };
