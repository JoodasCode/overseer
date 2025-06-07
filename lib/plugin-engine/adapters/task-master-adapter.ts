/**
 * TaskMasterAdapter - Integrates Claude Task Master AI-driven task management system with Overseer
 * 
 * This adapter implements the PluginAdapter interface to provide standardized
 * interactions between Overseer agents and Claude Task Master. It handles authentication,
 * task creation, updates, deletion, and retrieval.
 */

import { 
  PluginAdapter,
  PluginMetadata,
  AuthStatus,
  PluginResult,
  Integration,
} from '../types';
import { IntegrationManager } from '../integration-manager';
import { ErrorHandler } from '../error-handler';

export class TaskMasterAdapter implements PluginAdapter {
  private integrationManager: IntegrationManager;
  private errorHandler: ErrorHandler;
  
  /**
   * Creates a new TaskMasterAdapter instance
   * 
   * @param integrationManager - The integration manager for handling OAuth tokens
   * @param errorHandler - The error handler for centralized error logging
   */
  constructor(integrationManager: IntegrationManager, errorHandler: ErrorHandler) {
    this.integrationManager = integrationManager;
    this.errorHandler = errorHandler;
  }
  
  /**
   * Establishes connection with Claude Task Master using OAuth
   * 
   * @param userId - The ID of the user to connect
   * @returns Authentication status
   */
  async connect(userId: string): Promise<AuthStatus> {
    try {
      // Check if integration already exists
      const existingIntegration = await this.integrationManager.getIntegration(
        userId,
        'task-master',
      );
      
      if (existingIntegration && existingIntegration.isConnected) {
        return {
          isConnected: true,
          url: null,
        };
      }
      
      // Generate OAuth URL (mock implementation)
      const oauthUrl = 'https://taskmaster.ai/oauth/authorize';
      
      return {
        isConnected: false,
        url: oauthUrl,
      };
    } catch (error) {
      this.errorHandler.logError({
        userId,
        tool: 'task-master',
        action: 'connect',
        error: error as Error,
        message: 'Failed to connect to Task Master',
      });
      
      return {
        isConnected: false,
        url: null,
        error: 'Failed to connect to Task Master',
      };
    }
  }
  
  /**
   * Checks if the user has a valid connection to Claude Task Master
   * 
   * @param userId - The ID of the user to check
   * @returns Whether the user is connected
   */
  async isConnected(userId: string): Promise<boolean> {
    try {
      const integration = await this.integrationManager.getIntegration(
        userId,
        'task-master',
      );
      
      return integration?.isConnected || false;
    } catch (error) {
      this.errorHandler.logError({
        userId,
        tool: 'task-master',
        action: 'isConnected',
        error: error as Error,
        message: 'Failed to check Task Master connection status',
      });
      
      return false;
    }
  }
  
  /**
   * Sends data to Claude Task Master (create/update/delete tasks)
   * 
   * @param agentId - The ID of the agent sending the data
   * @param payload - The data to send
   * @returns Result of the operation
   */
  async send(agentId: string, payload: any): Promise<PluginResult> {
    try {
      const userId = this.getUserIdFromAgentId(agentId);
      
      if (!userId) {
        return {
          success: false,
          message: 'Invalid agent ID',
          data: null,
        };
      }
      
      const isConnected = await this.isConnected(userId);
      
      if (!isConnected) {
        return {
          success: false,
          message: 'Not connected to Task Master',
          data: null,
        };
      }
      
      // Route to appropriate action based on payload
      switch (payload.action) {
        case 'create_task':
          return await this.createTask(userId, payload.task);
        case 'update_task':
          return await this.updateTask(userId, payload.taskId, payload.task);
        case 'delete_task':
          return await this.deleteTask(userId, payload.taskId);
        default:
          return {
            success: false,
            message: `Unknown action: ${payload.action}`,
            data: null,
          };
      }
    } catch (error) {
      this.errorHandler.logError({
        agentId,
        tool: 'task-master',
        action: 'send',
        error: error as Error,
        message: 'Failed to send data to Task Master',
      });
      
      return {
        success: false,
        message: 'Failed to send data to Task Master',
        data: null,
      };
    }
  }
  
  /**
   * Fetches data from Claude Task Master (get tasks, task details)
   * 
   * @param agentId - The ID of the agent fetching the data
   * @param query - The query parameters
   * @returns Result of the operation
   */
  async fetch(agentId: string, query?: any): Promise<PluginResult> {
    try {
      const userId = this.getUserIdFromAgentId(agentId);
      
      if (!userId) {
        return {
          success: false,
          message: 'Invalid agent ID',
          data: null,
        };
      }
      
      const isConnected = await this.isConnected(userId);
      
      if (!isConnected) {
        return {
          success: false,
          message: 'Not connected to Task Master',
          data: null,
        };
      }
      
      // Route to appropriate action based on query
      switch (query?.action) {
        case 'get_task':
          return await this.getTask(userId, query.taskId);
        case 'list_tasks':
          return await this.listTasks(userId, query.filters);
        default:
          return {
            success: false,
            message: `Unknown action: ${query?.action}`,
            data: null,
          };
      }
    } catch (error) {
      this.errorHandler.logError({
        agentId,
        tool: 'task-master',
        action: 'fetch',
        error: error as Error,
        message: 'Failed to fetch data from Task Master',
      });
      
      return {
        success: false,
        message: 'Failed to fetch data from Task Master',
        data: null,
      };
    }
  }
  
  /**
   * Disconnects from Claude Task Master
   * 
   * @param userId - The ID of the user to disconnect
   */
  async disconnect(userId: string): Promise<void> {
    try {
      await this.integrationManager.removeIntegration(userId, 'task-master');
    } catch (error) {
      this.errorHandler.logError({
        userId,
        tool: 'task-master',
        action: 'disconnect',
        error: error as Error,
        message: 'Failed to disconnect from Task Master',
      });
    }
  }
  
  /**
   * Returns metadata about the adapter
   * 
   * @returns Plugin metadata
   */
  getMetadata(): PluginMetadata {
    return {
      id: 'task-master',
      name: 'Task Master',
      description: 'AI-driven task management system',
      version: '1.0.0',
      author: 'Overseer Team',
      scopes: ['tasks:read', 'tasks:write'],
      configSchema: {
        type: 'object',
        properties: {
          apiKey: {
            type: 'string',
            description: 'API key for Task Master',
          },
        },
        required: ['apiKey'],
      },
    };
  }
  
  // Helper methods
  
  /**
   * Gets the user ID from an agent ID
   * 
   * @param agentId - The agent ID
   * @returns The user ID
   */
  private getUserIdFromAgentId(agentId: string): string {
    // In a real implementation, this would query the database
    // to get the user ID associated with the agent
    // For now, we'll just return a mock value
    return `user_${agentId.split('_')[1]}`;
  }
  
  /**
   * Creates a task in Task Master
   * 
   * @param userId - The user ID
   * @param taskData - The task data
   * @returns Result of the operation
   */
  private async createTask(userId: string, taskData: any): Promise<PluginResult> {
    // Mock implementation - would make API call to Task Master
    return {
      success: true,
      message: 'Task created successfully',
      data: {
        id: `task_${Date.now()}`,
        title: taskData.title,
        description: taskData.description,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    };
  }
  
  /**
   * Updates a task in Task Master
   * 
   * @param userId - The user ID
   * @param taskId - The task ID
   * @param taskData - The updated task data
   * @returns Result of the operation
   */
  private async updateTask(userId: string, taskId: string, taskData: any): Promise<PluginResult> {
    // Mock implementation - would make API call to Task Master
    return {
      success: true,
      message: 'Task updated successfully',
      data: {
        id: taskId,
        ...taskData,
        updatedAt: new Date().toISOString(),
      },
    };
  }
  
  /**
   * Deletes a task in Task Master
   * 
   * @param userId - The user ID
   * @param taskId - The task ID
   * @returns Result of the operation
   */
  private async deleteTask(userId: string, taskId: string): Promise<PluginResult> {
    // Mock implementation - would make API call to Task Master
    return {
      success: true,
      message: 'Task deleted successfully',
      data: { id: taskId },
    };
  }
  
  /**
   * Lists tasks in Task Master
   * 
   * @param userId - The user ID
   * @param filters - Optional filters
   * @returns Result of the operation
   */
  private async listTasks(userId: string, filters?: any): Promise<PluginResult> {
    // Mock implementation - would make API call to Task Master
    return {
      success: true,
      message: 'Tasks retrieved successfully',
      data: [
        {
          id: 'task_1',
          title: 'Implement Task Master adapter',
          description: 'Create adapter for Task Master integration',
          status: 'in_progress',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'task_2',
          title: 'Test Task Master integration',
          description: 'Write tests for Task Master adapter',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }
  
  /**
   * Gets a task from Task Master
   * 
   * @param userId - The user ID
   * @param taskId - The task ID
   * @returns Result of the operation
   */
  private async getTask(userId: string, taskId: string): Promise<PluginResult> {
    // Mock implementation - would make API call to Task Master
    return {
      success: true,
      message: 'Task retrieved successfully',
      data: {
        id: taskId,
        title: 'Implement Task Master adapter',
        description: 'Create adapter for Task Master integration',
        status: 'in_progress',
        createdAt: new Date().toISOString(),
      },
    };
  }
}
