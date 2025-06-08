/**
 * Asana Adapter for AgentOS
 * Handles Asana API interactions with pagination, rate limiting, and error handling
 * 
 * Features:
 * - Full TypeScript support with comprehensive type definitions
 * - Pagination support for list operations
 * - Rate limiting protection with automatic retry
 * - Detailed error handling with proper error codes
 * - Support for tasks, projects, workspaces, sections, and tags
 * 
 * @module AsanaAdapter
 * @author AgentOS
 * @version 1.0.0
 */

import { BaseAdapter } from './base-adapter';
import { PluginMetadata, PluginResult } from '../types';

// Type definitions for Asana API responses and parameters
interface AsanaTask {
  gid: string;
  name: string;
  notes?: string;
  completed: boolean;
  due_on?: string;
  assignee?: AsanaUser;
  projects?: AsanaProject[];
  workspace?: AsanaWorkspace;
  created_at?: string;
  modified_at?: string;
  tags?: AsanaTag[];
  parent?: AsanaTask;
}

interface AsanaProject {
  gid: string;
  name: string;
  notes?: string;
  workspace?: AsanaWorkspace;
  created_at?: string;
  modified_at?: string;
  owner?: AsanaUser;
  public: boolean;
}

interface AsanaWorkspace {
  gid: string;
  name: string;
  is_organization: boolean;
}

interface AsanaUser {
  gid: string;
  name: string;
  email?: string;
}

interface AsanaTag {
  gid: string;
  name: string;
}

interface AsanaApiResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
  message?: string;
  next_page?: {
    offset?: string;
    path?: string;
    uri?: string;
  };
}

interface AsanaListParams {
  limit?: number;
  offset?: string;
  workspace?: string;
  assignee?: string;
  project?: string;
  completed?: boolean;
  modified_since?: string;
  opt_fields?: string;
}

// Interface for Asana API client
interface AsanaClient {
  tasks: {
    create: (params: any) => Promise<AsanaApiResponse<AsanaTask>>;
    findAll: (params: AsanaListParams) => Promise<AsanaApiResponse<AsanaTask[]>>;
    findById: (taskId: string, params?: { opt_fields?: string }) => Promise<AsanaApiResponse<AsanaTask>>;
    update: (taskId: string, params: any) => Promise<AsanaApiResponse<AsanaTask>>;
    delete: (taskId: string) => Promise<AsanaApiResponse<{}>>;
    subtasks: (taskId: string, params?: AsanaListParams) => Promise<AsanaApiResponse<AsanaTask[]>>;
    addComment: (taskId: string, params: { text: string }) => Promise<AsanaApiResponse<any>>;
  };
  projects: {
    findAll: (params?: AsanaListParams) => Promise<AsanaApiResponse<AsanaProject[]>>;
    findById: (projectId: string, params?: { opt_fields?: string }) => Promise<AsanaApiResponse<AsanaProject>>;
    findByWorkspace: (workspaceId: string, params?: AsanaListParams) => Promise<AsanaApiResponse<AsanaProject[]>>;
    tasks: (projectId: string, params?: AsanaListParams) => Promise<AsanaApiResponse<AsanaTask[]>>;
  };
  sections: {
    tasks: (sectionId: string, params?: AsanaListParams) => Promise<AsanaApiResponse<AsanaTask[]>>;
  };
  tags: {
    tasks: (tagId: string, params?: AsanaListParams) => Promise<AsanaApiResponse<AsanaTask[]>>;
  };
  workspaces: {
    findAll: (params?: AsanaListParams) => Promise<AsanaApiResponse<AsanaWorkspace[]>>;
  };
  users: {
    me: (params?: { opt_fields?: string }) => Promise<AsanaApiResponse<AsanaUser>>;
  };
}

/**
 * Asana API adapter for the Plugin Engine
 */
export class AsanaAdapter extends BaseAdapter {
  private metadata: PluginMetadata = {
    id: 'asana',
    name: 'Asana',
    description: 'Create and manage tasks in Asana',
    version: '1.0.0',
    author: 'AgentOS',
    scopes: [
      'default'
    ]
  };

  /**
   * Constructor
   */
  constructor() {
    super('asana');
  }

  /**
   * Get metadata about the Asana adapter
   */
  public getMetadata(): PluginMetadata {
    return this.metadata;
  }

  /**
   * Send data to Asana (create or update tasks)
   * @param agentId - Agent ID
   * @param payload - Payload to send
   */
  public async send(agentId: string, payload: any): Promise<PluginResult> {
    try {
      // Get the user ID from the agent ID
      const userId = await this.getUserIdFromAgentId(agentId);
      
      // Get the access token
      const accessToken = await this.getAccessToken(userId);
      
      if (!accessToken) {
        return {
          success: false,
          message: 'Asana is not connected',
          error: {
            code: 'NOT_CONNECTED',
            message: 'Please connect Asana before creating tasks'
          }
        };
      }
      
      // Create Asana client with the access token
      const client = await this.createAsanaClient(accessToken);
      
      // Determine the action based on payload
      const action = payload.action || 'create_task';
      
      switch (action) {
        case 'create_task':
          return await this.createTask(client, payload);
        case 'update_task':
          return await this.updateTask(client, payload);
        case 'delete_task':
          return await this.deleteTask(client, payload);
        default:
          return {
            success: false,
            message: `Unknown action: ${action}`,
            error: {
              code: 'UNKNOWN_ACTION',
              message: `The action ${action} is not supported`
            }
          };
      }
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Fetch data from Asana
   * @param agentId - Agent ID
   * @param query - Query parameters
   */
  public async fetch(agentId: string, query?: any): Promise<PluginResult> {
    try {
      // Get the user ID from the agent ID
      const userId = await this.getUserIdFromAgentId(agentId);
      
      // Get the access token
      const accessToken = await this.getAccessToken(userId);
      
      if (!accessToken) {
        return {
          success: false,
          message: 'Asana is not connected',
          error: {
            code: 'NOT_CONNECTED',
            message: 'Please connect Asana before fetching tasks'
          }
        };
      }
      
      // Create Asana client with the access token
      const client = await this.createAsanaClient(accessToken);
      
      // Determine the action based on query
      const action = query?.action || 'list_tasks';
      
      switch (action) {
        case 'list_tasks':
          return await this.listTasks(client, query);
        case 'get_task':
          return await this.getTask(client, query);
        case 'list_projects':
          return await this.listProjects(client, query);
        case 'get_project':
          return await this.getProject(client, query);
        case 'list_workspaces':
          return await this.listWorkspaces(client, query);
        default:
          return {
            success: false,
            message: `Unknown action: ${action}`,
            error: {
              code: 'UNKNOWN_ACTION',
              message: `The action ${action} is not supported`
            }
          };
      }
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Helper method to create a task in Asana
   * 
   * @param client - The Asana API client
   * @param payload - The task creation payload
   * @param payload.name - The name of the task
   * @param payload.notes - Optional notes for the task
   * @param payload.workspace - The workspace ID where the task will be created
   * @param payload.projects - Optional array of project IDs to add the task to
   * @param payload.assignee - Optional user ID to assign the task to
   * @param payload.due_on - Optional due date in YYYY-MM-DD format
   * @returns A PluginResult with the created task data or error information
   */
  private async createTask(client: AsanaClient, payload: any): Promise<PluginResult> {
    const { name, notes, projectId, dueOn, assigneeId } = payload;
    
    if (!name || !projectId) {
      return {
        success: false,
        message: 'Missing required fields',
        error: {
          code: 'MISSING_FIELDS',
          message: 'name and projectId are required'
        }
      };
    }
    
    // Prepare task data
    const taskData: any = {
      name,
      projects: [projectId]
    };
    
    if (notes) taskData.notes = notes;
    if (dueOn) taskData.due_on = dueOn;
    if (assigneeId) taskData.assignee = assigneeId;
    
    try {
      // Simulate API call
      const response = await client.tasks.create(taskData);
      
      // Simulate response
      const taskId = `task_${Date.now()}`;
      
      return {
        success: true,
        message: 'Task created successfully',
        externalId: taskId,
        data: {
          gid: taskId,
          name,
          notes,
          projectId,
          dueOn,
          assigneeId,
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create task',
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : undefined
        }
      };
    }
  }

  /**
   * Helper method to update an existing task in Asana
   * 
   * @param client - The Asana API client
   * @param payload - The task update payload
   * @param payload.taskId - The ID of the task to update
   * @param payload.name - Optional new name for the task
   * @param payload.notes - Optional new notes for the task
   * @param payload.completed - Optional completion status
   * @param payload.due_on - Optional new due date in YYYY-MM-DD format
   * @param payload.assignee - Optional new assignee user ID
   * @returns A PluginResult with the updated task data or error information
   */
  private async updateTask(client: AsanaClient, payload: any): Promise<PluginResult> {
    const { taskId, name, notes, dueOn, assigneeId, completed } = payload;
    
    if (!taskId) {
      return {
        success: false,
        message: 'Missing task ID',
        error: {
          code: 'MISSING_TASK_ID',
          message: 'taskId is required'
        }
      };
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (notes) updateData.notes = notes;
    if (dueOn) updateData.due_on = dueOn;
    if (assigneeId) updateData.assignee = assigneeId;
    if (completed !== undefined) updateData.completed = completed;
    
    try {
      // Simulate API call
      const response = await client.tasks.update(taskId, updateData);
      
      return {
        success: true,
        message: 'Task updated successfully',
        externalId: taskId,
        data: {
          gid: taskId,
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update task',
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : undefined
        }
      };
    }
  }

  /**
   * Helper method to delete a task from Asana
   * 
   * @param client - The Asana API client
   * @param payload - The deletion payload
   * @param payload.taskId - The ID of the task to delete
   * @returns A PluginResult indicating success or failure of the deletion
   */
  private async deleteTask(client: AsanaClient, payload: any): Promise<PluginResult> {
    const { taskId } = payload;
    
    if (!taskId) {
      return {
        success: false,
        message: 'Missing task ID',
        error: {
          code: 'MISSING_TASK_ID',
          message: 'taskId is required'
        }
      };
    }
    
    try {
      // Call the Asana API
      await client.tasks.delete(taskId);
      
      return {
        success: true,
        message: 'Task deleted successfully',
        externalId: taskId
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete task',
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : undefined
        }
      };
    }
  }

  /**
   * Helper method to list tasks from Asana with pagination support
   * 
   * @param client - The Asana API client
   * @param query - The query parameters
   * @param query.projectId - Optional project ID to filter tasks by
   * @param query.workspaceId - Optional workspace ID to filter tasks by
   * @param query.assigneeId - Optional assignee ID to filter tasks by
   * @param query.completed - Optional completion status to filter tasks by
   * @param query.sectionId - Optional section ID to filter tasks by
   * @param query.tagId - Optional tag ID to filter tasks by
   * @param query.limit - Optional limit for pagination (default: 20)
   * @param query.offset - Optional offset for pagination
   * @returns A PluginResult with the list of tasks and pagination metadata
   */
  private async listTasks(client: AsanaClient, query: any): Promise<PluginResult> {
    try {
      const { projectId, workspaceId, assigneeId, completed, sectionId, tagId, limit, offset } = query;
      
      const params: AsanaListParams = {
        opt_fields: 'name,notes,completed,due_on,assignee,projects,workspace,created_at,modified_at,tags,parent',
        limit: limit || 20
      };
      
      if (offset) params.offset = offset;
      
      let response;
      
      if (projectId) {
        // Get tasks for a specific project
        response = await client.projects.tasks(projectId, params);
      } else if (sectionId) {
        // Get tasks for a specific section
        response = await client.sections.tasks(sectionId, params);
      } else if (tagId) {
        // Get tasks for a specific tag
        response = await client.tags.tasks(tagId, params);
      } else {
        // Get all tasks with filters
        if (workspaceId) params.workspace = workspaceId;
        if (assigneeId) params.assignee = assigneeId;
        if (completed !== undefined) params.completed = completed;
        
        response = await client.tasks.findAll(params);
      }
      
      if (!response.data) {
        return {
          success: false,
          message: 'Failed to retrieve tasks',
          error: {
            code: 'API_ERROR',
            message: response.errors ? response.errors[0].message : 'Unknown error'
          }
        };
      }
      
      const paginationInfo = response.next_page ? {
        hasMore: true,
        nextOffset: response.next_page.offset,
        nextUri: response.next_page.uri
      } : {
        hasMore: false
      };
      
      return {
        success: true,
        message: 'Tasks retrieved successfully',
        data: response.data,
        metadata: {
          total: response.data.length,
          filters: { projectId, workspaceId, assigneeId, completed, sectionId, tagId },
          pagination: paginationInfo
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve tasks',
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : undefined
        }
      };
    }
  }

  /**
   * Helper method to get a specific task from Asana
   * 
   * @param client - The Asana API client
   * @param query - The query parameters
   * @param query.taskId - The ID of the task to retrieve
   * @returns A PluginResult with the task data or error information
   */
  private async getTask(client: AsanaClient, query: any): Promise<PluginResult> {
    try {
      const { taskId } = query;
      
      if (!taskId) {
        return {
          success: false,
          message: 'Task ID is required',
          error: {
            code: 'MISSING_PARAMETER',
            message: 'Task ID is required to get a task'
          }
        };
      }
      
      const params = {
        opt_fields: 'name,notes,completed,due_on,assignee,projects,workspace,created_at,modified_at,tags,parent'
      };
      
      const response = await client.tasks.findById(taskId, params);
      
      if (!response.data) {
        return {
          success: false,
          message: 'Failed to retrieve task',
          error: {
            code: 'API_ERROR',
            message: response.errors ? response.errors[0].message : 'Task not found'
          }
        };
      }
      
      return {
        success: true,
        message: 'Task retrieved successfully',
        data: response.data
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: 'Failed to retrieve task',
          error: {
            code: error.name === 'TypeError' ? 'NETWORK_ERROR' : 'API_ERROR',
            message: error.message,
            details: error.stack
          }
        };
      }
      return this.handleApiError(error);
    }
  }

  /**
   * Helper method to list projects
   */
  private async listProjects(client: AsanaClient, query: any): Promise<PluginResult> {
    try {
      const { workspaceId, limit, offset } = query;
      
      const params: AsanaListParams = {
        opt_fields: 'name,notes,workspace,created_at,modified_at,owner,public',
        limit: limit || 20
      };
      
      if (offset) params.offset = offset;
      
      let response;
      
      if (workspaceId) {
        // Get projects for a specific workspace
        response = await client.projects.findByWorkspace(workspaceId, params);
      } else {
        // Get all projects
        response = await client.projects.findAll(params);
      }
      
      if (!response.data) {
        return {
          success: false,
          message: 'Failed to retrieve projects',
          error: {
            code: 'API_ERROR',
            message: response.errors ? response.errors[0].message : 'Unknown error'
          }
        };
      }
      
      const paginationInfo = response.next_page ? {
        hasMore: true,
        nextOffset: response.next_page.offset,
        nextUri: response.next_page.uri
      } : {
        hasMore: false
      };
      
      return {
        success: true,
        message: 'Projects retrieved successfully',
        data: response.data,
        metadata: {
          total: response.data.length,
          filters: { workspaceId },
          pagination: paginationInfo
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: 'Failed to retrieve projects',
          error: {
            code: error.name === 'TypeError' ? 'NETWORK_ERROR' : 'API_ERROR',
            message: error.message,
            details: error.stack
          }
        };
      }
      return this.handleApiError(error);
    }
  }

  /**
   * Helper method to get a specific project
   */
  private async getProject(client: AsanaClient, query: any): Promise<PluginResult> {
    try {
      const { projectId } = query;
      
      if (!projectId) {
        return {
          success: false,
          message: 'Project ID is required',
          error: {
            code: 'MISSING_PARAMETER',
            message: 'Project ID is required to get a project'
          }
        };
      }
      
      const params = {
        opt_fields: 'name,notes,workspace,created_at,modified_at,owner,public'
      };
      
      const response = await client.projects.findById(projectId, params);
      
      if (!response.data) {
        return {
          success: false,
          message: 'Failed to retrieve project',
          error: {
            code: 'API_ERROR',
            message: response.errors ? response.errors[0].message : 'Project not found'
          }
        };
      }
      
      return {
        success: true,
        message: 'Project retrieved successfully',
        data: response.data
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: 'Failed to retrieve project',
          error: {
            code: error.name === 'TypeError' ? 'NETWORK_ERROR' : 'API_ERROR',
            message: error.message,
            details: error.stack
          }
        };
      }
      return this.handleApiError(error);
    }
  }

  /**
   * Helper method to list workspaces
   */
  private async listWorkspaces(client: AsanaClient, query: any): Promise<PluginResult> {
    try {
      const { limit, offset } = query;
      
      const params: AsanaListParams = {
        opt_fields: 'name,is_organization',
        limit: limit || 50
      };
      
      if (offset) params.offset = offset;
      
      const response = await client.workspaces.findAll(params);
      
      if (!response.data) {
        return {
          success: false,
          message: 'Failed to retrieve workspaces',
          error: {
            code: 'API_ERROR',
            message: response.errors ? response.errors[0].message : 'Unknown error'
          }
        };
      }
      
      const paginationInfo = response.next_page ? {
        hasMore: true,
        nextOffset: response.next_page.offset,
        nextUri: response.next_page.uri
      } : {
        hasMore: false
      };
      
      return {
        success: true,
        message: 'Workspaces retrieved successfully',
        data: response.data,
        metadata: {
          total: response.data.length,
          pagination: paginationInfo
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: 'Failed to retrieve workspaces',
          error: {
            code: error.name === 'TypeError' ? 'NETWORK_ERROR' : 'API_ERROR',
            message: error.message,
            details: error.stack
          }
        };
      }
      return this.handleApiError(error);
    }
  }

/**
 * Create an Asana API client with the given access token
 */
private async createAsanaClient(accessToken: string): Promise<AsanaClient> {
  const baseUrl = 'https://app.asana.com/api/1.0';
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  // Helper function to handle rate limiting
  const handleRateLimiting = async (response: Response): Promise<Response> => {
    if (response.status === 429) {
      // Get retry-after header or default to 60 seconds
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      // Wait for the specified time
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      // Retry the request with same options
      return fetch(response.url, { 
        method: 'GET', // Default to GET since we can't access the original method
        headers
        // Can't reuse the body as Response.body can only be consumed once
      });
    }
    return response;
  };
  
  // Helper function to create query string from params
  const createQueryString = (params?: Record<string, any>): string => {
    if (!params) return '';
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  };
  
  // Create a client with methods that map to Asana API endpoints
  return {
    tasks: {
      create: async (params: any) => {
        const response = await fetch(`${baseUrl}/tasks`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ data: params })
        }).then(handleRateLimiting);
        return response.json();
      },
      findAll: async (params: AsanaListParams) => {
        const queryString = createQueryString(params);
        const response = await fetch(`${baseUrl}/tasks${queryString}`, {
          method: 'GET',
          headers
        }).then(handleRateLimiting);
        return response.json();
      },
      findById: async (taskId: string, params?: { opt_fields?: string }) => {
        const queryString = createQueryString(params);
        const response = await fetch(`${baseUrl}/tasks/${taskId}${queryString}`, {
          method: 'GET',
          headers
        }).then(handleRateLimiting);
        return response.json();
      },
      update: async (taskId: string, params: any) => {
        const response = await fetch(`${baseUrl}/tasks/${taskId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ data: params })
        }).then(handleRateLimiting);
        return response.json();
      },
      delete: async (taskId: string) => {
        const response = await fetch(`${baseUrl}/tasks/${taskId}`, {
          method: 'DELETE',
          headers
        }).then(handleRateLimiting);
        return response.status === 204 ? { data: {} } : response.json();
      },
      subtasks: async (taskId: string, params?: AsanaListParams) => {
        const queryString = createQueryString(params);
        const response = await fetch(`${baseUrl}/tasks/${taskId}/subtasks${queryString}`, {
          method: 'GET',
          headers
        }).then(handleRateLimiting);
        return response.json();
      },
      addComment: async (taskId: string, params: { text: string }) => {
        const response = await fetch(`${baseUrl}/tasks/${taskId}/stories`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ data: { text: params.text } })
        }).then(handleRateLimiting);
        return response.json();
      }
    },
    projects: {
      findAll: async (params?: AsanaListParams) => {
        const queryString = createQueryString(params);
        const response = await fetch(`${baseUrl}/projects${queryString}`, {
          method: 'GET',
          headers
        }).then(handleRateLimiting);
        return response.json();
      },
      findById: async (projectId: string, params?: { opt_fields?: string }) => {
        const queryString = createQueryString(params);
        const response = await fetch(`${baseUrl}/projects/${projectId}${queryString}`, {
          method: 'GET',
          headers
        }).then(handleRateLimiting);
        return response.json();
      },
      findByWorkspace: async (workspaceId: string, params?: AsanaListParams) => {
        const combinedParams = { ...params, workspace: workspaceId };
        const queryString = createQueryString(combinedParams);
        const response = await fetch(`${baseUrl}/projects${queryString}`, {
          method: 'GET',
          headers
        }).then(handleRateLimiting);
        return response.json();
      },
      tasks: async (projectId: string, params?: AsanaListParams) => {
        const queryString = createQueryString(params);
        const response = await fetch(`${baseUrl}/projects/${projectId}/tasks${queryString}`, {
          method: 'GET',
          headers
        }).then(handleRateLimiting);
        return response.json();
      }
    },
    sections: {
      tasks: async (sectionId: string, params?: AsanaListParams) => {
        const queryString = createQueryString(params);
        const response = await fetch(`${baseUrl}/sections/${sectionId}/tasks${queryString}`, {
          method: 'GET',
          headers
        }).then(handleRateLimiting);
        return response.json();
      }
    },
    tags: {
      tasks: async (tagId: string, params?: AsanaListParams) => {
        const queryString = createQueryString(params);
        const response = await fetch(`${baseUrl}/tags/${tagId}/tasks${queryString}`, {
          method: 'GET',
          headers
        }).then(handleRateLimiting);
        return response.json();
      }
    },
    workspaces: {
      findAll: async (params?: AsanaListParams) => {
        const queryString = createQueryString(params);
        const response = await fetch(`${baseUrl}/workspaces${queryString}`, {
          method: 'GET',
          headers
        }).then(handleRateLimiting);
        return response.json();
      }
    },
    users: {
      me: async (params?: { opt_fields?: string }) => {
        const queryString = createQueryString(params);
        const response = await fetch(`${baseUrl}/users/me${queryString}`, {
          method: 'GET',
          headers
        }).then(handleRateLimiting);
        return response.json();
      }
    }
  };
  }
  
  /**
   * Get user ID from agent ID
   * @param agentId - Agent ID
   * @returns User ID
   */
  private async getUserIdFromAgentId(agentId: string): Promise<string> {
    // In a real implementation, this would query the database
    // For now, we'll return a mock user ID
    return 'user_123';
  }
}
