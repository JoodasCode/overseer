import { useState, useEffect, useCallback } from 'react'
import { apiClient, ApiResponse } from '../api-client'
import { Agent, Task, Workflow, WorkflowExecution, ChatMessage, KnowledgeBase } from '../types'

// Generic hook for API calls
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiCall()
      
      if (response.error) {
        setError(response.error)
        setData(null)
      } else {
        setData(response.data || null)
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, dependencies)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// Specific hooks for different entities

// Agents
export function useAgents() {
  return useApi(() => apiClient.getAgents())
}

export function useAgent(id: string) {
  return useApi(() => apiClient.getAgent(id), [id])
}

export function useAgentMemory(agentId: string) {
  return useApi(() => apiClient.getAgentMemory(agentId), [agentId])
}

// Tasks
export function useTasks(agentId?: string) {
  return useApi(() => apiClient.getTasks(agentId), [agentId])
}

export function useTask(id: string) {
  return useApi(() => apiClient.getTask(id), [id])
}

// Workflows
export function useWorkflows() {
  return useApi(() => apiClient.getWorkflows())
}

export function useWorkflow(id: string) {
  return useApi(() => apiClient.getWorkflow(id), [id])
}

export function useWorkflowExecutions(workflowId?: string) {
  return useApi(() => apiClient.getWorkflowExecutions(workflowId), [workflowId])
}

// Chat
export function useChatMessages(agentId: string) {
  return useApi(() => apiClient.getChatMessages(agentId), [agentId])
}

// Knowledge Base
export function useKnowledgeBases() {
  return useApi(() => apiClient.getKnowledgeBases())
}

export function useKnowledgeBase(id: string) {
  return useApi(() => apiClient.getKnowledgeBase(id), [id])
}

export function useKnowledgeBaseItems(kbId: string) {
  return useApi(() => apiClient.getKnowledgeBaseItems(kbId), [kbId])
}

// Error Monitoring
export function useErrorLogs(page = 1, limit = 50) {
  return useApi(() => apiClient.getErrorLogs(page, limit), [page, limit])
}

export function useErrorTrends() {
  return useApi(() => apiClient.getErrorTrends())
}

// User API Keys
export function useUserApiKeys() {
  return useApi(() => apiClient.getUserApiKeys())
}

// Mutation hooks for create/update/delete operations
export function useCreateAgent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createAgent = useCallback(async (agent: Partial<Agent>) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.createAgent(agent)
      
      if (response.error) {
        setError(response.error)
        return null
      }
      
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { createAgent, loading, error }
}

export function useUpdateAgent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateAgent = useCallback(async (id: string, updates: Partial<Agent>) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.updateAgent(id, updates)
      
      if (response.error) {
        setError(response.error)
        return null
      }
      
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agent')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { updateAgent, loading, error }
}

export function useDeleteAgent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteAgent = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.deleteAgent(id)
      
      if (response.error) {
        setError(response.error)
        return false
      }
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { deleteAgent, loading, error }
}

export function useCreateTask() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTask = useCallback(async (task: Partial<Task>) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.createTask(task)
      
      if (response.error) {
        setError(response.error)
        return null
      }
      
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { createTask, loading, error }
}

export function useUpdateTask() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.updateTask(id, updates)
      
      if (response.error) {
        setError(response.error)
        return null
      }
      
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { updateTask, loading, error }
}

export function useSendChatMessage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (agentId: string, message: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.sendChatMessage(agentId, message)
      
      if (response.error) {
        setError(response.error)
        return null
      }
      
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { sendMessage, loading, error }
}

export function useExecuteWorkflow() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeWorkflow = useCallback(async (id: string, input?: any) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.executeWorkflow(id, input)
      
      if (response.error) {
        setError(response.error)
        return null
      }
      
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute workflow')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { executeWorkflow, loading, error }
} 