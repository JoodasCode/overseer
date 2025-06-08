'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useWorkflowSocket } from '@/lib/hooks/useWorkflowSocket';
import { WorkflowStatus } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface WorkflowExecutionProps {
  workflowId: string;
}

const statusColors: Record<WorkflowStatus, string> = {
  DRAFT: 'bg-gray-500',
  ACTIVE: 'bg-blue-500',
  ARCHIVED: 'bg-gray-700',
};

export function WorkflowExecution({ workflowId }: WorkflowExecutionProps) {
  const [status, setStatus] = useState<{
    status: WorkflowStatus;
    progress?: number;
    currentTask?: string;
    error?: string;
    timestamp: Date;
  } | null>(null);

  useWorkflowSocket(workflowId, {
    onUpdate: (update) => {
      setStatus(update);
    },
    onError: (error) => {
      setStatus(prev => prev ? { ...prev, error: error.error } : null);
    },
    onProgress: (progress) => {
      setStatus(prev => prev ? { ...prev, progress: progress.progress, currentTask: progress.currentTask } : null);
    },
  });

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workflow Execution</CardTitle>
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
          <CardTitle>Workflow Execution</CardTitle>
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
          
          {status.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {status.error}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="text-sm text-muted-foreground">
            Last updated {formatDistanceToNow(new Date(status.timestamp), { addSuffix: true })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 