import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient, ApiResponse } from '../api-client'
import { Agent, Task, Workflow, WorkflowExecution, ChatMessage, KnowledgeBase, AgentMemory } from '../types'
import { useAuth } from '../auth/supabase-auth-provider'
import { safeJsonParse, safeParseAgentMemory } from '../utils/safe-json'

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
  const fetchedRef = useRef(false);

  const fetchAgents = useCallback(async () => {
    if (authLoading) {
      console.log('🔐 useAgents auth state: Auth still loading, skipping fetch');
      return;
    }

    if (!user || !session) {
      console.log('🔐 useAgents auth state: No user or session, skipping fetch');
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous requests
    if (fetchedRef.current) {
      console.log('🔐 useAgents: Already fetched, skipping duplicate request');
      return;
    }

    try {
      fetchedRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('🔐 useAgents auth state:', {
        user: user ? 'Present' : 'null',
        session: session ? 'Present' : 'null',
        authLoading,
        isAuthenticated: !!user,
        userId: user?.id,
        accessToken: session?.access_token ? `${session.access_token.substring(0, 20)}...` : 'null'
      });

      console.log('🔑 Making API call to /api/agents with token');
      
      const authHeader = `Bearer ${session.access_token}`;
      console.log('📤 Authorization header being sent:', session?.access_token ? `Bearer ${session.access_token.substring(0, 20)}...` : 'Bearer null');
      
      const response = await fetch('/api/agents', {
        headers: {
          'Authorization': authHeader,
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
      // Reset the fetch flag after a delay to allow manual refetch
      setTimeout(() => {
        fetchedRef.current = false;
      }, 1000);
    }
  }, [user?.id, session?.access_token, authLoading]); // Only depend on essential values

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const refetch = useCallback(() => {
    fetchedRef.current = false;
    fetchAgents();
  }, [fetchAgents]);

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

  const deleteAgent = async (agentId: string) => {
    try {
      const response = await apiClient.deleteAgent(agentId);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Remove agent from local state
      setAgents(prev => prev.filter(agent => agent.id !== agentId));
      return true;
    } catch (err) {
      console.error('❌ deleteAgent error:', err);
      throw err;
    }
  };

  return {
    agents,
    loading,
    error,
    refetch,
    createAgent,
    deleteAgent,
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

// Analytics hook
export function useAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, session, loading: authLoading } = useAuth();

  const fetchAnalytics = async () => {
    if (authLoading) {
      console.log('🔐 useAnalytics: Auth still loading, skipping fetch');
      return;
    }

    if (!user || !session) {
      console.log('🔐 useAnalytics: No user or session, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Making API call to /api/analytics');
      
      const response = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Analytics API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Analytics API Error:', errorData);
        throw new Error(`Failed to fetch analytics: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      console.log('📊 Analytics data:', data);
      
      setAnalytics(data.analytics);
    } catch (err) {
      console.error('❌ useAnalytics error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user, session, authLoading]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}

// User Integrations hook
export function useUserIntegrations() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, session, loading: authLoading } = useAuth();

  const fetchIntegrations = async () => {
    if (authLoading) {
      console.log('🔐 useUserIntegrations: Auth still loading, skipping fetch');
      return;
    }

    if (!user || !session) {
      console.log('🔐 useUserIntegrations: No user or session, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔌 Making API call to /api/plugin-engine/integrations');
      
      const response = await fetch('/api/plugin-engine/integrations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔌 Integrations API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Integrations API Error:', errorData);
        throw new Error(`Failed to fetch integrations: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      console.log('🔌 Integrations data:', data);
      
      // Transform the data to include available integrations
      const availableIntegrations = [
        {
          id: "gmail",
          name: "Gmail",
          icon: "📧",
          category: "communication",
          description: "Send emails and manage inbox",
          permissions: ["Read emails", "Send emails", "Manage labels"],
        },
        {
          id: "slack",
          name: "Slack",
          icon: "💬",
          category: "communication",
          description: "Send messages and notifications",
          permissions: ["Send messages", "Read channels", "Manage notifications"],
        },
        {
          id: "notion",
          name: "Notion",
          icon: "📝",
          category: "productivity",
          description: "Manage documents and databases",
          permissions: ["Read pages", "Create pages", "Update databases"],
        },
        {
          id: "hubspot",
          name: "HubSpot",
          icon: "🎯",
          category: "crm",
          description: "Manage contacts and deals",
          permissions: ["Read contacts", "Create deals", "Update properties"],
        },
        {
          id: "linkedin",
          name: "LinkedIn",
          icon: "💼",
          category: "social",
          description: "Post content and manage connections",
          permissions: ["Post updates", "Read profile", "Manage connections"],
        },
        {
          id: "google-analytics",
          name: "Google Analytics",
          icon: "📊",
          category: "analytics",
          description: "Track website performance",
          permissions: ["Read analytics data", "Create reports"],
        },
      ];

      const userIntegrations = data.integrations || [];
      
             // Merge user integrations with available integrations
       const mergedIntegrations = availableIntegrations.map(available => {
         const userIntegration = userIntegrations.find((ui: any) => ui.toolName === available.id);
        return {
          ...available,
          status: userIntegration?.status || 'disconnected',
          lastSync: userIntegration ? 'Recently' : undefined,
          error: userIntegration?.status === 'error' ? 'Connection error' : undefined,
          hasApiKey: ['notion'].includes(available.id),
          hasOAuth: ['gmail', 'slack', 'hubspot', 'linkedin', 'google-analytics'].includes(available.id),
        };
      });
      
      setIntegrations(mergedIntegrations);
    } catch (err) {
      console.error('❌ useUserIntegrations error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch integrations');
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [user, session, authLoading]);

  return {
    integrations,
    loading,
    error,
    refetch: fetchIntegrations,
  };
}

// Transform API response to match frontend Agent interface
function transformAgentData(apiAgent: any): Agent {
  // Safely parse agent memory data
  const memory = safeParseAgentMemory(apiAgent.memory);

  // Safely parse tools array
  let tools: string[] = [];
  try {
    if (Array.isArray(apiAgent.tools)) {
      tools = apiAgent.tools;
    } else if (apiAgent.tools && typeof apiAgent.tools === 'object') {
      tools = Object.keys(apiAgent.tools);
    } else if (typeof apiAgent.tools === 'string') {
      // If tools is a JSON string, parse it safely
      tools = safeJsonParse(apiAgent.tools, []);
    }
  } catch (error) {
    console.warn('⚠️ Failed to parse agent tools, using empty array:', error);
    tools = [];
  }

  // Transform the API response to match the frontend interface
  return {
    id: apiAgent.id || '',
    name: apiAgent.name || 'Unknown Agent',
    role: apiAgent.description || 'General Assistant',
    avatar: apiAgent.avatar_url || '🤖',
    persona: apiAgent.description || 'A helpful AI assistant',
    tools,
    level: 1,
    status: 'active' as const,
    lastActive: apiAgent.updated_at || apiAgent.created_at || new Date().toISOString(),
    tasks: [],
    memory,
    joinedDate: apiAgent.created_at || new Date().toISOString(),
    totalTasksCompleted: 0,
    favoriteTools: tools.slice(0, 3)
  };
} 