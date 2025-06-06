# Overseer - AgentOS Plugin Engine

The Plugin Engine is a modular backend system for Overseer - AgentOS that abstracts agent intents into API calls to external services. It handles authentication flows, task scheduling, error handling, and context mapping.

## Architecture

The Plugin Engine follows a modular architecture with several key components:

### Core Components

1. **PluginEngine**: The main singleton class that orchestrates the entire system. It registers adapters, processes task intents, normalizes context, and handles task execution.

2. **IntegrationManager**: Manages OAuth integrations for different tools. Handles storing, retrieving, refreshing tokens, and checking connection status.

3. **ErrorHandler**: Centralizes error logging, tracking, and fallback message handling. Supports customizable retry limits and disabling tools on repeated errors.

4. **Scheduler**: Manages task scheduling, retrieval, cancellation, and retry logic. Integrates with Supabase for storage and Redis for caching.

### Plugin Adapters

Plugin adapters implement the `PluginAdapter` interface to provide standardized interactions with external services:

- **GmailAdapter**: Handles Gmail API operations like sending emails, creating drafts, and fetching messages.
- **NotionAdapter**: Manages Notion API operations like creating pages, updating content, and querying databases.
- **SlackAdapter**: Handles Slack API operations like sending messages, scheduling messages, and fetching channel history.

## Database Schema

The Plugin Engine uses Supabase for persistent storage with the following tables:

- **user_integrations**: Stores OAuth tokens and connection status for each integration.
- **scheduled_tasks**: Stores tasks scheduled for future execution.
- **error_logs**: Records errors that occur during task execution.
- **context_mappings**: Maps agent context to external service IDs.

## Caching

Redis is used for caching to improve performance:

- OAuth tokens and connection status
- Scheduled tasks
- Error counts for rate limiting
- Context mappings

## API Routes

The Plugin Engine exposes several API routes:

- **/api/plugin-engine**: Main endpoint for processing task intents and listing available tools.
- **/api/plugin-engine/integrations**: Manages user integrations (list, disconnect).
- **/api/plugin-engine/tasks**: Handles scheduled tasks (list, cancel, retry).
- **/api/plugin-engine/oauth/callback**: Processes OAuth callbacks for connecting integrations.
- **/api/plugin-engine/cron**: Cron job endpoint for processing scheduled tasks.

## Usage

### Initializing the Plugin Engine

```typescript
import { createPluginEngine } from '@/lib/plugin-engine';

// Create and initialize the plugin engine with default adapters
const pluginEngine = createPluginEngine();
```

### Processing a Task Intent

```typescript
import { TaskIntent } from '@/lib/plugin-engine';

// Create a task intent
const taskIntent: TaskIntent = {
  agentId: 'agent_123',
  intent: 'send_email',
  tool: 'gmail',
  context: {
    to: 'recipient@example.com',
    subject: 'Hello from AgentOS',
    body: 'This is a test email sent via the Plugin Engine.'
  },
  userId: 'user_456',
  // Optional: Schedule for later execution
  scheduledTime: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour from now
};

// Process the intent
const result = await pluginEngine.processIntent(taskIntent);
```

### Creating a Custom Adapter

```typescript
import { PluginAdapter, PluginMetadata, AuthStatus, PluginResult } from '@/lib/plugin-engine';

export class CustomAdapter implements PluginAdapter {
  // Implement required methods
  async connect(userId: string): Promise<AuthStatus> {
    // Connect to the external service
  }
  
  async isConnected(userId: string): Promise<boolean> {
    // Check connection status
  }
  
  async send(agentId: string, payload: any): Promise<PluginResult> {
    // Send data to the external service
  }
  
  async fetch(agentId: string, query?: any): Promise<PluginResult> {
    // Fetch data from the external service
  }
  
  async disconnect(userId: string): Promise<void> {
    // Disconnect from the external service
  }
  
  getMetadata(): PluginMetadata {
    // Return metadata about the adapter
  }
}

// Register the custom adapter
pluginEngine.registerAdapter('custom', new CustomAdapter());
```

## Environment Variables

The Plugin Engine requires the following environment variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Upstash Redis
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# OAuth (for each integration)
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
NOTION_CLIENT_ID=your-notion-client-id
NOTION_CLIENT_SECRET=your-notion-client-secret
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret

# Cron
CRON_SECRET_TOKEN=your-cron-secret-token
```

## Security

- OAuth tokens are stored securely in Supabase with refresh token rotation.
- Row Level Security (RLS) ensures users can only access their own data.
- Environment variables are used for all sensitive keys and tokens.
- API routes are protected with authentication.

## Next Steps

- Implement real OAuth flows for each integration.
- Replace simulated API calls with actual service integrations.
- Set up cron jobs to process scheduled tasks regularly.
- Develop additional plugin adapters for other services.
- Create frontend components to manage integrations and view task history.
