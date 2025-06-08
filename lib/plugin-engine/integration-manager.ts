/**
 * Integration Manager for AgentOS
 * Handles OAuth flows, token management, and refresh logic
 */

import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { Integration, AuthStatus } from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export class IntegrationManager {
  private static instance: IntegrationManager;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  /**
   * Store a new integration
   */
  public async storeIntegration(integration: Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>): Promise<Integration> {
    // Check if integration already exists
    const { data: existingIntegration } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('userId', integration.userId)
      .eq('toolName', integration.toolName)
      .maybeSingle();

    let result;
    
    if (existingIntegration) {
      // Update existing integration
      const { data, error } = await supabase
        .from('user_integrations')
        .update({
          accessToken: integration.accessToken,
          refreshToken: integration.refreshToken,
          expiresAt: integration.expiresAt,
          status: integration.status,
          scopes: integration.scopes,
          metadata: integration.metadata,
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingIntegration.id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to update integration: ${error.message}`);
      }
      
      result = data;
    } else {
      // Create new integration
      const { data, error } = await supabase
        .from('user_integrations')
        .insert({
          ...integration,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to store integration: ${error.message}`);
      }
      
      result = data;
    }

    // Cache in Redis for quick access
    await this.cacheIntegration(result);
    
    return result;
  }

  /**
   * Get integration by user ID and tool name
   */
  public async getIntegration(userId: string, toolName: string): Promise<Integration | null> {
    // Try to get from cache first
    const cacheKey = `integration:${userId}:${toolName}`;
    const cachedIntegration = await redis.get<Integration>(cacheKey);
    
    if (cachedIntegration) {
      return cachedIntegration;
    }
    
    // Get from database
    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('userId', userId)
      .eq('toolName', toolName)
      .maybeSingle();
    
    if (error) {
      throw new Error(`Failed to get integration: ${error.message}`);
    }
    
    if (!data) {
      return null;
    }
    
    // Cache for future use
    await this.cacheIntegration(data);
    
    return data;
  }

  /**
   * Check if an integration is connected and valid
   */
  public async isConnected(userId: string, toolName: string): Promise<AuthStatus> {
    const integration = await this.getIntegration(userId, toolName);
    
    if (!integration) {
      return { connected: false, error: 'Integration not found' };
    }
    
    // Check if token is expired
    if (integration.expiresAt && new Date(integration.expiresAt) <= new Date()) {
      // Try to refresh token
      try {
        const refreshed = await this.refreshToken(integration);
        return { 
          connected: true, 
          expiresAt: refreshed.expiresAt,
          scopes: refreshed.scopes
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { 
          connected: false, 
          error: `Token expired and refresh failed: ${errorMessage}` 
        };
      }
    }
    
    return { 
      connected: integration.status === 'active', 
      expiresAt: integration.expiresAt,
      scopes: integration.scopes,
      error: integration.status !== 'active' ? `Integration status: ${integration.status}` : undefined
    };
  }

  /**
   * Refresh an expired token
   */
  public async refreshToken(integration: Integration): Promise<Integration> {
    if (!integration.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    // This would be implemented differently for each tool
    // For now, we'll just simulate a refresh
    const toolRefreshers: Record<string, () => Promise<Partial<Integration>>> = {
      'gmail': async () => this.refreshGmailToken(integration),
      'notion': async () => this.refreshNotionToken(integration),
      'slack': async () => this.refreshSlackToken(integration),
      'asana': async () => this.refreshAsanaToken(integration),
      'monday': async () => this.refreshMondayToken(integration),
      // Add more tools as needed
    };
    
    const refresher = toolRefreshers[integration.toolName];
    
    if (!refresher) {
      throw new Error(`No refresh logic for tool: ${integration.toolName}`);
    }
    
    const refreshedData = await refresher();
    
    // Update the integration with refreshed data
    const updatedIntegration: Integration = {
      ...integration,
      ...refreshedData,
      status: 'active',
      updatedAt: new Date().toISOString()
    };
    
    // Store the updated integration
    return await this.storeIntegration(updatedIntegration);
  }

  /**
   * Disconnect an integration
   */
  public async disconnect(userId: string, toolName: string): Promise<void> {
    // Update status in database
    await supabase
      .from('user_integrations')
      .update({ 
        status: 'revoked',
        updatedAt: new Date().toISOString()
      })
      .eq('userId', userId)
      .eq('toolName', toolName);
    
    // Remove from cache
    const cacheKey = `integration:${userId}:${toolName}`;
    await redis.del(cacheKey);
  }

  /**
   * Cache an integration in Redis
   */
  private async cacheIntegration(integration: Integration): Promise<void> {
    const cacheKey = `integration:${integration.userId}:${integration.toolName}`;
    
    // Cache for 1 hour
    await redis.set(cacheKey, integration, { ex: 3600 });
  }

  /**
   * Tool-specific token refresh logic
   */
  private async refreshGmailToken(integration: Integration): Promise<Partial<Integration>> {
    // This would call the Google OAuth refresh endpoint
    // For now, simulate a refresh
    return {
      accessToken: `refreshed_${integration.accessToken}`,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour from now
    };
  }

  private async refreshNotionToken(integration: Integration): Promise<Partial<Integration>> {
    // This would call the Notion OAuth refresh endpoint
    // For now, simulate a refresh
    return {
      accessToken: `refreshed_${integration.accessToken}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() // 7 days from now
    };
  }

  private async refreshSlackToken(integration: Integration): Promise<Partial<Integration>> {
    // This would call the Slack OAuth refresh endpoint
    // For now, simulate a refresh
    return {
      accessToken: `refreshed_${integration.accessToken}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() // 30 days from now
    };
  }
  
  /**
   * Refresh Asana access token
   */
  private async refreshAsanaToken(integration: Integration): Promise<Partial<Integration>> {
    try {
      if (!integration.refreshToken) {
        throw new Error('No refresh token available for Asana');
      }
      
      const clientId = process.env.ASANA_CLIENT_ID;
      const clientSecret = process.env.ASANA_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('Missing Asana OAuth credentials');
      }
      
      // Call Asana token refresh endpoint
      const response = await fetch('https://app.asana.com/-/oauth_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: integration.refreshToken,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Asana token refresh failed: ${data.error}`);
      }
      
      // Calculate expiration time
      const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || integration.refreshToken,
        expiresAt,
        metadata: {
          ...integration.metadata,
          tokenType: data.token_type,
          expiresIn: data.expires_in,
        },
      };
    } catch (error) {
      console.error('Error refreshing Asana token:', error);
      throw error;
    }
  }

  private async refreshMondayToken(integration: Integration): Promise<Partial<Integration>> {
    // Implementation for Monday.com token refresh
    // This is a placeholder and should be implemented based on the actual Monday.com OAuth flow
    return {
      accessToken: `refreshed_${integration.accessToken}`,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // Placeholder, actual implementation needed
      metadata: {
        ...integration.metadata,
        tokenType: 'Bearer',
        expiresIn: 3600, // Placeholder, actual implementation needed
      },
    };
  }
}
