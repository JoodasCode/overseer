import { Agent, Task, Workflow, WorkflowExecution, ChatMessage, KnowledgeBase, KnowledgeBaseItem } from './types'
import { authTokenManager } from './auth-token-manager'

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success?: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// API Client Configuration
interface ApiClientConfig {
  baseUrl?: string
  timeout?: number
  retries?: number
}

class ApiClient {
  private baseUrl: string
  private timeout: number
  private retries: number

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || ''
    this.timeout = config.timeout || 10000
    this.retries = config.retries || 3
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const token = await authTokenManager.getToken()
      if (token) {
        return {
          'Authorization': `Bearer ${token}`
        }
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error)
    }
    return {}
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/api${endpoint}`
    
    // Get auth headers
    const authHeaders = await this.getAuthHeaders()
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        const response = await fetch(url, {
          ...options,
          headers: defaultHeaders,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          
          // For auth errors, return a structured response instead of throwing
          if (response.status === 401) {
            return {
              error: 'Unauthorized',
              success: false,
              data: undefined
            }
          }
          
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        return data
      } catch (error) {
        lastError = error as Error
        
        if (attempt === this.retries) {
          break
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }

    return {
      error: lastError?.message || 'Request failed',
      success: false
    }
  }

  // Agent API Methods
  async getAgents(): Promise<ApiResponse<Agent[]>> {
    return this.request<Agent[]>('/agents')
  }

  async getAgent(id: string): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/agents/${id}`)
  }

  async createAgent(agent: Partial<Agent>): Promise<ApiResponse<Agent>> {
    return this.request<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify(agent)
    })
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async deleteAgent(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/agents/${id}`, {
      method: 'DELETE'
    })
  }

  // Agent Memory API Methods
  async getAgentMemory(agentId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/agents/${agentId}/memory`)
  }

  async updateAgentMemory(agentId: string, memory: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/agents/${agentId}/memory`, {
      method: 'PUT',
      body: JSON.stringify(memory)
    })
  }

  async addAgentMemoryLog(agentId: string, log: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/agents/${agentId}/memory/logs`, {
      method: 'POST',
      body: JSON.stringify(log)
    })
  }

  // Tasks API Methods
  async getTasks(agentId?: string): Promise<ApiResponse<Task[]>> {
    const endpoint = agentId ? `/tasks?agentId=${agentId}` : '/tasks'
    return this.request<Task[]>(endpoint)
  }

  async getTask(id: string): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/tasks/${id}`)
  }

  async createTask(task: Partial<Task>): Promise<ApiResponse<Task>> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task)
    })
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async deleteTask(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/tasks/${id}`, {
      method: 'DELETE'
    })
  }

  // Workflows API Methods
  async getWorkflows(): Promise<ApiResponse<Workflow[]>> {
    return this.request<Workflow[]>('/workflows')
  }

  async getWorkflow(id: string): Promise<ApiResponse<Workflow>> {
    return this.request<Workflow>(`/workflows/${id}`)
  }

  async createWorkflow(workflow: Partial<Workflow>): Promise<ApiResponse<Workflow>> {
    return this.request<Workflow>('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow)
    })
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<ApiResponse<Workflow>> {
    return this.request<Workflow>(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async deleteWorkflow(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/workflows/${id}`, {
      method: 'DELETE'
    })
  }

  async executeWorkflow(id: string, input?: any): Promise<ApiResponse<WorkflowExecution>> {
    return this.request<WorkflowExecution>(`/workflows/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ input })
    })
  }

  // Workflow Executions API Methods
  async getWorkflowExecutions(workflowId?: string): Promise<ApiResponse<WorkflowExecution[]>> {
    const endpoint = workflowId ? `/workflow-executions?workflowId=${workflowId}` : '/workflow-executions'
    return this.request<WorkflowExecution[]>(endpoint)
  }

  async getWorkflowExecution(id: string): Promise<ApiResponse<WorkflowExecution>> {
    return this.request<WorkflowExecution>(`/workflow-executions/${id}`)
  }

  // Chat API Methods
  async getChatMessages(agentId: string): Promise<ApiResponse<ChatMessage[]>> {
    return this.request<ChatMessage[]>(`/chat/${agentId}`)
  }

  async sendChatMessage(agentId: string, message: string): Promise<ApiResponse<ChatMessage>> {
    return this.request<ChatMessage>(`/chat/${agentId}`, {
      method: 'POST',
      body: JSON.stringify({ message })
    })
  }

  // Knowledge Base API Methods
  async getKnowledgeBases(): Promise<ApiResponse<KnowledgeBase[]>> {
    return this.request<KnowledgeBase[]>('/knowledge-base')
  }

  async getKnowledgeBase(id: string): Promise<ApiResponse<KnowledgeBase>> {
    return this.request<KnowledgeBase>(`/knowledge-base/${id}`)
  }

  async createKnowledgeBase(kb: Partial<KnowledgeBase>): Promise<ApiResponse<KnowledgeBase>> {
    return this.request<KnowledgeBase>('/knowledge-base', {
      method: 'POST',
      body: JSON.stringify(kb)
    })
  }

  async updateKnowledgeBase(id: string, updates: Partial<KnowledgeBase>): Promise<ApiResponse<KnowledgeBase>> {
    return this.request<KnowledgeBase>(`/knowledge-base/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async deleteKnowledgeBase(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/knowledge-base/${id}`, {
      method: 'DELETE'
    })
  }

  // Knowledge Base Items API Methods
  async getKnowledgeBaseItems(kbId: string): Promise<ApiResponse<KnowledgeBaseItem[]>> {
    return this.request<KnowledgeBaseItem[]>(`/knowledge-base/${kbId}/items`)
  }

  async createKnowledgeBaseItem(kbId: string, item: Partial<KnowledgeBaseItem>): Promise<ApiResponse<KnowledgeBaseItem>> {
    return this.request<KnowledgeBaseItem>(`/knowledge-base/${kbId}/items`, {
      method: 'POST',
      body: JSON.stringify(item)
    })
  }

  async updateKnowledgeBaseItem(kbId: string, itemId: string, updates: Partial<KnowledgeBaseItem>): Promise<ApiResponse<KnowledgeBaseItem>> {
    return this.request<KnowledgeBaseItem>(`/knowledge-base/${kbId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async deleteKnowledgeBaseItem(kbId: string, itemId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/knowledge-base/${kbId}/items/${itemId}`, {
      method: 'DELETE'
    })
  }

  // Error Monitoring API Methods
  async getErrorLogs(page = 1, limit = 50): Promise<PaginatedResponse<any>> {
    return this.request<any[]>(`/error-logs?page=${page}&limit=${limit}`)
  }

  async getErrorTrends(): Promise<ApiResponse<any>> {
    return this.request<any>('/error-trends')
  }

  // User API Keys Methods
  async getUserApiKeys(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/user/api-keys')
  }

  async createUserApiKey(name: string): Promise<ApiResponse<any>> {
    return this.request<any>('/user/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name })
    })
  }

  async deleteUserApiKey(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/user/api-keys/${id}`, {
      method: 'DELETE'
    })
  }
}

// Create singleton instance
export const apiClient = new ApiClient() 