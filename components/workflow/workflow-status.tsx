'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useWorkflowSocket, WorkflowUpdate } from '@/lib/hooks/useWorkflowSocket';
import { WorkflowStatus } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';

interface WorkflowStatusProps {
  workflowId: string;
}

const statusColors: Record<WorkflowStatus, string> = {
  DRAFT: 'bg-gray-500',
  ACTIVE: 'bg-blue-500',
  ARCHIVED: 'bg-gray-700',
};

export function WorkflowStatusCard({ workflowId }: WorkflowStatusProps) {
  const [status, setStatus] = useState<WorkflowUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useWorkflowSocket(workflowId, {
    onUpdate: (update) => {
      setStatus(update);
      setError(null);
    },
    onError: (error) => {
      setError(error.error);
    },
  });

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workflow Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Workflow Status</CardTitle>
          <Badge className={statusColors[status.status]}>
            {status.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {status.progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(status.progress * 100)}%</span>
              </div>
              <Progress value={status.progress * 100} />
            </div>
          )}
          
          {status.currentTask && (
            <div className="text-sm">
              <span className="font-medium">Current Task:</span>{' '}
              {status.currentTask}
            </div>
          )}
          
          {error && (
            <div className="text-sm text-red-500">
              <span className="font-medium">Error:</span> {error}
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            Last updated {formatDistanceToNow(new Date(status.timestamp), { addSuffix: true })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 