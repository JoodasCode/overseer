/**
 * Base adapter class for plugin adapters
 */

import { IntegrationManager } from '../integration-manager';
import { AuthStatus, PluginAdapter, PluginMetadata, PluginResult } from '../types';

/**
 * Abstract base class for plugin adapters
 * Implements common functionality for all adapters
 */
export abstract class BaseAdapter implements PluginAdapter {
  protected integrationManager: IntegrationManager;
  protected toolName: string;

  /**
   * Constructor
   * @param toolName - Name of the tool/integration
   */
  constructor(toolName: string) {
    this.integrationManager = IntegrationManager.getInstance();
    this.toolName = toolName;
  }

  /**
   * Connect to the service
   * @param userId - User ID
   */
  async connect(userId: string): Promise<AuthStatus> {
    try {
      const isConnected = await this.isConnected(userId);
      
      if (isConnected) {
        return {
          connected: true,
          scopes: await this.getScopes(userId),
        };
      }
      
      return {
        connected: false,
        error: 'Not connected',
      };
    } catch (error) {
      console.error(`Error connecting to ${this.toolName}:`, error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if connected to the service
   * @param userId - User ID
   */
  async isConnected(userId: string): Promise<boolean> {
    const status = await this.integrationManager.isConnected(userId, this.toolName);
    return status.connected;
  }

  /**
   * Disconnect from the service
   * @param userId - User ID
   */
  async disconnect(userId: string): Promise<void> {
    // Remove the integration from the database and cache
    await this.integrationManager.disconnect(userId, this.toolName);
  }

  /**
   * Get metadata for the plugin
   */
  abstract getMetadata(): PluginMetadata;

  /**
   * Send data to the service
   * @param agentId - Agent ID
   * @param payload - Payload to send
   */
  abstract send(agentId: string, payload: any): Promise<PluginResult>;

  /**
   * Fetch data from the service
   * @param agentId - Agent ID
   * @param query - Query parameters
   */
  abstract fetch(agentId: string, query?: any): Promise<PluginResult>;

  /**
   * Get scopes for the integration
   * @param userId - User ID
   */
  protected async getScopes(userId: string): Promise<string[]> {
    const integration = await this.integrationManager.getIntegration(userId, this.toolName);
    return integration?.scopes || [];
  }

  /**
   * Get access token for the integration
   * @param userId - User ID
   */
  protected async getAccessToken(userId: string): Promise<string | null> {
    const integration = await this.integrationManager.getIntegration(userId, this.toolName);
    return integration?.accessToken || null;
  }

  /**
   * Handle API error
   * @param error - Error object
   */
  protected handleApiError(error: any): PluginResult {
    console.error(`${this.toolName} API error:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error.status || error.statusCode || 500;
    
    return {
      success: false,
      message: `${this.toolName} API error: ${errorMessage}`,
      error: {
        code: errorCode.toString(),
        message: errorMessage,
        details: error.response?.data || error.data,
      },
    };
  }
}
