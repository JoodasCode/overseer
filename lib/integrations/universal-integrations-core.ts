/**
 * Universal Integrations Core (UIC)
 * The central hub for all third-party tool integrations
 * Routes API calls to the right adapters, manages auth, and provides unified responses
 */

import { createClient } from '@supabase/supabase-js';
import { getRedisClient } from '../redis-client';
import { oauthManager } from './oauth-manager';
import { IntegrationManager } from '../plugin-engine/integration-manager';
import { GmailAdapter } from '../plugin-engine/adapters/gmail-adapter';
import { SlackAdapter } from '../plugin-engine/adapters/slack-adapter';
import { NotionAdapter } from '../plugin-engine/adapters/notion-adapter';
import { PluginAdapter, PluginResult, AuthStatus } from '../plugin-engine/types';

// Initialize clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Universal Integration Request/Response types
export interface UniversalIntegrationRequest {
  tool: string;
  action: string;
  params: Record<string, any>;
  agentId?: string;
  userId: string;
}

export interface UniversalIntegrationResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    tool: string;
    action: string;
    executionTime: number;
    cached: boolean;
  };
}

export interface IntegrationStatus {
  tool: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSynced?: string;
  capabilities: {
    actions: string[];
    rateLimit?: {
      requests: number;
      window: string;
    };
  };
}

export interface ToolCapabilities {
  id: string;
  name: string;
  description: string;
  actions: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  rateLimit: {
    requests: number;
    window: string;
  };
  requiresAuth: boolean;
}

/**
 * Universal Integrations Core
 * Centralized router for all third-party integrations
 */
export class UniversalIntegrationsCore {
  private static instance: UniversalIntegrationsCore;
  private adapters: Map<string, PluginAdapter> = new Map();
  private integrationManager: IntegrationManager;
  private redis: ReturnType<typeof getRedisClient> | null = null;

  private constructor() {
    this.integrationManager = IntegrationManager.getInstance();
    this.initializeAdapters();
    this.initializeRedis();
  }

  public static getInstance(): UniversalIntegrationsCore {
    if (!UniversalIntegrationsCore.instance) {
      UniversalIntegrationsCore.instance = new UniversalIntegrationsCore();
    }
    return UniversalIntegrationsCore.instance;
  }

  private async initializeRedis() {
    try {
      this.redis = await getRedisClient();
    } catch (error) {
      console.warn('UIC: Redis not available, rate limiting and caching disabled');
    }
  }

  private initializeAdapters() {
    // Register all available adapters
    this.adapters.set('gmail', new GmailAdapter());
    this.adapters.set('slack', new SlackAdapter());
    this.adapters.set('notion', new NotionAdapter());
  }

  /**
   * Main integration routing method
   * Routes requests to appropriate adapters with full error handling and logging
   */
  public async executeIntegration(request: UniversalIntegrationRequest): Promise<UniversalIntegrationResponse> {
    const startTime = Date.now();
    const { tool, action, params, agentId, userId } = request;

    try {
      // 1. Validate request
      const adapter = this.adapters.get(tool);
      if (!adapter) {
        return {
          success: false,
          error: `Tool '${tool}' not supported. Available tools: ${Array.from(this.adapters.keys()).join(', ')}`,
          metadata: {
            tool,
            action,
            executionTime: Date.now() - startTime,
            cached: false
          }
        };
      }

      // 2. Check authentication
      const authStatus = await this.checkAuth(userId, tool);
      if (!authStatus.connected) {
        return {
          success: false,
          error: `Authentication required for ${tool}. ${authStatus.error || ''}`,
          metadata: {
            tool,
            action,
            executionTime: Date.now() - startTime,
            cached: false
          }
        };
      }

      // 3. Check rate limiting
      const rateLimitOk = await this.checkRateLimit(userId, tool);
      if (!rateLimitOk) {
        return {
          success: false,
          error: `Rate limit exceeded for ${tool}. Please try again later.`,
          metadata: {
            tool,
            action,
            executionTime: Date.now() - startTime,
            cached: false
          }
        };
      }

      // 4. Check cache first
      const cachedResult = await this.getCachedResponse(userId, tool, action, params);
      if (cachedResult) {
        return {
          success: true,
          data: cachedResult,
          metadata: {
            tool,
            action,
            executionTime: Date.now() - startTime,
            cached: true
          }
        };
      }

             // 5. Execute the action
       let result: PluginResult;
       
       switch (action) {
         case 'send':
           result = await adapter.send(agentId || '', params);
           break;
         case 'fetch':
           result = await adapter.fetch(agentId || '', params);
           break;
         case 'connect':
           const connectResult = await adapter.connect(userId);
           result = {
             success: connectResult.connected,
             message: connectResult.connected ? 'Connected successfully' : 'Connection failed',
             data: connectResult,
             error: connectResult.error ? {
               code: 'CONNECTION_ERROR',
               message: connectResult.error,
               details: connectResult
             } : undefined
           };
           break;
         case 'disconnect':
           await adapter.disconnect(userId);
           result = { 
             success: true, 
             message: 'Disconnected successfully',
             data: { disconnected: true } 
           };
           break;
         case 'isConnected':
           const connected = await adapter.isConnected(userId);
           result = { 
             success: true, 
             message: `Connection status: ${connected ? 'connected' : 'disconnected'}`,
             data: { connected } 
           };
           break;
         default:
           throw new Error(`Action '${action}' not supported for ${tool}`);
       }

      // 6. Cache successful responses
      if (result.success && result.data) {
        await this.cacheResponse(userId, tool, action, params, result.data);
      }

      // 7. Update rate limiting
      await this.updateRateLimit(userId, tool);

               return {
           success: result.success,
           data: result.data,
           error: result.error?.message,
           metadata: {
             tool,
             action,
             executionTime: Date.now() - startTime,
             cached: false
           }
         };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`UIC: Error executing ${action} on ${tool}:`, error);

      return {
        success: false,
        error: `Failed to execute ${action} on ${tool}: ${errorMessage}`,
        metadata: {
          tool,
          action,
          executionTime: Date.now() - startTime,
          cached: false
        }
      };
    }
  }

  /**
   * Get integration status for all or specific tools
   */
  public async getIntegrationStatus(userId: string, toolName?: string): Promise<IntegrationStatus[]> {
    const tools = toolName ? [toolName] : Array.from(this.adapters.keys());
    const statuses: IntegrationStatus[] = [];

    for (const tool of tools) {
      const adapter = this.adapters.get(tool);
      if (!adapter) continue;

      try {
        const authStatus = await this.checkAuth(userId, tool);
        const capabilities = await this.getToolCapabilities(tool);
        
        // Get last sync time from database
        const integration = await this.integrationManager.getIntegration(userId, tool);

        statuses.push({
          tool: tool,
          name: capabilities.name,
          status: authStatus.connected ? 'connected' as const : 'disconnected' as const,
          lastSynced: integration?.updatedAt,
          capabilities: {
            actions: capabilities.actions.map(a => a.name),
            rateLimit: capabilities.rateLimit
          }
        });
      } catch (error) {
        statuses.push({
          tool: tool,
          name: tool,
          status: 'error' as const,
          capabilities: {
            actions: [],
          }
        });
      }
    }

    return statuses;
  }

  /**
   * Get available tools and their capabilities
   */
  public async getAvailableTools(): Promise<ToolCapabilities[]> {
    const tools: ToolCapabilities[] = [];

    for (const [toolId, adapter] of this.adapters) {
      const capabilities = await this.getToolCapabilities(toolId);
      tools.push(capabilities);
    }

    return tools;
  }

  /**
   * Agent-aware routing - automatically route to preferred tools
   */
  public async sendToPreferred(
    action: string,
    params: Record<string, any>,
    options: {
      agentId: string;
      userId: string;
      preferredTools?: string[];
      fallbackTools?: string[];
    }
  ): Promise<UniversalIntegrationResponse> {
    const { agentId, userId, preferredTools = [], fallbackTools = [] } = options;
    
    // Try preferred tools first
    for (const tool of preferredTools) {
      if (this.adapters.has(tool)) {
        const authStatus = await this.checkAuth(userId, tool);
        if (authStatus.connected) {
          return await this.executeIntegration({
            tool,
            action,
            params,
            agentId,
            userId
          });
        }
      }
    }

    // Try fallback tools
    for (const tool of fallbackTools) {
      if (this.adapters.has(tool)) {
        const authStatus = await this.checkAuth(userId, tool);
        if (authStatus.connected) {
          return await this.executeIntegration({
            tool,
            action,
            params,
            agentId,
            userId
          });
        }
      }
    }

    return {
      success: false,
      error: `No connected tools available for action '${action}'. Please connect to one of: ${[...preferredTools, ...fallbackTools].join(', ')}`,
      metadata: {
        tool: 'none',
        action,
        executionTime: 0,
        cached: false
      }
    };
  }

  /**
   * Generate OAuth authorization URL for a tool
   */
  public generateAuthUrl(tool: string, userId: string): string | null {
    const state = Buffer.from(JSON.stringify({ 
      tool, 
      userId, 
      timestamp: Date.now() 
    })).toString('base64');
    
    return oauthManager.generateAuthUrl(tool, state);
  }

  // Private helper methods

  private async checkAuth(userId: string, tool: string): Promise<AuthStatus> {
    try {
      const adapter = this.adapters.get(tool);
      if (!adapter) {
        return { connected: false, error: 'Tool not found' };
      }

      const connected = await adapter.isConnected(userId);
      return { connected };
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Auth check failed' 
      };
    }
  }

  private async checkRateLimit(userId: string, tool: string): Promise<boolean> {
    if (!this.redis) return true; // No rate limiting without Redis

    try {
      const capabilities = await this.getToolCapabilities(tool);
      const key = `rate_limit:${userId}:${tool}`;
      const current = await this.redis.get(key);
      
      if (current && parseInt(current) >= capabilities.rateLimit.requests) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Rate limit check failed:', error);
      return true; // Allow on error
    }
  }

  private async updateRateLimit(userId: string, tool: string): Promise<void> {
    if (!this.redis) return;

    try {
      const capabilities = await this.getToolCapabilities(tool);
      const key = `rate_limit:${userId}:${tool}`;
      
      await this.redis.incr(key);
      await this.redis.expire(key, this.parseTimeWindow(capabilities.rateLimit.window));
    } catch (error) {
      console.warn('Rate limit update failed:', error);
    }
  }

  private async getCachedResponse(
    userId: string, 
    tool: string, 
    action: string, 
    params: Record<string, any>
  ): Promise<any> {
    if (!this.redis) return null;

    try {
      const key = `response:${userId}:${tool}:${action}:${JSON.stringify(params)}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Cache get failed:', error);
      return null;
    }
  }

  private async cacheResponse(
    userId: string,
    tool: string,
    action: string,
    params: Record<string, any>,
    result: any
  ): Promise<void> {
    if (!this.redis) return;

    try {
      const key = `response:${userId}:${tool}:${action}:${JSON.stringify(params)}`;
      await this.redis.setex(key, 300, JSON.stringify(result)); // Cache for 5 minutes
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }

  private async getToolCapabilities(tool: string): Promise<ToolCapabilities> {
    // This would normally come from the adapter metadata
    const defaultCapabilities: Record<string, ToolCapabilities> = {
      gmail: {
        id: 'gmail',
        name: 'Gmail',
        description: 'Send and manage emails through Gmail',
        actions: [
          { name: 'send', description: 'Send an email', parameters: { to: 'string', subject: 'string', body: 'string' } },
          { name: 'fetch', description: 'Fetch emails', parameters: { query: 'string', maxResults: 'number' } },
          { name: 'reply', description: 'Reply to an email', parameters: { messageId: 'string', body: 'string' } }
        ],
        rateLimit: { requests: 100, window: '1h' },
        requiresAuth: true
      },
      slack: {
        id: 'slack',
        name: 'Slack',
        description: 'Send messages and manage Slack workspaces',
        actions: [
          { name: 'send', description: 'Send a message', parameters: { channel: 'string', text: 'string' } },
          { name: 'fetch', description: 'Fetch messages', parameters: { channel: 'string', limit: 'number' } },
          { name: 'upload', description: 'Upload a file', parameters: { channel: 'string', file: 'file' } }
        ],
        rateLimit: { requests: 50, window: '1m' },
        requiresAuth: true
      },
      notion: {
        id: 'notion',
        name: 'Notion',
        description: 'Create and manage Notion pages and databases',
        actions: [
          { name: 'create', description: 'Create a page', parameters: { parent: 'string', title: 'string', content: 'string' } },
          { name: 'fetch', description: 'Fetch pages', parameters: { databaseId: 'string', filter: 'object' } },
          { name: 'update', description: 'Update a page', parameters: { pageId: 'string', properties: 'object' } }
        ],
        rateLimit: { requests: 30, window: '1m' },
        requiresAuth: true
      }
    };

    return defaultCapabilities[tool] || {
      id: tool,
      name: tool,
      description: `Integration for ${tool}`,
      actions: [],
      rateLimit: { requests: 10, window: '1m' },
      requiresAuth: true
    };
  }

  private parseTimeWindow(window: string): number {
    const match = window.match(/^(\d+)([smhd])$/);
    if (!match) return 60; // Default to 1 minute

    const [, value, unit] = match;
    const num = parseInt(value);

    switch (unit) {
      case 's': return num;
      case 'm': return num * 60;
      case 'h': return num * 3600;
      case 'd': return num * 86400;
      default: return 60;
    }
  }
}

// Export singleton instance
export const universalIntegrationsCore = UniversalIntegrationsCore.getInstance(); 