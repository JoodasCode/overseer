/**
 * Integrations Page
 * Displays available integrations and allows users to connect/disconnect them
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IntegrationCard } from '@/components/plugin-engine/integration-card';

interface Integration {
  id: string;
  toolName: string;
  name: string;
  description: string;
  status: 'active' | 'expired' | 'disconnected' | 'not_connected';
  expiresAt?: string;
  scopes?: string[];
}

// Sample integration metadata
const INTEGRATION_METADATA: Record<string, { name: string; description: string }> = {
  gmail: {
    name: 'Gmail',
    description: 'Send and receive emails, create drafts, and manage labels'
  },
  notion: {
    name: 'Notion',
    description: 'Create and manage content in Notion databases and pages'
  },
  slack: {
    name: 'Slack',
    description: 'Send messages, schedule messages, and fetch channel history'
  }
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Handle URL params for OAuth callbacks
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const successParam = searchParams.get('success');
    const toolParam = searchParams.get('tool');
    
    if (errorParam && toolParam) {
      setError(`Failed to connect to ${toolParam}: ${errorParam}`);
      router.replace('/dashboard/integrations');
    }
    
    if (successParam === 'true' && toolParam) {
      setSuccess(`Successfully connected to ${toolParam}`);
      router.replace('/dashboard/integrations');
    }
  }, [searchParams, router]);
  
  // Fetch integrations
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user integrations from the API
        const response = await fetch('/api/plugin-engine/integrations');
        
        if (!response.ok) {
          throw new Error('Failed to fetch integrations');
        }
        
        const data = await response.json();
        
        // Get available tools
        const toolsResponse = await fetch('/api/plugin-engine');
        
        if (!toolsResponse.ok) {
          throw new Error('Failed to fetch available tools');
        }
        
        const toolsData = await toolsResponse.json();
        
        // Combine data to create integration objects
        const userIntegrations = data.integrations || [];
        const availableTools = toolsData.tools || [];
        
        const combinedIntegrations: Integration[] = availableTools.map((tool: any) => {
          const existingIntegration = userIntegrations.find(
            (i: any) => i.toolName === tool.id
          );
          
          return {
            id: existingIntegration?.id || tool.id,
            toolName: tool.id,
            name: tool.name || INTEGRATION_METADATA[tool.id]?.name || tool.id,
            description: tool.description || INTEGRATION_METADATA[tool.id]?.description || '',
            status: existingIntegration?.status || 'not_connected',
            expiresAt: existingIntegration?.expiresAt,
            scopes: existingIntegration?.scopes || tool.scopes
          };
        });
        
        setIntegrations(combinedIntegrations);
      } catch (err) {
        console.error('Error fetching integrations:', err);
        setError('Failed to load integrations. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchIntegrations();
  }, []);
  
  // Connect to an integration
  const handleConnect = async (toolName: string) => {
    try {
      // Generate a state parameter with user ID and CSRF token
      // In a real implementation, this would include the user ID from the session
      const userId = 'user_123'; // Replace with actual user ID
      const csrfToken = Math.random().toString(36).substring(2);
      const state = `${userId}:${csrfToken}`;
      
      // Redirect to OAuth authorization URL
      // In a real implementation, this would be a proper OAuth flow
      const authUrl = `/api/plugin-engine/oauth/authorize?tool=${toolName}&state=${state}`;
      window.location.href = authUrl;
    } catch (err) {
      console.error(`Error connecting to ${toolName}:`, err);
      toast.error(`Failed to connect to ${toolName}`);
    }
  };
  
  // Disconnect an integration
  const handleDisconnect = async (toolName: string) => {
    try {
      const response = await fetch('/api/plugin-engine/integrations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ toolName })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to disconnect ${toolName}`);
      }
      
      // Update the integration status
      setIntegrations(prevIntegrations =>
        prevIntegrations.map(integration =>
          integration.toolName === toolName
            ? { ...integration, status: 'not_connected', expiresAt: undefined }
            : integration
        )
      );
      
      toast.success(`Successfully disconnected from ${toolName}`);
    } catch (err) {
      console.error(`Error disconnecting from ${toolName}:`, err);
      toast.error(`Failed to disconnect from ${toolName}`);
    }
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your agent to external services and tools
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map(integration => (
            <IntegrationCard
              key={integration.toolName}
              integration={integration}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
