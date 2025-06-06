/**
 * Task Executor Component
 * Allows executing tasks through the Plugin Engine
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

// Form schema for task execution
const taskSchema = z.object({
  tool: z.string({
    required_error: 'Please select a tool',
  }),
  intent: z.string({
    required_error: 'Please select an intent',
  }),
  context: z.string({
    required_error: 'Please provide context for the task',
  }).min(2, {
    message: 'Context must be at least 2 characters',
  }),
  schedule: z.boolean().default(false),
  scheduledTime: z.string().optional(),
});

// Available tools and their intents
const AVAILABLE_TOOLS = [
  {
    id: 'gmail',
    name: 'Gmail',
    intents: [
      { id: 'send_email', name: 'Send Email' },
      { id: 'create_draft', name: 'Create Draft' },
      { id: 'fetch_emails', name: 'Fetch Emails' },
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    intents: [
      { id: 'create_page', name: 'Create Page' },
      { id: 'update_page', name: 'Update Page' },
      { id: 'search_pages', name: 'Search Pages' },
      { id: 'query_database', name: 'Query Database' },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    intents: [
      { id: 'send_message', name: 'Send Message' },
      { id: 'schedule_message', name: 'Schedule Message' },
      { id: 'fetch_messages', name: 'Fetch Messages' },
      { id: 'list_channels', name: 'List Channels' },
    ],
  },
];

// Context examples for different intents
const CONTEXT_EXAMPLES: Record<string, string> = {
  send_email: `{
  "to": "recipient@example.com",
  "subject": "Meeting Tomorrow",
  "body": "Hi there,\\n\\nJust a reminder about our meeting tomorrow at 2pm.\\n\\nBest regards,\\nYour Agent"
}`,
  create_draft: `{
  "to": "recipient@example.com",
  "subject": "Project Update",
  "body": "Here's the latest update on our project..."
}`,
  fetch_emails: `{
  "query": "is:unread",
  "maxResults": 10
}`,
  create_page: `{
  "title": "Meeting Notes",
  "content": "# Meeting Notes\\n\\n## Agenda\\n\\n- Project updates\\n- Timeline discussion\\n- Action items",
  "parent": "database_id_or_page_id"
}`,
  update_page: `{
  "pageId": "page_id_to_update",
  "properties": {
    "Status": "Completed",
    "Priority": "High"
  },
  "content": "Updated content here..."
}`,
  search_pages: `{
  "query": "project notes",
  "sort": "last_edited_time",
  "filter": {
    "property": "Status",
    "status": {
      "equals": "Active"
    }
  }
}`,
  query_database: `{
  "databaseId": "database_id",
  "filter": {
    "property": "Status",
    "status": {
      "equals": "In Progress"
    }
  },
  "sorts": [
    {
      "property": "Priority",
      "direction": "descending"
    }
  ]
}`,
  send_message: `{
  "channel": "general",
  "text": "Hello team! This is an automated message from your agent."
}`,
  schedule_message: `{
  "channel": "project-updates",
  "text": "Reminder: Team meeting in 15 minutes!",
  "post_at": "${new Date(Date.now() + 15 * 60 * 1000).toISOString()}"
}`,
  fetch_messages: `{
  "channel": "general",
  "limit": 10,
  "oldest": "${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}"
}`,
  list_channels: `{
  "excludeArchived": true,
  "types": "public_channel,private_channel"
}`,
};

export function TaskExecutor() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      schedule: false,
    },
  });
  
  const watchTool = form.watch('tool');
  const watchIntent = form.watch('intent');
  const watchSchedule = form.watch('schedule');
  
  // Update selected tool when form value changes
  if (watchTool !== selectedTool) {
    setSelectedTool(watchTool);
    form.setValue('intent', '');
    form.setValue('context', '');
  }
  
  // Update context example when intent changes
  if (watchIntent && CONTEXT_EXAMPLES[watchIntent] && !form.getValues('context')) {
    form.setValue('context', CONTEXT_EXAMPLES[watchIntent]);
  }
  
  const onSubmit = async (data: z.infer<typeof taskSchema>) => {
    setIsSubmitting(true);
    setResult(null);
    
    try {
      // Parse the context string to JSON
      let contextObj;
      try {
        contextObj = JSON.parse(data.context);
      } catch (err) {
        toast.error('Invalid JSON in context field');
        setIsSubmitting(false);
        return;
      }
      
      // Create the task intent payload
      const payload = {
        tool: data.tool,
        intent: data.intent,
        context: contextObj,
        agentId: 'agent_123', // Replace with actual agent ID
        userId: 'user_456',   // Replace with actual user ID
      };
      
      // Add scheduled time if needed
      if (data.schedule && data.scheduledTime) {
        payload.scheduledTime = new Date(data.scheduledTime).toISOString();
      }
      
      // Send the request to the API
      const response = await fetch('/api/plugin-engine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to execute task');
      }
      
      const responseData = await response.json();
      setResult(responseData);
      
      toast.success(data.schedule 
        ? 'Task scheduled successfully' 
        : 'Task executed successfully'
      );
    } catch (err) {
      console.error('Error executing task:', err);
      toast.error(err.message || 'Failed to execute task');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Execute Task</CardTitle>
          <CardDescription>
            Send a task to the Plugin Engine for execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tool</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a tool" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AVAILABLE_TOOLS.map((tool) => (
                            <SelectItem key={tool.id} value={tool.id}>
                              {tool.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="intent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intent</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!selectedTool}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an intent" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedTool &&
                            AVAILABLE_TOOLS.find(t => t.id === selectedTool)?.intents.map((intent) => (
                              <SelectItem key={intent.id} value={intent.id}>
                                {intent.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Context (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter JSON context for the task"
                        className="font-mono h-48"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide the context for the task in JSON format
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="schedule"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Schedule for later</FormLabel>
                        <FormDescription>
                          Schedule this task to run at a specific time
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                {watchSchedule && (
                  <FormField
                    control={form.control}
                    name="scheduledTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {watchSchedule ? 'Scheduling...' : 'Executing...'}
                  </>
                ) : (
                  watchSchedule ? 'Schedule Task' : 'Execute Task'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 font-mono text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
