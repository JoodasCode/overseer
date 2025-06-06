# Plugin Engine Documentation

## Overview

The Plugin Engine is a modular system that enables Overseer - AgentOS to interact with external services through a standardized interface. It handles authentication, task execution, scheduling, error handling, and context mapping.

## Core Components

### PluginEngine

The central orchestrator that manages adapters and processes task intents.

```typescript
import { PluginEngine } from '@/lib/plugin-engine';

// Get the singleton instance
const pluginEngine = PluginEngine.getInstance();

// Process a task intent
const result = await pluginEngine.processIntent({
  agentId: 'agent_123',
  intent: 'send_email',
  tool: 'gmail',
  context: { to: 'recipient@example.com', subject: 'Hello', body: 'Message body' },
  userId: 'user_456'
});
```

### IntegrationManager

Manages OAuth integrations for different tools.

```typescript
import { IntegrationManager } from '@/lib/plugin-engine';

// Get the singleton instance
const integrationManager = IntegrationManager.getInstance();

// Get integration for a user
const integration = await integrationManager.getIntegration('user_123', 'gmail');

// Store a new integration
await integrationManager.storeIntegration({
  userId: 'user_123',
  toolName: 'gmail',
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  status: 'active',
  scopes: ['https://www.googleapis.com/auth/gmail.send']
});

// Remove an integration
await integrationManager.removeIntegration('user_123', 'gmail');
```

### ErrorHandler

Centralizes error logging, tracking, and fallback message handling. Provides robust error handling across all adapters with customizable fallback messages, retry policies, and error statistics.

```typescript
import { ErrorHandler } from '@/lib/plugin-engine';

// Get the singleton instance
const errorHandler = ErrorHandler.getInstance();

// Log an error
const errorId = await errorHandler.logError({
  userId: 'user_123',
  agentId: 'agent_456',
  tool: 'gmail',
  action: 'send_email',
  errorCode: 'AUTHENTICATION_ERROR',
  errorMessage: 'Authentication failed',
  payload: { to: 'recipient@example.com' },
  timestamp: new Date().toISOString(),
  resolved: false
});

// Get fallback message for a tool (optionally specific to an agent)
const fallbackMessage = errorHandler.getFallbackMessage('gmail', 'agent_456');

// Set a custom fallback message for a tool
errorHandler.setFallbackMessage('gmail', 'Unable to send email. Your message has been saved as a draft.');

// Set an agent-specific fallback message
errorHandler.setFallbackMessage('gmail', 'Agent X cannot send emails right now. Try again later.', 'agent_456');

// Check if a tool should be disabled due to excessive errors
const shouldDisable = await errorHandler.shouldDisableTool('agent_456', 'gmail');

// Resolve an error
await errorHandler.resolveError('error_123');

// Get errors for an agent
const errors = await errorHandler.getAgentErrors('agent_456', 10);

// Get error statistics by tool
const stats = await errorHandler.getErrorStatsByTool(7); // Last 7 days

// Get error trends over time
const trends = await errorHandler.getErrorTrends(30, 'gmail'); // Last 30 days for Gmail

// Bulk resolve multiple errors
const resolvedCount = await errorHandler.bulkResolveErrors(['error_123', 'error_456']);
```

### Scheduler

Manages task scheduling, retrieval, cancellation, and retry logic.

```typescript
import { Scheduler } from '@/lib/plugin-engine';

// Get the singleton instance
const scheduler = Scheduler.getInstance();

// Schedule a task
const taskId = await scheduler.scheduleTask({
  agentId: 'agent_123',
  userId: 'user_456',
  tool: 'gmail',
  action: 'send_email',
  payload: { to: 'recipient@example.com', subject: 'Hello', body: 'Message body' },
  executeAt: new Date(Date.now() + 3600000).toISOString()
});

// Get scheduled tasks for an agent
const tasks = await scheduler.getTasksByAgent('agent_123');

// Cancel a scheduled task
await scheduler.cancelTask('task_123');

// Process due tasks
await scheduler.processDueTasks();
```

### ContextMapper

Manages mappings between agent context and external service IDs, providing a bidirectional lookup system.

```typescript
import { ContextMapper } from '@/lib/plugin-engine';

// Get the singleton instance
const contextMapper = ContextMapper.getInstance();

// Create a new mapping
const mappingId = await contextMapper.createMapping({
  agentId: 'agent_123',
  userId: 'user_456',
  tool: 'notion',
  contextKey: 'project-x',
  externalId: 'notion-page-id-123',
  friendlyName: 'Project X',
  metadata: { type: 'project', status: 'active' }
});

// Get external ID from context key
const externalId = await contextMapper.getExternalId('agent_123', 'notion', 'project-x');

// Get context key from external ID
const contextKey = await contextMapper.getContextKey('agent_123', 'notion', 'notion-page-id-123');

// List all mappings for an agent and tool
const mappings = await contextMapper.listMappings('agent_123', 'notion');

// Bulk upsert mappings
const count = await contextMapper.bulkUpsertMappings([
  {
    agentId: 'agent_123',
    userId: 'user_456',
    tool: 'notion',
    contextKey: 'project-x',
    externalId: 'notion-page-id-123'
  },
  {
    agentId: 'agent_123',
    userId: 'user_456',
    tool: 'notion',
    contextKey: 'task-y',
    externalId: 'notion-page-id-456'
  }
]);
```

## Plugin Adapters

Plugin adapters implement the `PluginAdapter` interface to provide standardized interactions with external services.

## Supported Integrations

- Gmail - Email sending and management
- Notion - Document and database management
- Slack - Team communication
- Asana - Task and project management

### Interface Definition

```typescript
interface PluginAdapter {
  connect(userId: string): Promise<AuthStatus>;
  isConnected(userId: string): Promise<boolean>;
  send(agentId: string, payload: any): Promise<PluginResult>;
  fetch(agentId: string, query?: any): Promise<PluginResult>;
  disconnect(userId: string): Promise<void>;
  getMetadata(): PluginMetadata;
}
```

### Available Adapters

#### GmailAdapter

Handles Gmail API operations like sending emails, creating drafts, and fetching messages.

```typescript
// Send an email
const result = await pluginEngine.processIntent({
  agentId: 'agent_123',
  intent: 'send_email',
  tool: 'gmail',
  context: {
    to: 'recipient@example.com',
    subject: 'Hello from AgentOS',
    body: 'This is a test email sent via the Plugin Engine.'
  },
  userId: 'user_456'
});

// Create a draft
const draftResult = await pluginEngine.processIntent({
  agentId: 'agent_123',
  intent: 'create_draft',
  tool: 'gmail',
  context: {
    to: 'recipient@example.com',
    subject: 'Draft Email',
    body: 'This is a draft email.'
  },
  userId: 'user_456'
});

// Fetch emails
const emailsResult = await pluginEngine.processIntent({
  agentId: 'agent_123',
  intent: 'fetch_emails',
  tool: 'gmail',
  context: {
    query: 'is:unread',
    maxResults: 10
  },
  userId: 'user_456'
});
```

#### NotionAdapter

Manages Notion API operations like creating pages, updating content, and querying databases.

```typescript
// Create a page
const result = await pluginEngine.processIntent({
  agentId: 'agent_123',
  intent: 'create_page',
  tool: 'notion',
  context: {
    title: 'Meeting Notes',
    content: '# Meeting Notes\n\n## Agenda\n\n- Project updates\n- Timeline discussion',
    parent: 'database_id_or_page_id'
  },
  userId: 'user_456'
});

// Update a page
const updateResult = await pluginEngine.processIntent({
  agentId: 'agent_123',
  intent: 'update_page',
  tool: 'notion',
  context: {
    pageId: 'page_id_to_update',
    properties: {
      Status: 'Completed',
      Priority: 'High'
    },
    content: 'Updated content here...'
  },
  userId: 'user_456'
});

// Query a database
const queryResult = await pluginEngine.processIntent({
  agentId: 'agent_123',
  intent: 'query_database',
  tool: 'notion',
  context: {
    databaseId: 'database_id',
    filter: {
      property: 'Status',
      status: {
        equals: 'In Progress'
      }
    },
    sorts: [
      {
        property: 'Priority',
        direction: 'descending'
      }
    ]
  },
  userId: 'user_456'
});
```

#### SlackAdapter

Handles Slack API operations like sending messages, scheduling messages, and fetching channel history.

```typescript
// Send a message
const result = await pluginEngine.processIntent({
  agentId: 'agent_123',
  intent: 'send_message',
  tool: 'slack',
  context: {
    channel: 'general',
    text: 'Hello team! This is an automated message from your agent.'
  },
  userId: 'user_456'
});

// Schedule a message
const scheduleResult = await pluginEngine.processIntent({
  agentId: 'agent_123',
  intent: 'schedule_message',
  tool: 'slack',
  context: {
    channel: 'project-updates',
    text: 'Reminder: Team meeting in 15 minutes!',
    post_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  },
  userId: 'user_456'
});

// Fetch messages
const messagesResult = await pluginEngine.processIntent({
  agentId: 'agent_123',
  intent: 'fetch_messages',
  tool: 'slack',
  context: {
    channel: 'general',
    limit: 10,
    oldest: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  userId: 'user_456'
});
```

## API Routes

The Plugin Engine exposes several API routes for frontend integration:

### Main Endpoint

`/api/plugin-engine`

- `GET`: List available tools
- `POST`: Process a task intent

### Integrations Endpoint

`/api/plugin-engine/integrations`

- `GET`: List user integrations
- `DELETE`: Disconnect an integration

### Tasks Endpoint

`/api/plugin-engine/tasks`

- `GET`: List scheduled tasks for an agent
- `DELETE`: Cancel a scheduled task
- `POST`: Retry a failed task

### Context Mappings Endpoints

`/api/plugin-engine/context-mappings`

- `GET`: List context mappings for an agent and tool
- `POST`: Create a new context mapping
- `PUT`: Update an existing context mapping
- `DELETE`: Delete a context mapping

`/api/plugin-engine/context-mappings/bulk`

- `POST`: Bulk create or update context mappings
- `DELETE`: Bulk delete context mappings

`/api/plugin-engine/context-mappings/lookup`

- `GET`: Lookup external ID by context key or context key by external ID

### Integration Endpoints

`/api/plugin-engine/integrations`

- `GET`: List all integrations for the current user
- `POST`: Connect a new integration
- `DELETE`: Disconnect an integration

`/api/plugin-engine/integrations/status`

- `GET`: Check connection status for a specific integration

`/api/plugin-engine/integrations/oauth/authorize`

- `GET`: Initiate OAuth flow for a specific tool

`/api/plugin-engine/integrations/oauth/callback`

- `GET`: Handle OAuth callback from external service

### OAuth Endpoints

`/api/plugin-engine/oauth/authorize`

- `GET`: Start the OAuth flow for a tool

`/api/plugin-engine/oauth/callback`

- `GET`: Handle OAuth callback from external services

### Cron Endpoint

`/api/plugin-engine/cron`

- `POST`: Process scheduled tasks, due tasks, and cleanup

## Creating a Custom Adapter

To create a custom adapter for a new service:

1. Create a new file in `lib/plugin-engine/adapters/your-service-adapter.ts`
2. Implement the `PluginAdapter` interface
3. Register your adapter in the factory function

Example:

```typescript
import { PluginAdapter, PluginMetadata, AuthStatus, PluginResult } from '../types';
import { IntegrationManager } from '../integration-manager';

export class YourServiceAdapter implements PluginAdapter {
  private integrationManager = IntegrationManager.getInstance();

  async connect(userId: string): Promise<AuthStatus> {
    // Implement connection logic
    return { connected: true };
  }

  async isConnected(userId: string): Promise<boolean> {
    // Check if user is connected
    const integration = await this.integrationManager.getIntegration(userId, 'your-service');
    return !!integration;
  }

  async send(agentId: string, payload: any): Promise<PluginResult> {
    // Implement send logic
    return {
      success: true,
      message: 'Action completed successfully',
      data: { result: 'your-data' }
    };
  }

  async fetch(agentId: string, query?: any): Promise<PluginResult> {
    // Implement fetch logic
    return {
      success: true,
      message: 'Data retrieved successfully',
      data: { items: [] }
    };
  }

  async disconnect(userId: string): Promise<void> {
    // Implement disconnect logic
    await this.integrationManager.removeIntegration(userId, 'your-service');
  }

  getMetadata(): PluginMetadata {
    return {
      id: 'your-service',
      name: 'Your Service',
      description: 'Integration with Your Service',
      version: '1.0.0',
      author: 'Your Name',
      scopes: ['your-service:scope']
    };
  }
}
```

Then register your adapter in `lib/plugin-engine/index.ts`:

```typescript
import { YourServiceAdapter } from './adapters/your-service-adapter';

// Update the factory function
export function createPluginEngine() {
  const pluginEngine = PluginEngine.getInstance();
  
  // Register adapters
  pluginEngine.registerAdapter('gmail', new GmailAdapter());
  pluginEngine.registerAdapter('notion', new NotionAdapter());
  pluginEngine.registerAdapter('slack', new SlackAdapter());
  pluginEngine.registerAdapter('your-service', new YourServiceAdapter());
  
  return pluginEngine;
}
```

## Database Schema

The Plugin Engine uses the following tables in Supabase:

- `user_integrations`: Stores OAuth tokens and connection status
- `scheduled_tasks`: Stores tasks scheduled for future execution
- `error_logs`: Records errors that occur during task execution
- `fallback_messages`: Stores customized fallback messages by tool and agent
- `context_mappings`: Maps agent context to external service IDs

### Error Logs Table

```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "agentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  tool TEXT NOT NULL,
  action TEXT NOT NULL,
  "errorCode" TEXT NOT NULL,
  "errorMessage" TEXT NOT NULL,
  payload JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved BOOLEAN DEFAULT false,
  "resolvedAt" TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES auth.users(id)
);
```

### Fallback Messages Table

```sql
CREATE TABLE fallback_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool TEXT NOT NULL,
  "agentId" TEXT,
  message TEXT NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updatedBy" TEXT NOT NULL,
  UNIQUE(tool, "agentId")
);
```

See `schema.sql` for the complete database schema.

## Best Practices

1. **Error Handling**: Always handle errors gracefully and provide user-friendly fallback messages.
2. **Token Refresh**: Implement token refresh logic for OAuth integrations to avoid interruptions.
3. **Rate Limiting**: Respect API rate limits of external services to avoid being blocked.
4. **Idempotency**: Design operations to be idempotent to avoid duplicate actions on retry.
5. **Context Mapping**: Use context mappings to maintain relationships between agent context and external IDs.
6. **Security**: Store tokens securely and validate all user inputs.
7. **Logging**: Log important events and errors for debugging and auditing.

## Troubleshooting

### Common Issues

1. **OAuth Connection Failures**
   - Check that OAuth client IDs and secrets are correctly configured
   - Verify redirect URIs are properly registered with the service
   - Ensure the user has granted all required permissions

2. **Task Execution Failures**
   - Check the error logs for specific error codes and messages
   - Verify the user has an active connection to the service
   - Ensure the payload format matches what the service expects

3. **Scheduled Tasks Not Running**
   - Verify the cron job is properly configured and running
   - Check for errors in the scheduler logs
   - Ensure the system time is correctly set

### Debugging

1. Enable debug mode by setting `PLUGIN_ENGINE_DEBUG=true` in your environment
2. Check the error logs in the Supabase `error_logs` table
3. Use the API routes to inspect the current state of integrations and tasks

## Security Considerations

1. **OAuth Token Storage**: Tokens are stored securely in Supabase with row-level security
2. **CSRF Protection**: OAuth flows include state validation to prevent CSRF attacks
3. **API Authorization**: All API routes require authentication
4. **Cron Job Security**: The cron endpoint is secured with a secret token
5. **Sensitive Data**: Sensitive information is never logged or exposed in responses
