/**
 * React Hook for Universal Integrations
 * Provides easy access to integration functionality from the frontend
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/supabase-auth-provider';

export interface IntegrationTool {
  id: string;
  name: string;
  description: string;
  connected?: boolean;
  actions: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  rateLimit: {
    requests: number;
    window: string;
  };
  requiresAuth: boolean;
}

export interface IntegrationStatus {
  tool: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSynced?: string;
  capabilities: {
    actions: string[];
    rateLimit?: {
      requests: number;
      window: string;
    };
  };
}

export interface IntegrationResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    tool: string;
    action: string;
    executionTime: number;
    cached: boolean;
  };
}

export function useIntegrations() {
  const { session } = useAuth();
  const [tools, setTools] = useState<IntegrationTool[]>([]);
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get authorization headers
  const getHeaders = useCallback(() => {
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }, [session]);

  // Load available tools
  const loadTools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/integrations/tools', {
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to load tools: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setTools(result.data.tools);
      } else {
        throw new Error(result.error || 'Failed to load tools');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Load tools error:', err);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  // Load integration statuses
  const loadStatuses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/integrations', {
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to load statuses: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setStatuses(result.data);
      } else {
        throw new Error(result.error || 'Failed to load statuses');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Load statuses error:', err);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  // Execute integration action
  const executeIntegration = useCallback(async (
    tool: string,
    action: string,
    params: Record<string, any> = {},
    agentId?: string
  ): Promise<IntegrationResult> => {
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          tool,
          action,
          params,
          agentId
        }),
      });

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        metadata: {
          tool,
          action,
          executionTime: 0,
          cached: false
        }
      };
    }
  }, [getHeaders]);

  // Connect to a tool (initiate OAuth)
  const connectTool = useCallback(async (tool: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/integrations/oauth/authorize?tool=${tool}`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get auth URL: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        return result.data.authUrl;
      } else {
        throw new Error(result.error || 'Failed to get auth URL');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Connect tool error:', err);
      return null;
    }
  }, [getHeaders]);

  // Disconnect from a tool
  const disconnectTool = useCallback(async (tool: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/integrations', {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ tool }),
      });

      const result = await response.json();
      if (result.success) {
        // Refresh statuses after disconnect
        await loadStatuses();
        return true;
      } else {
        throw new Error(result.error || 'Failed to disconnect');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Disconnect tool error:', err);
      return false;
    }
  }, [getHeaders, loadStatuses]);

  // Check if a tool is connected
  const isToolConnected = useCallback((tool: string): boolean => {
    const status = statuses.find(s => s.tool === tool);
    return status?.status === 'connected';
  }, [statuses]);

  // Get connected tools
  const getConnectedTools = useCallback((): string[] => {
    return statuses
      .filter(s => s.status === 'connected')
      .map(s => s.tool);
  }, [statuses]);

  // Refresh data
  const refresh = useCallback(async () => {
    await Promise.all([loadTools(), loadStatuses()]);
  }, [loadTools, loadStatuses]);

  // Load initial data when session is available
  useEffect(() => {
    if (session?.access_token) {
      refresh();
    }
  }, [session?.access_token, refresh]);

  return {
    // Data
    tools,
    statuses,
    loading,
    error,
    
    // Computed values
    connectedTools: getConnectedTools(),
    isAuthenticated: !!session?.access_token,
    
    // Actions
    executeIntegration,
    connectTool,
    disconnectTool,
    isToolConnected,
    refresh,
    loadTools,
    loadStatuses,
    
    // Utilities
    clearError: () => setError(null),
  };
} 