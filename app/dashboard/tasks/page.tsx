/**
 * Tasks Page
 * Allows users to execute and manage tasks through the Plugin Engine
 */

'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskExecutor } from '@/components/plugin-engine/task-executor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ScheduledTask {
  id: string;
  agentId: string;
  tool: string;
  intent: string;
  scheduledTime: string;
  status: 'scheduled' | 'completed' | 'failed' | 'canceled';
  result?: any;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('execute');

  // Fetch scheduled tasks
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, you would get the agent ID from the session or context
      const agentId = 'agent_123';
      
      const response = await fetch(`/api/plugin-engine/tasks?agentId=${agentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      toast.error('Failed to load scheduled tasks');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (activeTab === 'scheduled') {
      fetchTasks();
    }
  }, [activeTab]);
  
  // Cancel a scheduled task
  const handleCancelTask = async (taskId: string) => {
    try {
      const response = await fetch('/api/plugin-engine/tasks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel task');
      }
      
      // Update the task list
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: 'canceled' } : task
        )
      );
      
      toast.success('Task canceled successfully');
    } catch (err) {
      console.error('Error canceling task:', err);
      toast.error('Failed to cancel task');
    }
  };
  
  // Retry a failed task
  const handleRetryTask = async (taskId: string) => {
    try {
      const response = await fetch('/api/plugin-engine/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to retry task');
      }
      
      // Update the task list
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: 'scheduled' } : task
        )
      );
      
      toast.success('Task scheduled for retry');
    } catch (err) {
      console.error('Error retrying task:', err);
      toast.error('Failed to retry task');
    }
  };
  
  // Format the scheduled time
  const formatScheduledTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">
          Execute and manage tasks through the Plugin Engine
        </p>
      </div>
      
      <Tabs defaultValue="execute" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="execute">Execute Task</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Tasks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="execute" className="mt-6">
          <TaskExecutor />
        </TabsContent>
        
        <TabsContent value="scheduled" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Scheduled Tasks</CardTitle>
                <CardDescription>
                  View and manage your scheduled tasks
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchTasks} disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No scheduled tasks found
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <Card key={task.id} className="overflow-hidden">
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">
                              {task.tool} - {task.intent}
                            </h3>
                            {getStatusBadge(task.status)}
                          </div>
                          <div className="flex items-center gap-2">
                            {task.status === 'failed' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleRetryTask(task.id)}
                              >
                                Retry
                              </Button>
                            )}
                            {task.status === 'scheduled' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleCancelTask(task.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Scheduled for: {formatScheduledTime(task.scheduledTime)}
                        </p>
                      </div>
                      {task.result && (
                        <div className="p-4 bg-gray-50">
                          <p className="text-sm font-medium mb-1">Result:</p>
                          <pre className="bg-gray-100 p-2 rounded-md overflow-auto max-h-48 text-xs font-mono">
                            {JSON.stringify(task.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
