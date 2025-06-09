import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient, ApiResponse } from '../api-client'
import { Agent, Task, Workflow, WorkflowExecution, ChatMessage, KnowledgeBase, AgentMemory } from '../types'
import { useAuth } from '../auth/supabase-auth-provider'

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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, session, loading: authLoading } = useAuth();

  const fetchAgents = async () => {
    if (authLoading) {
      console.log('🔐 useAgents auth state: Auth still loading, skipping fetch');
      return;
    }

    if (!user || !session) {
      console.log('🔐 useAgents auth state: No user or session, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 useAgents auth state:', {
        user: user ? 'Present' : 'null',
        session: session ? 'Present' : 'null',
        authLoading,
        isAuthenticated: !!user,
        userId: user?.id
      });

      console.log('🔑 Making API call to /api/agents with token');
      
      const response = await fetch('/api/agents', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ API Error:', errorData);
        throw new Error(`Failed to fetch agents: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      console.log('📋 Raw API response:', data);
      
      // Handle different response formats
      const agentsArray = data.agents || data.data || data || [];
      console.log('📋 Agents array:', agentsArray);
      
      // Transform the data to match frontend interface
      const transformedAgents = agentsArray.map(transformAgentData);
      console.log('🔄 Transformed agents:', transformedAgents);
      
      setAgents(transformedAgents);
    } catch (err) {
      console.error('❌ useAgents error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
      setAgents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [user, session, authLoading]);

  const createAgent = async (agentData: {
    name: string;
    description?: string;
    avatar_url?: string;
    tools?: string[];
    preferences?: string[];
  }) => {
    if (!user || !session) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create agent: ${response.status} ${errorData}`);
      }

      const newAgent = await response.json();
      const transformedAgent = transformAgentData(newAgent);
      
      setAgents(prev => [...prev, transformedAgent]);
      return transformedAgent;
    } catch (err) {
      console.error('❌ createAgent error:', err);
      throw err;
    }
  };

  return {
    agents,
    loading,
    error,
    refetch: fetchAgents,
    createAgent,
  };
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

// Transform API response to match frontend Agent interface
function transformAgentData(apiAgent: any): Agent {
  // Create default memory object if not present
  const defaultMemory: AgentMemory = {
    weeklyGoals: 'No weekly goals set',
    recentLearnings: [],
    preferences: [],
    skillsUnlocked: [],
    memoryLogs: []
  };

  // Transform the API response to match the frontend interface
  return {
    id: apiAgent.id || '',
    name: apiAgent.name || 'Unknown Agent',
    role: apiAgent.description || 'General Assistant',
    avatar: apiAgent.avatar_url || '🤖',
    persona: apiAgent.description || 'A helpful AI assistant',
    tools: Array.isArray(apiAgent.tools) ? apiAgent.tools : 
           (apiAgent.tools && typeof apiAgent.tools === 'object') ? Object.keys(apiAgent.tools) : [],
    level: 1,
    status: 'active' as const,
    lastActive: apiAgent.updated_at || apiAgent.created_at || new Date().toISOString(),
    tasks: [],
    memory: apiAgent.memory || defaultMemory,
    joinedDate: apiAgent.created_at || new Date().toISOString(),
    totalTasksCompleted: 0,
    favoriteTools: Array.isArray(apiAgent.tools) ? apiAgent.tools.slice(0, 3) : []
  };
} 