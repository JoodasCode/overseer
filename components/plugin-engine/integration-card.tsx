/**
 * Integration Card Component
 * Displays an integration and allows connecting/disconnecting
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface IntegrationCardProps {
  integration: {
    id: string;
    toolName: string;
    name: string;
    description: string;
    status: 'active' | 'expired' | 'disconnected' | 'not_connected';
    expiresAt?: string;
    scopes?: string[];
  };
  onConnect: (toolName: string) => void;
  onDisconnect: (toolName: string) => void;
}

export function IntegrationCard({ integration, onConnect, onDisconnect }: IntegrationCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await onConnect(integration.toolName);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await onDisconnect(integration.toolName);
    } finally {
      setIsLoading(false);
    }
  };
  
  const isConnected = integration.status === 'active';
  const isExpired = integration.status === 'expired';
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{integration.name}</CardTitle>
          {isConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Connected
            </Badge>
          )}
          {isExpired && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Expired
            </Badge>
          )}
          {!isConnected && !isExpired && (
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              Not Connected
            </Badge>
          )}
        </div>
        <CardDescription>{integration.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected && integration.expiresAt && (
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            <span>
              Token expires {formatDistanceToNow(new Date(integration.expiresAt), { addSuffix: true })}
            </span>
          </div>
        )}
        
        {integration.scopes && integration.scopes.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium mb-1">Permissions:</p>
            <div className="flex flex-wrap gap-1">
              {integration.scopes.map((scope) => (
                <TooltipProvider key={scope}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="text-xs">
                        {scope.split(':').pop()}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{scope}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {isConnected ? (
          <Button 
            variant="outline" 
            onClick={handleDisconnect} 
            disabled={isLoading}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            {isLoading ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        ) : (
          <Button 
            onClick={handleConnect} 
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </Button>
        )}
        
        <Button variant="ghost" size="icon" asChild>
          <a href={`https://example.com/docs/${integration.toolName}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
