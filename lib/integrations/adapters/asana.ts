import { IntegrationAdapter, IntegrationAction, IntegrationCapability } from '../types';

/**
 * Asana Integration Adapter
 * Provides task management capabilities through Asana API
 */
export class AsanaAdapter implements IntegrationAdapter {
  name = 'asana';
  private baseUrl = 'https://app.asana.com/api/1.0';

  async executeAction(action: IntegrationAction, params: any, authToken: string): Promise<any> {
    const { action: actionType, ...actionParams } = action;
    
    switch (actionType) {
      case 'createTask':
        return this.createTask(actionParams, authToken);
      case 'listTasks':
        return this.listTasks(actionParams, authToken);
      case 'updateTask':
        return this.updateTask(actionParams, authToken);
      case 'listProjects':
        return this.listProjects(authToken);
      case 'addTaskToProject':
        return this.addTaskToProject(actionParams, authToken);
      default:
        throw new Error(`Unknown Asana action: ${actionType}`);
    }
  }
  
  async getCapabilities(): Promise<IntegrationCapability[]> {
    return [
      {
        action: 'createTask',
        description: 'Create a new task in Asana',
        parameters: {
          name: { type: 'string', required: true, description: 'Task name' },
          notes: { type: 'string', required: false, description: 'Task description' },
          projects: { type: 'array', required: false, description: 'Array of project IDs' },
          assignee: { type: 'string', required: false, description: 'User ID to assign task to' },
          due_on: { type: 'string', required: false, description: 'Due date (YYYY-MM-DD)' }
        }
      },
      {
        action: 'listTasks',
        description: 'List tasks from a project or assigned to user',
        parameters: {
          project: { type: 'string', required: false, description: 'Project ID' },
          assignee: { type: 'string', required: false, description: 'User ID' },
          limit: { type: 'number', required: false, description: 'Number of tasks to return' }
        }
      },
      {
        action: 'updateTask',
        description: 'Update an existing task',
        parameters: {
          task: { type: 'string', required: true, description: 'Task ID' },
          name: { type: 'string', required: false, description: 'New task name' },
          notes: { type: 'string', required: false, description: 'New task description' },
          completed: { type: 'boolean', required: false, description: 'Mark task as completed' },
          due_on: { type: 'string', required: false, description: 'New due date (YYYY-MM-DD)' }
        }
      },
      {
        action: 'listProjects', 
        description: 'List all accessible projects',
        parameters: {
          limit: { type: 'number', required: false, description: 'Number of projects to return' }
        }
      },
      {
        action: 'addTaskToProject',
        description: 'Add an existing task to a project',
        parameters: {
          task: { type: 'string', required: true, description: 'Task ID' },
          project: { type: 'string', required: true, description: 'Project ID' }
        }
      }
    ];
  }
  
  async disconnect(userId: string): Promise<void> {
    // Token cleanup is handled by the UIC
    // Could add Asana-specific cleanup here if needed
    console.log(`Asana disconnected for user: ${userId}`);
  }
  
  private async createTask(params: any, authToken: string) {
    const taskData = {
      data: {
        name: params.name,
        notes: params.notes || '',
        projects: params.projects || [],
        assignee: params.assignee || null,
        due_on: params.due_on || null
      }
    };

    const response = await fetch(`${this.baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Asana API error (${response.status}): ${error}`);
    }
    
    return response.json();
  }
  
  private async listTasks(params: any, authToken: string) {
    const url = new URL(`${this.baseUrl}/tasks`);
    
    // Add query parameters
    if (params.project) {
      url.searchParams.set('project', params.project);
    }
    if (params.assignee) {
      url.searchParams.set('assignee', params.assignee);
    }
    if (params.limit) {
      url.searchParams.set('limit', params.limit.toString());
    }
    
    // Default fields to retrieve
    url.searchParams.set('opt_fields', 'name,notes,completed,due_on,assignee.name,projects.name');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Asana API error (${response.status}): ${error}`);
    }
    
    return response.json();
  }
  
  private async updateTask(params: any, authToken: string) {
    const { task: taskId, ...updateData } = params;
    
    const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: updateData })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Asana API error (${response.status}): ${error}`);
    }
    
    return response.json();
  }
  
  private async listProjects(authToken: string, params: any = {}) {
    const url = new URL(`${this.baseUrl}/projects`);
    
    if (params.limit) {
      url.searchParams.set('limit', params.limit.toString());
    }
    
    // Default fields to retrieve
    url.searchParams.set('opt_fields', 'name,color,notes,archived,public,created_at');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Asana API error (${response.status}): ${error}`);
    }
    
    return response.json();
  }
  
  private async addTaskToProject(params: any, authToken: string) {
    const { task: taskId, project: projectId } = params;
    
    const response = await fetch(`${this.baseUrl}/tasks/${taskId}/addProject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          project: projectId
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Asana API error (${response.status}): ${error}`);
    }
    
    return response.json();
  }

  /**
   * Helper method to get current user info
   * Useful for getting assignee IDs and workspace info
   */
  async getCurrentUser(authToken: string) {
    const response = await fetch(`${this.baseUrl}/users/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Asana API error (${response.status}): ${error}`);
    }
    
    return response.json();
  }

  /**
   * Helper method to search for users in workspace
   * Useful for finding assignee IDs
   */
  async searchUsers(query: string, authToken: string) {
    const url = new URL(`${this.baseUrl}/users`);
    url.searchParams.set('workspace', 'your_workspace_id'); // This would need to be dynamic
    url.searchParams.set('opt_fields', 'name,email');
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Asana API error (${response.status}): ${error}`);
    }
    
    const result = await response.json();
    
    // Filter by name/email containing query
    if (query) {
      result.data = result.data.filter((user: any) => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    return result;
  }
} 