/**
 * Trello Adapter for Overseer
 * Handles Trello API interactions
 */

import { BaseAdapter } from './base-adapter';
import { PluginMetadata, PluginResult } from '../types';
import { ErrorHandler } from '../error-handler';
import axios from 'axios';

export class TrelloAdapter extends BaseAdapter {
  private errorHandler: ErrorHandler;
  private apiBaseUrl = 'https://api.trello.com/1';
  
  constructor(errorHandler: ErrorHandler) {
    super('trello');
    this.errorHandler = errorHandler;
  }
  
  public getMetadata(): PluginMetadata {
    return {
      id: 'trello',
      name: 'Trello',
      description: 'Manage Trello boards, lists, and cards',
      version: '1.0.0',
      author: 'Overseer',
      scopes: ['read', 'write'],
      configSchema: {
        type: 'object',
        properties: {
          apiKey: {
            type: 'string',
            description: 'Trello API Key',
          },
          token: {
            type: 'string',
            description: 'Trello API Token',
          },
        },
        required: ['apiKey', 'token'],
      },
    };
  }
  
  public async send(agentId: string, payload: any): Promise<PluginResult> {
    try {
      const userId = await this.getUserIdFromAgentId(agentId);
      const accessToken = await this.getAccessToken(userId);
      const apiKey = await this.getApiKey(userId);
      
      if (!accessToken || !apiKey) {
        return {
          success: false,
          message: 'Trello is not connected',
          data: null,
        };
      }
      
      const action = payload.action || 'create_card';
      
      switch (action) {
        case 'create_card':
          return await this.createCard(apiKey, accessToken, payload);
        case 'update_card':
          return await this.updateCard(apiKey, accessToken, payload);
        default:
          return {
            success: false,
            message: `Unknown action: ${action}`,
            data: null,
          };
      }
    } catch (error) {
      this.errorHandler.logError({
        tool: this.toolName,
        action: 'send',
        errorCode: (error as Error).name || 'ERROR',
        errorMessage: (error as Error).message || 'Failed to send data to Trello',
        userId: 'unknown', // This should be extracted from agentId in a real implementation
        agentId: 'unknown', // This should be properly populated
        timestamp: new Date().toISOString(),
        resolved: false
      });
      
      return {
        success: false,
        message: 'Failed to send data to Trello',
        data: null,
      };
    }
  }
  
  public async fetch(agentId: string, query?: any): Promise<PluginResult> {
    try {
      const userId = await this.getUserIdFromAgentId(agentId);
      const accessToken = await this.getAccessToken(userId);
      const apiKey = await this.getApiKey(userId);
      
      if (!accessToken || !apiKey) {
        return {
          success: false,
          message: 'Trello is not connected',
          data: null,
        };
      }
      
      const action = query?.action || 'get_boards';
      
      switch (action) {
        case 'get_boards':
          return await this.getBoards(apiKey, accessToken);
        case 'get_lists':
          return await this.getLists(apiKey, accessToken, query.boardId);
        case 'get_cards':
          return await this.getCards(apiKey, accessToken, query.listId);
        default:
          return {
            success: false,
            message: `Unknown action: ${action}`,
            data: null,
          };
      }
    } catch (error) {
      this.errorHandler.logError({
        tool: this.toolName,
        action: 'fetch',
        errorCode: (error as Error).name || 'ERROR',
        errorMessage: (error as Error).message || 'Failed to fetch data from Trello',
        userId: 'unknown', // This should be extracted from agentId in a real implementation
        agentId: 'unknown', // This should be properly populated
        timestamp: new Date().toISOString(),
        resolved: false
      });
      
      return {
        success: false,
        message: 'Failed to fetch data from Trello',
        data: null,
      };
    }
  }
  
  // Helper methods
  
  private async getUserIdFromAgentId(agentId: string): Promise<string> {
    return agentId.split('_')[0];
  }
  
  private async getApiKey(userId: string): Promise<string | null> {
    const integration = await this.integrationManager.getIntegration(userId, this.toolName);
    return integration?.metadata?.apiKey || null;
  }
  
  protected async getAccessToken(userId: string): Promise<string | null> {
    const integration = await this.integrationManager.getIntegration(userId, this.toolName);
    return integration?.accessToken || null;
  }
  
  private async createCard(apiKey: string, token: string, payload: any): Promise<PluginResult> {
    try {
      const { name, description, listId } = payload;
      
      const response = await axios.post(
        `${this.apiBaseUrl}/cards`,
        null,
        { 
          params: {
            key: apiKey,
            token,
            name,
            idList: listId,
            desc: description || '',
          }
        }
      );
      
      return {
        success: true,
        message: 'Card created successfully',
        data: response.data,
      };
    } catch (error) {
      this.errorHandler.logError({
        tool: this.toolName,
        action: 'create_card',
        errorCode: (error as Error).name || 'ERROR',
        errorMessage: (error as Error).message || 'Failed to create Trello card',
        userId: 'unknown', // This should be extracted from agentId in a real implementation
        agentId: 'unknown', // This should be properly populated
        timestamp: new Date().toISOString(),
        resolved: false
      });
      
      return {
        success: false,
        message: 'Failed to create Trello card',
        data: null,
      };
    }
  }
  
  private async updateCard(apiKey: string, token: string, payload: any): Promise<PluginResult> {
    try {
      const { cardId, name, description, listId } = payload;
      
      const params: any = {
        key: apiKey,
        token,
      };
      
      if (name) params.name = name;
      if (description) params.desc = description;
      if (listId) params.idList = listId;
      
      const response = await axios.put(
        `${this.apiBaseUrl}/cards/${cardId}`,
        null,
        { params }
      );
      
      return {
        success: true,
        message: 'Card updated successfully',
        data: response.data,
      };
    } catch (error) {
      this.errorHandler.logError({
        tool: this.toolName,
        action: 'update_card',
        errorCode: (error as Error).name || 'ERROR',
        errorMessage: (error as Error).message || 'Failed to update Trello card',
        userId: 'unknown', // This should be extracted from agentId in a real implementation
        agentId: 'unknown', // This should be properly populated
        timestamp: new Date().toISOString(),
        resolved: false
      });
      
      return {
        success: false,
        message: 'Failed to update Trello card',
        data: null,
      };
    }
  }
  
  private async getBoards(apiKey: string, token: string): Promise<PluginResult> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/members/me/boards`,
        {
          params: {
            key: apiKey,
            token,
            filter: 'open',
          },
        }
      );
      
      return {
        success: true,
        message: 'Boards retrieved successfully',
        data: response.data,
      };
    } catch (error) {
      this.errorHandler.logError({
        tool: this.toolName,
        action: 'get_boards',
        errorCode: (error as Error).name || 'ERROR',
        errorMessage: (error as Error).message || 'Failed to retrieve Trello boards',
        userId: 'unknown', // This should be extracted from agentId in a real implementation
        agentId: 'unknown', // This should be properly populated
        timestamp: new Date().toISOString(),
        resolved: false
      });
      
      return {
        success: false,
        message: 'Failed to retrieve Trello boards',
        data: null,
      };
    }
  }
  
  private async getLists(apiKey: string, token: string, boardId: string): Promise<PluginResult> {
    try {
      if (!boardId) {
        return {
          success: false,
          message: 'Board ID is required',
          data: null,
        };
      }
      
      const response = await axios.get(
        `${this.apiBaseUrl}/boards/${boardId}/lists`,
        {
          params: {
            key: apiKey,
            token,
            filter: 'open',
          },
        }
      );
      
      return {
        success: true,
        message: 'Lists retrieved successfully',
        data: response.data,
      };
    } catch (error) {
      this.errorHandler.logError({
        tool: this.toolName,
        action: 'get_lists',
        errorCode: (error as Error).name || 'ERROR',
        errorMessage: (error as Error).message || 'Failed to retrieve Trello lists',
        userId: 'unknown', // This should be extracted from agentId in a real implementation
        agentId: 'unknown', // This should be properly populated
        timestamp: new Date().toISOString(),
        resolved: false
      });
      
      return {
        success: false,
        message: 'Failed to retrieve Trello lists',
        data: null,
      };
    }
  }
  
  private async getCards(apiKey: string, token: string, listId: string): Promise<PluginResult> {
    try {
      if (!listId) {
        return {
          success: false,
          message: 'List ID is required',
          data: null,
        };
      }
      
      const response = await axios.get(
        `${this.apiBaseUrl}/lists/${listId}/cards`,
        {
          params: {
            key: apiKey,
            token,
          },
        }
      );
      
      return {
        success: true,
        message: 'Cards retrieved successfully',
        data: response.data,
      };
    } catch (error) {
      this.errorHandler.logError({
        tool: this.toolName,
        action: 'get_cards',
        errorCode: (error as Error).name || 'ERROR',
        errorMessage: (error as Error).message || 'Failed to retrieve Trello cards',
        userId: 'unknown', // This should be extracted from agentId in a real implementation
        agentId: 'unknown', // This should be properly populated
        timestamp: new Date().toISOString(),
        resolved: false
      });
      
      return {
        success: false,
        message: 'Failed to retrieve Trello cards',
        data: null,
      };
    }
  }
}
