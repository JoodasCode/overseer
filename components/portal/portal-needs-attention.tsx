'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  XCircle, 
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttentionItem {
  id: string;
  type: 'task_failed' | 'task_overdue' | 'agent_error' | 'workflow_failed' | 'approval_needed';
  title: string;
  description: string;
  agentName?: string;
  agentId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: string;
  actionUrl?: string;
}

interface PortalNeedsAttentionProps {
  items: AttentionItem[];
  onItemClick?: (item: AttentionItem) => void;
  onResolveClick?: (itemId: string) => void;
  className?: string;
}

export function PortalNeedsAttention({ 
  items, 
  onItemClick, 
  onResolveClick,
  className 
}: PortalNeedsAttentionProps) {
  // Get icon and colors for different item types
  const getItemTypeInfo = (type: AttentionItem['type']) => {
    switch (type) {
      case 'task_failed':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'task_overdue':
        return {
          icon: Clock,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      case 'agent_error':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'workflow_failed':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'approval_needed':
        return {
          icon: CheckCircle2,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  // Get priority badge colors
  const getPriorityColor = (priority: AttentionItem['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (items.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
            Needs Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="text-sm">All caught up! No items need attention.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
            Needs Attention
            <Badge variant="secondary" className="ml-2">
              {items.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {items.slice(0, 5).map((item) => {
          const typeInfo = getItemTypeInfo(item.type);
          const Icon = typeInfo.icon;
          
          return (
            <div
              key={item.id}
              className={cn(
                'p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer',
                typeInfo.bgColor,
                typeInfo.borderColor
              )}
              onClick={() => onItemClick?.(item)}
            >
              <div className="flex items-start space-x-3">
                <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', typeInfo.color)} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium truncate">
                      {item.title}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs ml-2', getPriorityColor(item.priority))}
                    >
                      {item.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      {item.agentName && (
                        <span className="truncate">Agent: {item.agentName}</span>
                      )}
                      <span>•</span>
                      <span>{formatTimestamp(item.timestamp)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {onResolveClick && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onResolveClick(item.id);
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {items.length > 5 && (
          <div className="text-center pt-2">
            <Button variant="ghost" size="sm" className="text-xs">
              View all {items.length} items
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 