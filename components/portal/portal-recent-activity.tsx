'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Settings, 
  UserPlus, 
  CheckCircle2,
  AlertTriangle,
  Database,
  Workflow,
  Brain,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityEntry {
  id: string;
  actor_type: 'user' | 'agent' | 'system';
  actor_id: string;
  actor_name?: string;
  action: string;
  meta: any;
  created_at: string;
}

interface PortalRecentActivityProps {
  activities: ActivityEntry[];
  className?: string;
}

export function PortalRecentActivity({ 
  activities, 
  className 
}: PortalRecentActivityProps) {
  // Get icon and colors for different activity types
  const getActivityInfo = (action: string, actorType: string) => {
    // Agent actions
    if (actorType === 'agent') {
      switch (action) {
        case 'chat_message':
          return { icon: MessageSquare, color: 'text-blue-500', bgColor: 'bg-blue-50' };
        case 'task_completed':
          return { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-50' };
        case 'memory_updated':
          return { icon: Brain, color: 'text-purple-500', bgColor: 'bg-purple-50' };
        case 'workflow_executed':
          return { icon: Workflow, color: 'text-indigo-500', bgColor: 'bg-indigo-50' };
        default:
          return { icon: Activity, color: 'text-gray-500', bgColor: 'bg-gray-50' };
      }
    }

    // User actions
    if (actorType === 'user') {
      switch (action) {
        case 'agent_created':
          return { icon: UserPlus, color: 'text-green-500', bgColor: 'bg-green-50' };
        case 'agent_updated':
          return { icon: Settings, color: 'text-blue-500', bgColor: 'bg-blue-50' };
        case 'chat_message':
          return { icon: MessageSquare, color: 'text-blue-500', bgColor: 'bg-blue-50' };
        default:
          return { icon: Activity, color: 'text-gray-500', bgColor: 'bg-gray-50' };
      }
    }

    // System actions
    switch (action) {
      case 'database_migration':
        return { icon: Database, color: 'text-cyan-500', bgColor: 'bg-cyan-50' };
      case 'system_error':
        return { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-50' };
      default:
        return { icon: Activity, color: 'text-gray-500', bgColor: 'bg-gray-50' };
    }
  };

  // Format activity description
  const formatActivityDescription = (activity: ActivityEntry) => {
    const { action, actor_type, actor_name, meta } = activity;

    switch (action) {
      case 'chat_message':
        return actor_type === 'agent' 
          ? `Responded to user message`
          : `Sent message to ${meta?.agent_name || 'agent'}`;
      
      case 'agent_created':
        return `Created new agent: ${meta?.agent_name || 'Unknown'}`;
      
      case 'agent_updated':
        return `Updated agent settings for ${meta?.agent_name || 'Unknown'}`;
      
      case 'task_completed':
        return `Completed task: ${meta?.task_title || 'Unnamed task'}`;
      
      case 'memory_updated':
        return `Updated memory context`;
      
      case 'workflow_executed':
        return `Executed workflow: ${meta?.workflow_name || 'Unnamed workflow'}`;
      
      case 'database_migration':
        return `Applied database migration: ${meta?.migration_name || 'Unknown'}`;
      
      case 'system_error':
        return `System error occurred: ${meta?.error_message || 'Unknown error'}`;
      
      default:
        return `Performed ${action.replace('_', ' ')}`;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Get actor display info
  const getActorInfo = (activity: ActivityEntry) => {
    switch (activity.actor_type) {
      case 'agent':
        return {
          name: activity.actor_name || `Agent ${activity.actor_id.slice(0, 8)}`,
          avatar: activity.meta?.agent_avatar || activity.actor_name?.charAt(0) || 'A',
          type: 'Agent'
        };
      case 'user':
        return {
          name: activity.actor_name || 'User',
          avatar: activity.actor_name?.charAt(0) || 'U',
          type: 'User'
        };
      case 'system':
        return {
          name: 'System',
          avatar: 'S',
          type: 'System'
        };
      default:
        return {
          name: 'Unknown',
          avatar: '?',
          type: 'Unknown'
        };
    }
  };

  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Activity className="h-5 w-5 text-gray-500 mr-2" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No recent activity to show.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Activity className="h-5 w-5 text-gray-700 mr-2" />
          Recent Activity
          <Badge variant="secondary" className="ml-2">
            {activities.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, 8).map((activity) => {
            const activityInfo = getActivityInfo(activity.action, activity.actor_type);
            const actorInfo = getActorInfo(activity);
            const Icon = activityInfo.icon;
            
            return (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
              >
                {/* Activity Icon */}
                <div className={cn(
                  'rounded-full p-2 flex-shrink-0',
                  activityInfo.bgColor
                )}>
                  <Icon className={cn('h-3 w-3', activityInfo.color)} />
                </div>
                
                {/* Actor Avatar */}
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {actorInfo.avatar}
                  </AvatarFallback>
                </Avatar>
                
                {/* Activity Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm">
                      <span className="font-medium">{actorInfo.name}</span>
                      <span className="text-gray-600 ml-1">
                        {formatActivityDescription(activity)}
                      </span>
                    </p>
                    <Badge variant="outline" className="text-xs ml-2">
                      {actorInfo.type}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(activity.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {activities.length > 8 && (
          <div className="text-center pt-4 border-t">
            <button className="text-sm text-blue-600 hover:text-blue-800">
              View all activity →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 