# Overseer Backend API Documentation

This document provides an overview of the Overseer backend API endpoints, their functionality, and usage examples.

## Core API Endpoints

### Agents API

#### GET /api/agents
Retrieves all agents for the authenticated user.

**Response:**
```json
{
  "agents": [
    {
      "id": "uuid",
      "name": "Agent Name",
      "role": "Assistant",
      "avatar": "https://example.com/avatar.png",
      "persona": "Friendly and helpful assistant",
      "tools": ["web-search", "calculator"],
      "user_id": "user-uuid",
      "created_at": "2025-06-06T12:00:00Z",
      "updated_at": "2025-06-06T12:00:00Z",
      "last_active": "2025-06-06T12:00:00Z",
      "total_tasks_completed": 5,
      "xp": 250
    }
  ]
}
```

#### POST /api/agents
Creates a new agent with initial memory.

**Request Body:**
```json
{
  "name": "Agent Name",
  "role": "Assistant",
  "avatar": "https://example.com/avatar.png",
  "persona": "Friendly and helpful assistant",
  "tools": ["web-search", "calculator"]
}
```

**Response:**
```json
{
  "agent": {
    "id": "uuid",
    "name": "Agent Name",
    "role": "Assistant",
    "avatar": "https://example.com/avatar.png",
    "persona": "Friendly and helpful assistant",
    "tools": ["web-search", "calculator"],
    "user_id": "user-uuid",
    "created_at": "2025-06-06T12:00:00Z",
    "updated_at": "2025-06-06T12:00:00Z",
    "last_active": "2025-06-06T12:00:00Z",
    "total_tasks_completed": 0,
    "xp": 0
  }
}
```

#### GET /api/agents/[id]
Retrieves a specific agent by ID with its memory.

**Response:**
```json
{
  "agent": {
    "id": "uuid",
    "name": "Agent Name",
    "role": "Assistant",
    "avatar": "https://example.com/avatar.png",
    "persona": "Friendly and helpful assistant",
    "tools": ["web-search", "calculator"],
    "user_id": "user-uuid",
    "created_at": "2025-06-06T12:00:00Z",
    "updated_at": "2025-06-06T12:00:00Z",
    "last_active": "2025-06-06T12:00:00Z",
    "total_tasks_completed": 5,
    "xp": 250,
    "memory": {
      "id": "uuid",
      "agent_id": "agent-uuid",
      "weekly_goals": "Help with project management",
      "preferences": ["Concise responses", "Technical language"],
      "recent_learnings": ["User prefers dark mode", "User works in finance"],
      "created_at": "2025-06-06T12:00:00Z",
      "updated_at": "2025-06-06T12:00:00Z"
    }
  }
}
```

#### PATCH /api/agents/[id]
Updates a specific agent.

**Request Body:**
```json
{
  "name": "Updated Name",
  "persona": "Updated persona description"
}
```

**Response:**
```json
{
  "agent": {
    "id": "uuid",
    "name": "Updated Name",
    "persona": "Updated persona description",
    "...": "other fields"
  }
}
```

#### DELETE /api/agents/[id]
Deletes a specific agent.

**Response:**
```json
{
  "message": "Agent deleted successfully"
}
```

### Agent Memory API

#### GET /api/agents/[id]/memory
Retrieves memory for a specific agent.

**Response:**
```json
{
  "memory": {
    "id": "uuid",
    "agent_id": "agent-uuid",
    "weekly_goals": "Help with project management",
    "preferences": ["Concise responses", "Technical language"],
    "recent_learnings": ["User prefers dark mode", "User works in finance"],
    "created_at": "2025-06-06T12:00:00Z",
    "updated_at": "2025-06-06T12:00:00Z"
  },
  "memory_logs": [
    {
      "id": "uuid",
      "agent_id": "agent-uuid",
      "type": "learning",
      "content": "User prefers dark mode",
      "created_at": "2025-06-06T12:00:00Z"
    }
  ]
}
```

#### PATCH /api/agents/[id]/memory
Updates memory for a specific agent.

**Request Body:**
```json
{
  "weekly_goals": "Updated goals",
  "preferences": ["Updated preference"]
}
```

**Response:**
```json
{
  "memory": {
    "id": "uuid",
    "agent_id": "agent-uuid",
    "weekly_goals": "Updated goals",
    "preferences": ["Updated preference"],
    "recent_learnings": ["User prefers dark mode", "User works in finance"],
    "created_at": "2025-06-06T12:00:00Z",
    "updated_at": "2025-06-06T12:00:00Z"
  }
}
```

#### POST /api/agents/[id]/memory
Adds a new memory log entry.

**Request Body:**
```json
{
  "type": "learning",
  "content": "User prefers dark mode"
}
```

**Response:**
```json
{
  "memory_log": {
    "id": "uuid",
    "agent_id": "agent-uuid",
    "type": "learning",
    "content": "User prefers dark mode",
    "created_at": "2025-06-06T12:00:00Z"
  }
}
```

### Tasks API

#### GET /api/tasks
Retrieves all tasks for the authenticated user.

**Query Parameters:**
- `status`: Filter by status (pending, in-progress, waiting, completed)
- `priority`: Filter by priority (low, medium, high)
- `agent_id`: Filter by assigned agent

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Research AI trends",
      "details": "Find latest AI research papers",
      "status": "pending",
      "priority": "high",
      "agent_id": "agent-uuid",
      "user_id": "user-uuid",
      "due_date": "2025-06-10T12:00:00Z",
      "xp_reward": 50,
      "created_at": "2025-06-06T12:00:00Z",
      "updated_at": "2025-06-06T12:00:00Z",
      "completed_at": null,
      "agents": {
        "id": "agent-uuid",
        "name": "Agent Name",
        "avatar": "https://example.com/avatar.png"
      }
    }
  ]
}
```

#### POST /api/tasks
Creates a new task.

**Request Body:**
```json
{
  "title": "Research AI trends",
  "details": "Find latest AI research papers",
  "priority": "high",
  "agent_id": "agent-uuid",
  "due_date": "2025-06-10T12:00:00Z",
  "xp_reward": 50
}
```

**Response:**
```json
{
  "task": {
    "id": "uuid",
    "title": "Research AI trends",
    "details": "Find latest AI research papers",
    "status": "pending",
    "priority": "high",
    "agent_id": "agent-uuid",
    "user_id": "user-uuid",
    "due_date": "2025-06-10T12:00:00Z",
    "xp_reward": 50,
    "created_at": "2025-06-06T12:00:00Z",
    "updated_at": "2025-06-06T12:00:00Z",
    "completed_at": null,
    "agents": {
      "id": "agent-uuid",
      "name": "Agent Name",
      "avatar": "https://example.com/avatar.png"
    }
  }
}
```

#### GET /api/tasks/[id]
Retrieves a specific task by ID.

**Response:**
```json
{
  "task": {
    "id": "uuid",
    "title": "Research AI trends",
    "details": "Find latest AI research papers",
    "status": "pending",
    "priority": "high",
    "agent_id": "agent-uuid",
    "user_id": "user-uuid",
    "due_date": "2025-06-10T12:00:00Z",
    "xp_reward": 50,
    "created_at": "2025-06-06T12:00:00Z",
    "updated_at": "2025-06-06T12:00:00Z",
    "completed_at": null,
    "agents": {
      "id": "agent-uuid",
      "name": "Agent Name",
      "avatar": "https://example.com/avatar.png"
    }
  }
}
```

#### PATCH /api/tasks/[id]
Updates a specific task.

**Request Body:**
```json
{
  "status": "completed",
  "title": "Updated title"
}
```

**Response:**
```json
{
  "task": {
    "id": "uuid",
    "title": "Updated title",
    "status": "completed",
    "completed_at": "2025-06-06T13:00:00Z",
    "...": "other fields"
  }
}
```

#### DELETE /api/tasks/[id]
Deletes a specific task.

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

### Chat API

#### POST /api/chat/[agentId]
Streams a chat response from an agent.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, can you help me with something?"
    }
  ]
}
```

**Response:**
Streaming text response from the agent.

### Workflows API

#### GET /api/workflows
Retrieves all workflows for the authenticated user.

**Query Parameters:**
- `status`: Filter by status (draft, active, paused)

**Response:**
```json
{
  "workflows": [
    {
      "id": "uuid",
      "name": "Daily Report Generator",
      "description": "Generates daily reports from data sources",
      "nodes": [...],
      "status": "active",
      "user_id": "user-uuid",
      "run_count": 15,
      "success_rate": 0.93,
      "last_run": "2025-06-06T12:00:00Z",
      "created_at": "2025-06-01T12:00:00Z",
      "updated_at": "2025-06-06T12:00:00Z"
    }
  ]
}
```

#### POST /api/workflows
Creates a new workflow.

**Request Body:**
```json
{
  "name": "Daily Report Generator",
  "description": "Generates daily reports from data sources",
  "nodes": [...],
  "status": "draft"
}
```

**Response:**
```json
{
  "workflow": {
    "id": "uuid",
    "name": "Daily Report Generator",
    "description": "Generates daily reports from data sources",
    "nodes": [...],
    "status": "draft",
    "user_id": "user-uuid",
    "run_count": 0,
    "success_rate": 0,
    "last_run": null,
    "created_at": "2025-06-06T12:00:00Z",
    "updated_at": "2025-06-06T12:00:00Z"
  }
}
```

#### GET /api/workflows/[id]
Retrieves a specific workflow by ID with recent executions.

**Response:**
```json
{
  "workflow": {
    "id": "uuid",
    "name": "Daily Report Generator",
    "description": "Generates daily reports from data sources",
    "nodes": [...],
    "status": "active",
    "user_id": "user-uuid",
    "run_count": 15,
    "success_rate": 0.93,
    "last_run": "2025-06-06T12:00:00Z",
    "created_at": "2025-06-01T12:00:00Z",
    "updated_at": "2025-06-06T12:00:00Z",
    "workflow_executions": [
      {
        "id": "uuid",
        "workflow_id": "workflow-uuid",
        "status": "completed",
        "input_data": {...},
        "output_data": {...},
        "error_message": null,
        "execution_time": 1250,
        "created_at": "2025-06-06T12:00:00Z",
        "completed_at": "2025-06-06T12:00:21Z"
      }
    ]
  }
}
```

#### PATCH /api/workflows/[id]
Updates a specific workflow.

**Request Body:**
```json
{
  "name": "Updated Workflow Name",
  "status": "active"
}
```

**Response:**
```json
{
  "workflow": {
    "id": "uuid",
    "name": "Updated Workflow Name",
    "status": "active",
    "...": "other fields"
  }
}
```

#### DELETE /api/workflows/[id]
Deletes a specific workflow.

**Response:**
```json
{
  "message": "Workflow deleted successfully"
}
```

#### POST /api/workflows/[id]/execute
Executes a specific workflow.

**Request Body:**
```json
{
  "input_data": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

**Response:**
```json
{
  "message": "Workflow execution started",
  "execution_id": "uuid"
}
```

#### GET /api/workflows/executions/[id]
Retrieves a specific workflow execution by ID.

**Response:**
```json
{
  "execution": {
    "id": "uuid",
    "workflow_id": "workflow-uuid",
    "status": "completed",
    "input_data": {...},
    "output_data": {...},
    "error_message": null,
    "execution_time": 1250,
    "created_at": "2025-06-06T12:00:00Z",
    "completed_at": "2025-06-06T12:00:21Z",
    "workflows": {
      "id": "workflow-uuid",
      "name": "Daily Report Generator"
    }
  }
}
```

#### DELETE /api/workflows/executions/[id]
Deletes a specific workflow execution.

**Response:**
```json
{
  "message": "Workflow execution deleted successfully"
}
```

#### POST /api/workflows/[id]/schedule
Schedule a workflow to run at specified intervals.

**Request Body:**
```json
{
  "cron": "0 0 * * *", // Required: Cron expression
  "timezone": "UTC", // Optional: Timezone for the schedule
  "startDate": "2024-03-20T00:00:00Z", // Optional: When to start the schedule
  "endDate": "2024-12-31T23:59:59Z" // Optional: When to end the schedule
}
```

**Response:**
```json
{
  "message": "Workflow scheduled successfully",
  "schedule": {
    "cron": "0 0 * * *",
    "timezone": "UTC",
    "startDate": "2024-03-20T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z"
  }
}
```

#### DELETE /api/workflows/[id]/schedule
Cancel a scheduled workflow.

**Response:**
```json
{
  "message": "Workflow schedule cancelled successfully"
}
```

#### PATCH /api/workflows/[id]/schedule
Pause or resume a scheduled workflow.

**Request Body:**
```json
{
  "action": "pause" // or "resume"
}
```

**Response:**
```json
{
  "message": "Workflow schedule paused successfully"
}
```

### Workflow Scheduling API

#### POST /api/workflows/schedule
Schedules a workflow to run at a specified interval.

**Request Body:**
```json
{
  "id": "workflow-1",
  "workflow": {
    "id": "workflow-1",
    "name": "My Workflow"
  },
  "interval": 60000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow workflow-1 scheduled."
}
```

#### POST /api/workflows/pause
Pauses a scheduled workflow.

**Request Body:**
```json
{
  "id": "workflow-1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow workflow-1 paused."
}
```

#### POST /api/workflows/resume
Resumes a paused workflow.

**Request Body:**
```json
{
  "id": "workflow-1",
  "workflow": {
    "id": "workflow-1",
    "name": "My Workflow"
  },
  "interval": 60000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow workflow-1 resumed."
}
```

## Plugin Engine

### Fallback Messages
- **GET** `/api/plugin-engine/errors/fallbacks?tool=gmail&agentId=abc`
- **POST** `/api/plugin-engine/errors/fallbacks`
- **Body:** `{ tool, message, agentId? }`
- **Response:** `{ success, tool, agentId, message }`

### Bulk Error Operations
- **POST** `/api/plugin-engine/errors/bulk`
- **Body:** `{ action: 'resolve', errorIds: [id, ...] }`
- **Response:** `{ success, action, count, errorIds }`

### Context Mappings
- **POST** `/api/plugin-engine/context-mappings/bulk`
- **Body:** `{ mappings: [...] }`
- **Response:** `{ success, count, message }`

## Error Handling

### Resolve Error
- **PATCH** `/api/plugin-engine/errors`
- **Body:** `{ errorId }`
- **Response:** `{ success: true }`

## Authentication

All API endpoints require authentication using Supabase Auth. Include the authentication token in the request headers.

## Error Handling

All API endpoints return appropriate HTTP status codes and error messages in case of failures:

- 400: Bad Request - Invalid input data
- 401: Unauthorized - Missing or invalid authentication
- 403: Forbidden - Not authorized to access the resource
- 404: Not Found - Resource not found
- 500: Internal Server Error - Server-side error

## Database Schema

The API is backed by a PostgreSQL database with the following core tables:

- `agents`: Stores agent configurations and metadata
- `agent_memory`: Stores persistent memory for agents
- `memory_logs`: Stores memory log entries for agent learning
- `tasks`: Stores tasks assigned to agents
- `workflows`: Stores workflow configurations
- `workflow_executions`: Stores workflow execution history
- `chat_messages`: Stores chat history between users and agents

All tables include Row Level Security (RLS) policies to ensure data isolation between users.

## Running Migrations

To apply database migrations:

```bash
# Install ts-node if not already installed
npm install -g ts-node

# Run the migration script
./scripts/apply-migrations.ts
```
