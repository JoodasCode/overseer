# Error Handling System Documentation

## Overview

The Error Handling System is a centralized component of the Plugin Engine that manages error reporting, retries, fallback behavior, and error statistics. It provides a robust way to handle errors across all adapters and tools, ensuring graceful degradation and consistent error reporting.

## Features

- **Centralized Error Logging**: All errors from adapters and tools are logged in a central database
- **Customizable Fallback Messages**: Configure fallback messages by tool and agent
- **Retry Policy Management**: Set retry limits for different tools
- **Error Statistics and Monitoring**: Track error trends and get insights into system health
- **Automatic Tool Disabling**: Automatically disable tools that experience excessive errors
- **API Routes**: RESTful API endpoints for managing errors and fallback messages

## Architecture

The Error Handling System consists of the following components:

1. **ErrorHandler Class**: Singleton class that manages error logging, retry limits, and fallback messages
2. **API Routes**: RESTful endpoints for managing errors and fallback messages
3. **Database Tables**: Supabase tables for storing error logs and fallback messages
4. **Redis Cache**: For tracking error counts and rate limiting

## ErrorHandler Class

The `ErrorHandler` class is the core component of the error handling system. It provides methods for:

- Logging errors
- Setting and getting fallback messages
- Managing retry limits
- Resolving errors
- Getting error statistics

### Key Methods

```typescript
// Log an error
logError(error: ErrorLog): Promise<string>

// Get fallback message for a tool
getFallbackMessage(tool: string, agentId?: string): string

// Set fallback message for a tool
setFallbackMessage(tool: string, message: string, agentId?: string): void

// Check if a tool should be disabled due to errors
shouldDisableTool(agentId: string, tool: string): Promise<boolean>

// Resolve an error
resolveError(errorId: string): Promise<void>

// Get errors for an agent
getAgentErrors(agentId: string, limit?: number): Promise<ErrorLog[]>

// Get error statistics by tool
getErrorStatsByTool(days?: number): Promise<Record<string, number>>

// Get error trends over time
getErrorTrends(days?: number, tool?: string): Promise<ErrorTrend[]>
```

## API Routes

### Error Logs

#### GET /api/plugin-engine/errors

Get error logs for an agent.

Query Parameters:
- `agentId`: ID of the agent (required)
- `limit`: Maximum number of errors to return (default: 10)

#### POST /api/plugin-engine/errors

Log a new error.

Request Body:
```json
{
  "agentId": "agent-123",
  "tool": "gmail",
  "action": "send",
  "errorCode": "AUTHENTICATION_ERROR",
  "errorMessage": "Failed to authenticate with Gmail",
  "payload": { "to": "user@example.com", "subject": "Test" }
}
```

#### PATCH /api/plugin-engine/errors

Resolve an error.

Request Body:
```json
{
  "errorId": "error-123"
}
```

### Bulk Operations

#### POST /api/plugin-engine/errors/bulk

Perform bulk operations on error logs.

Request Body:
```json
{
  "action": "resolve",
  "errorIds": ["error-123", "error-456"]
}
```

### Fallback Messages

#### GET /api/plugin-engine/errors/fallbacks

Get fallback message for a tool.

Query Parameters:
- `tool`: Name of the tool (required)
- `agentId`: ID of the agent (optional)

#### POST /api/plugin-engine/errors/fallbacks

Set a fallback message for a tool.

Request Body:
```json
{
  "tool": "gmail",
  "message": "Unable to send email. Your message has been saved as a draft.",
  "agentId": "agent-123"
}
```

### Error Statistics

#### GET /api/plugin-engine/errors/stats

Get error statistics.

Query Parameters:
- `days`: Number of days to analyze (default: 7)

### Error Trends

#### GET /api/plugin-engine/errors/trends

Get error trends data.

Query Parameters:
- `days`: Number of days to analyze (default: 30)
- `tool`: Filter by tool (optional)

## Integration with Plugin Engine

The Error Handling System is integrated with the Plugin Engine to automatically handle errors from adapters. When an adapter encounters an error, the Plugin Engine will:

1. Log the error using the ErrorHandler
2. Check if the tool should be disabled
3. Get the appropriate fallback message
4. Return a graceful error response with the fallback message

## Database Schema

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

CREATE INDEX idx_error_logs_timestamp ON error_logs("timestamp");
CREATE INDEX idx_error_logs_tool ON error_logs(tool);
CREATE INDEX idx_error_logs_errorcode ON error_logs("errorCode");
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

CREATE INDEX idx_fallback_messages_tool ON fallback_messages(tool);
```

## Usage Examples

### Logging an Error

```typescript
import { ErrorHandler } from '@/lib/plugin-engine';

const errorHandler = ErrorHandler.getInstance();

try {
  // Attempt to perform an action
} catch (error) {
  await errorHandler.logError({
    agentId: 'agent-123',
    userId: 'user-456',
    tool: 'gmail',
    action: 'send',
    errorCode: 'AUTHENTICATION_ERROR',
    errorMessage: error.message,
    payload: { to: 'user@example.com', subject: 'Test' },
    timestamp: new Date().toISOString(),
    resolved: false
  });
}
```

### Setting a Fallback Message

```typescript
import { ErrorHandler } from '@/lib/plugin-engine';

const errorHandler = ErrorHandler.getInstance();

// Set a global fallback message for Gmail
errorHandler.setFallbackMessage('gmail', 'Unable to send email. Your message has been saved as a draft.');

// Set an agent-specific fallback message
errorHandler.setFallbackMessage('gmail', 'Agent X cannot send emails right now. Try again later.', 'agent-x');
```

### Getting Error Statistics

```typescript
import { ErrorHandler } from '@/lib/plugin-engine';

const errorHandler = ErrorHandler.getInstance();

// Get error statistics for the last 7 days
const stats = await errorHandler.getErrorStatsByTool(7);
console.log(stats); // { 'gmail': 5, 'notion': 2, 'slack': 1 }
```

## Best Practices

1. **Always log errors**: Make sure all adapters log errors through the ErrorHandler
2. **Provide meaningful error codes**: Use consistent error codes across adapters
3. **Set appropriate retry limits**: Configure retry limits based on the tool's API rate limits
4. **Customize fallback messages**: Provide helpful fallback messages for each tool
5. **Monitor error trends**: Regularly check error statistics to identify issues
6. **Resolve errors promptly**: Use the API to mark errors as resolved when fixed
