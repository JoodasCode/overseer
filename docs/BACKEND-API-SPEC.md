# 🔧 AGENTS OS Backend API Specification

## 📋 Overview

This document provides a complete specification for the AGENTS OS backend API. The system is built on **Next.js API routes** with **Supabase** as the database and authentication provider.

**Base URL**: `https://your-domain.com/api`  
**Authentication**: Supabase JWT tokens via `Authorization: Bearer <token>` header  
**Database**: PostgreSQL via Supabase with Row Level Security (RLS)

---

## 🔐 Authentication

All API endpoints require authentication unless specified otherwise.

### Headers Required
```http
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

### Getting Auth Token (Frontend)
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
```

---

## 🤖 Agents API

### GET `/api/agents`
Get all agents for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Alex",
      "description": "Strategic Coordinator who helps with planning and coordination",
      "role": "Strategic Coordinator", 
      "avatar_url": "🧑‍💼",
      "status": "active" | "idle" | "offline" | "collaborating",
      "personality": "Calm, strategic, methodical, and naturally coordinating",
      "persona": "Calm, articulate, and tactically creative. Thinks long-term.",
      "tools": ["notion", "gmail", "google_calendar", "slack"],
      "preferences": {
        "role": "Strategic Coordinator",
        "tone": "calm, professional, structured",
        "voice_style": "composed"
      },
      "stats": {
        "total_tasks_completed": 42,
        "efficiency_score": 0.87,
        "last_active": "2024-01-15T10:30:00Z"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST `/api/agents`
Create a new agent.

**Request Body:**
```json
{
  "name": "Riley",
  "description": "Data Analyst who provides insights through metrics",
  "role": "Data Analyst",
  "avatar_url": "🤖",
  "personality": "Analytical, precise, and data-focused",
  "persona": "Analytical, precise, neutral tone. Speaks with graphs and impact metrics.",
  "tools": ["supabase_db", "google_sheets", "posthog"],
  "preferences": {
    "tone": "analytical, precise, neutral",
    "voice_style": "factual"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "name": "Riley",
    // ... full agent object
  }
}
```

### GET `/api/agents/[id]`
Get a specific agent by ID.

**Response:** Same as single agent object from GET `/api/agents`

### PATCH `/api/agents/[id]`
Update an agent.

**Request Body:** Partial agent object with fields to update
**Response:** Updated agent object

### DELETE `/api/agents/[id]`
Delete an agent.

**Response:**
```json
{
  "success": true,
  "message": "Agent deleted successfully"
}
```

---

## 💬 Chat API

### POST `/api/chat/[agentId]`
Send a message to an agent and get a streaming response.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Help me plan a project timeline"
    }
  ]
}
```

**Response:** Server-Sent Events (SSE) stream
```
data: {"type": "token", "content": "I'd"}
data: {"type": "token", "content": " be"}
data: {"type": "token", "content": " happy"}
data: {"type": "done"}
```

**Usage Example:**
```javascript
const response = await fetch(`/api/chat/${agentId}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ messages })
})

const reader = response.body.getReader()
// Handle streaming response
```

---

## 🧠 Agent Intelligence API

### GET `/api/agents/[id]/memory`
Get agent's memory and context.

**Response:**
```json
{
  "success": true,
  "data": {
    "memory": {
      "weekly_goals": "Focus on strategic planning projects",
      "preferences": ["structured meetings", "detailed briefs"],
      "recent_learnings": ["User prefers morning meetings", "Project X needs daily updates"],
      "context": "Working on Q1 planning with focus on team coordination"
    }
  }
}
```

### POST `/api/agents/[id]/memory`
Add new memory for an agent.

**Request Body:**
```json
{
  "type": "learning" | "preference" | "context" | "goal",
  "content": "User prefers concise status updates",
  "category": "communication_style"
}
```

### GET `/api/agents/[id]/modes`
Get available modes for an agent.

**Response:**
```json
{
  "success": true,
  "data": {
    "modes": [
      {
        "id": "uuid",
        "mode_name": "urgent",
        "description": "Quick, focused responses for urgent matters",
        "tone_override": "direct, concise",
        "response_length": "short",
        "is_active": false
      },
      {
        "id": "uuid", 
        "mode_name": "detailed",
        "description": "Comprehensive, thorough analysis",
        "tone_override": "analytical, comprehensive",
        "response_length": "long",
        "is_active": true
      }
    ],
    "active_mode": {
      "mode_name": "detailed",
      "activated_at": "2024-01-15T10:00:00Z"
    }
  }
}
```

### PATCH `/api/agents/[id]/modes`
Switch agent mode.

**Request Body:**
```json
{
  "mode_name": "urgent",
  "activated_by": "user"
}
```

### POST `/api/agents/[id]/collaborate`
Send collaboration message between agents.

**Request Body:**
```json
{
  "to_agent_id": "target-agent-uuid",
  "message_type": "collaboration" | "question" | "update" | "request",
  "content": "Can you help with the visual design for this project?",
  "context": "Project Alpha timeline planning"
}
```

---

## 📊 Portal Dashboard API

### GET `/api/portal/dashboard`
Get dashboard data including agents, activities, and stats.

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": [
      // Array of agent objects
    ],
    "recent_activity": [
      {
        "id": "uuid",
        "actor_type": "agent",
        "actor_name": "Alex",
        "action": "completed task",
        "description": "Finished project timeline analysis",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "needs_attention": [
      {
        "id": "uuid",
        "type": "agent_offline",
        "priority": "medium",
        "title": "Agent Offline",
        "description": "Dana has been offline for 2 hours",
        "agent_id": "uuid"
      }
    ],
    "team_stats": {
      "total_agents": 5,
      "active_agents": 4,
      "active_rate": 0.8,
      "departments": {
        "individual": 5
      }
    }
  }
}
```

---

## 🏢 Departments API

### GET `/api/portal/departments`
Get all available departments.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "HR",
      "slug": "hr", 
      "icon": "👥",
      "color": "#10B981",
      "description": "Human resources and people management"
    }
  ]
}
```

---

## 🔗 Integrations API

### GET `/api/integrations`
Get all available integrations and their status.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notion",
      "name": "Notion",
      "description": "Connect to Notion workspaces",
      "icon": "📝",
      "status": "connected" | "disconnected" | "error",
      "config": {
        "workspace_id": "abc123",
        "last_sync": "2024-01-15T10:00:00Z"
      }
    }
  ]
}
```

### POST `/api/integrations/[id]/connect`
Connect an integration.

**Request Body:**
```json
{
  "credentials": {
    "api_key": "secret_key",
    "workspace_id": "workspace123"
  }
}
```

---

## 🔄 Workflow Builder API

### GET `/api/workflows`
Get user's workflows.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Daily Standup Automation",
      "description": "Automatically collect and summarize team updates",
      "status": "active" | "paused" | "draft",
      "nodes": [
        {
          "id": "node1",
          "type": "agent",
          "agent_id": "uuid",
          "config": {
            "prompt": "Collect team updates"
          }
        }
      ],
      "connections": [
        {
          "from": "node1",
          "to": "node2"
        }
      ]
    }
  ]
}
```

### POST `/api/workflows`
Create a new workflow.

### PATCH `/api/workflows/[id]`
Update a workflow.

### DELETE `/api/workflows/[id]`
Delete a workflow.

---

## 📈 Analytics API

### GET `/api/analytics/agents`
Get agent performance analytics.

**Query Parameters:**
- `timeframe`: `day` | `week` | `month` | `quarter`
- `agent_id`: Optional, filter by specific agent

**Response:**
```json
{
  "success": true,
  "data": {
    "timeframe": "week",
    "metrics": {
      "total_interactions": 156,
      "avg_response_time": 1.2,
      "task_completion_rate": 0.94,
      "user_satisfaction": 4.6
    },
    "agent_performance": [
      {
        "agent_id": "uuid",
        "agent_name": "Alex",
        "interactions": 45,
        "avg_response_time": 0.8,
        "completion_rate": 0.96
      }
    ],
    "trends": [
      {
        "date": "2024-01-15",
        "interactions": 23,
        "completion_rate": 0.95
      }
    ]
  }
}
```

---

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent with ID 'xyz' not found",
    "details": "The requested agent does not exist or you don't have permission to access it"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: User doesn't have permission
- `NOT_FOUND`: Resource doesn't exist
- `VALIDATION_ERROR`: Invalid request data
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

---

## 📡 Real-time Features

### WebSocket Connection
Connect to real-time updates:

```javascript
const ws = new WebSocket(`wss://your-domain.com/api/ws?token=${token}`)

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // Handle real-time updates
}
```

### Event Types
- `agent_status_changed`: Agent went online/offline
- `new_message`: New chat message
- `collaboration_started`: Agents started collaborating
- `task_completed`: Agent completed a task

---

## 🔧 Environment Variables

Required environment variables for the backend:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379
```

---

## 📊 Database Schema Summary

### Core Tables
- `portal_agents`: Agent definitions and metadata
- `portal_agent_logs`: Chat history and interactions  
- `portal_agent_memory`: Agent memory and context
- `portal_activity_log`: System activity tracking
- `portal_departments`: Department categorization
- `agent_modes`: Agent operational modes
- `inter_agent_messages`: Agent-to-agent communication

### Key Relationships
- Agents belong to users (RLS enforced)
- All data is user-scoped for security
- Agents can have multiple modes and memory entries
- Activity logs track all system events

---

## 🚀 Getting Started

1. **Authentication**: Implement Supabase auth in your frontend
2. **API Client**: Create a wrapper for API calls with auth headers
3. **Real-time**: Set up WebSocket connection for live updates
4. **Error Handling**: Implement consistent error handling
5. **Caching**: Consider caching frequently accessed data

### Example API Client
```javascript
class AgentsAPI {
  constructor(supabaseClient) {
    this.supabase = supabaseClient
    this.baseURL = '/api'
  }

  async getAuthHeaders() {
    const { data: { session } } = await this.supabase.auth.getSession()
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    }
  }

  async getAgents() {
    const headers = await this.getAuthHeaders()
    const response = await fetch(`${this.baseURL}/agents`, { headers })
    return response.json()
  }

  async chatWithAgent(agentId, messages) {
    const headers = await this.getAuthHeaders()
    return fetch(`${this.baseURL}/chat/${agentId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages })
    })
  }
}
```

This specification provides everything needed to build a frontend that integrates with the AGENTS OS backend. The API is RESTful, well-documented, and includes real-time capabilities for a modern user experience. 