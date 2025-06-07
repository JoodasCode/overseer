# Overseer Backend Development Roadmap

This document outlines the comprehensive development plan for the Overseer backend, structured into three progressive phases with clear priorities and implementation guidelines.

## 🧱 Implementation Plan Overview

The backend development is divided into three phases, each building upon the previous to create a robust, scalable platform for AI agent management.

---

## ✅ Phase 1 – Foundational Core (Highest Priority)

| Area | Task | Status |
|------|------|--------|
| **🗄️ Database Schema** | Implement all core tables in Supabase:<br>• `agents`, `tasks`, `agent_memory`, `workflows`, `context_mappings`, `tools`, `users`, `error_logs`<br>Use Prisma for migration scripts | 🟡 In Progress |
| **🧠 Core APIs** | Build API routes for:<br>• `/api/agents` (CRUD)<br>• `/api/tasks` (create, assign, update status)<br>• `/api/chat/[agentId]` (streamed AI responses)<br>• `/api/workflows` (save/load workflows)<br>• `/api/knowledge-base` (document storage) | ✅ Complete |
| **🔐 Auth & Security** | Implement:<br>• JWT auth (NextAuth.js or Supabase Auth)<br>• API key support (for agents)<br>• Role-based access (admin, member, agent) | 🟡 In Progress |
| **💬 AI Integration** | Setup:<br>• Vercel AI SDK for OpenAI GPT-4.1 (default provider)<br>• Streaming chat system (SSE or WebSocket fallback)<br>• Agent memory context (basic version)<br>• Token usage tracking and credit system | 🔴 Not Started |

### Phase 1 Implementation Details

#### Database Schema

1. **Create Supabase Tables**:
   - Define table structures according to schema in `lib/plugin-engine/schema.sql`
   - Set up proper relationships and constraints
   - Create indexes for performance optimization

2. **Prisma Integration**:
   - Set up Prisma schema
   - Generate client
   - Create migration scripts

3. **Data Access Layer**:
   - Create repository pattern for data access
   - Implement CRUD operations for each entity
   - Add validation and error handling

#### Core APIs

1. **API Testing**:
   - ✅ Implement comprehensive test suite for knowledge base API routes
   - ✅ Implement test suite for agents, tasks, workflows, chat, and user API routes
   - Ensure proper mocking of authentication and database operations
   - Add tests for success scenarios and error handling (400, 401, 404, 500)
   - ⬜ Set up CI/CD pipeline for automated testing

2. **Agent Management**:
   - `/api/agents` - List, create, update, delete agents
   - `/api/agents/:id` - Get agent details
   - `/api/agents/:id/memory` - Get/update agent memory

2. **Task Management**:
   - `/api/tasks` - List, create tasks
   - `/api/tasks/:id` - Update task status, assign to agent
   - `/api/tasks/:id/complete` - Mark task as complete

3. **Chat System**:
   - `/api/chat/:agentId` - Stream AI responses
   - `/api/chat/:agentId/history` - Get chat history

4. **Workflow Management**:
   - `/api/workflows` - List, create workflows
   - `/api/workflows/:id` - Get, update, delete workflows

#### Authentication & Security

1. **Auth System**:
   - Implement JWT or session-based auth
   - Set up user registration and login
   - Create middleware for protected routes

2. **API Keys**:
   - Generate and validate API keys
   - Implement rate limiting
   - Add key rotation capabilities

3. **Role-based Access**:
   - Define roles and permissions
   - Implement access control middleware
   - Add role assignment functionality

#### AI Integration

1. **AI Service**:
   - Set up Vercel AI SDK with OpenAI GPT-4.1 as default provider
   - Implement streaming response handling
   - Create prompt engineering system
   - Build basic token usage tracking

2. **Agent Context**:
   - Build context gathering for agents
   - Implement memory retrieval for context
   - Create tool calling capabilities
   - Design agent-level isolation for personalities and context

3. **Credit System Foundation**:
   - Implement basic credit tracking per user
   - Create token counting for input/output
   - Set up usage limits for free tier
   - Build credit deduction logic

---

## 🧩 Phase 2 – Intelligent Agents & Integrations

| Area | Task | Status |
|------|------|--------|
| **📦 Agent Memory** | • Build `agent_memory` system with persistence<br>• Context awareness for each agent<br>• Store: known terms, tools, fallback messages | 🟡 In Progress |
| **🔌 Integrations** | • ✅ Implement Notion, Gmail, Slack, Trello, Asana adapters<br>• Add OAuth + token refresh logic<br>• ✅ Build webhook system (receivers, storage, subscriptions, refresh) | 🟢 Mostly Complete |
| **🧠 Knowledge System** | • ✅ Add document upload support (PDF, txt, DOCX, etc.)<br>• ✅ Parse content and store embeddings<br>• ✅ Enable knowledge-based retrieval for chat | 🟢 Complete |
| **⚡ Real-time Events** | • WebSocket server setup (or SSE)<br>• Trigger updates: new task, agent status, tool state<br>• Stream logs to dashboard | 🔴 Not Started |

### Phase 2 Implementation Details

#### Agent Memory System

1. **Memory Storage**:
   - Implement long-term and short-term memory
   - Create memory retrieval system
   - Add memory pruning and prioritization

2. **Context Awareness**:
   - Build context gathering from multiple sources
   - Implement relevance scoring
   - Create context window management

#### Integration Hub

1. **Adapter Implementation**:
   - ✅ Complete Notion, Gmail, Slack adapters
   - ✅ Implement Trello adapter with OAuth support
   - ✅ Implement Asana adapter with OAuth support
   - Add other integrations (Jira, GitHub, etc.)
   - ✅ Create adapter registry

2. **OAuth System**:
   - Implement OAuth flow for each service
   - Add token storage and encryption

3. **Webhook System**:
   - ✅ Implement webhook handlers for Slack, Gmail, and Asana
   - ✅ Create webhook event storage and processing
   - ✅ Add webhook subscription management
   - ✅ Create token refresh mechanism

4. **Notification System**:
   - Set up real-time notification delivery
   - Implement user notification preferences
   - Create notification center UI

#### Knowledge System

1. **Document Processing**:
   - ✅ Implemented file upload and Supabase Storage integration
   - ✅ Created text extraction for various formats (PDF, DOCX, TXT, etc.)
   - ✅ Built chunking and OpenAI embedding generation
   - ✅ Implemented background job processing for asynchronous document handling

2. **Semantic Search**:
   - ✅ Implemented vector search using pgvector extension
   - ✅ Created keyword fallback search with full-text search
   - ✅ Built relevance ranking and scoring system
   - ✅ Added API endpoint for knowledge base search

3. **Chat Integration**:
   - ✅ Integrated knowledge retrieval with chat system
   - ✅ Created context injection for agent prompts
   - ✅ Built knowledge context provider for relevant information retrieval

#### Real-time Features

1. **WebSocket Server**:
   - Set up WebSocket or SSE infrastructure
   - Implement connection management
   - Create event broadcasting system

2. **Event System**:
   - Define event types and payloads
   - Implement event triggers
   - Create subscription mechanism

---

## ⚙️ Phase 3 – Power Features & Expansion

| Area | Task | Status |
|------|------|--------|
| **🎯 Workflow Engine** | • Visual node runner<br>• Trigger-condition-action system<br>• Node processor registry<br>• Schedule execution logic | 🟡 In Progress |
| **📁 File Storage** | • Enable uploads via Supabase Storage or S3<br>• Connect file uploads to agents<br>• Link knowledge to files | 🔴 Not Started |
| **📊 Monitoring & Analytics** | • Build `/api/monitoring` routes<br>• Track:<br>— Agent XP trends<br>— Task volume<br>— Error rate per tool<br>— Latency/response time<br>— Token usage and credit consumption | 🟡 Partial |
| **💳 LLM Billing System** | • Implement credit-based usage tracking<br>• Build BYO-LLM provider system<br>• Create `/api/llm/stream`, `/api/usage` and `/api/plans` routes<br>• Integrate Stripe for add-on credit purchases<br>• Admin dashboard for Teams/Enterprise | 🔴 Not Started |
| **📚 Docs & Config** | • Add `/api/docs` endpoint for dynamic agent docs<br>• Implement per-agent configuration panel | 🔴 Not Started |

### Phase 3 Implementation Details

#### Workflow Engine

1. **Node System**:
   - Define node types and interfaces
   - Implement node processors
   - Create node registry

2. **Workflow Runner**:
   - Build execution engine
   - Implement state management
   - Create error handling and recovery

3. **Scheduling**:
   - Implement cron-based scheduling
   - Create trigger system
   - Build execution history

#### File Storage

1. **Storage System**:
   - Set up Supabase Storage or S3
   - Implement file upload and retrieval
   - Create file metadata management

2. **File Processing**:
   - Implement file type detection
   - Create preview generation
   - Build file versioning

#### Monitoring & Analytics

1. **Metrics Collection**:
   - Define key metrics to track
   - Implement data collection
   - Create aggregation functions

2. **Dashboard APIs**:
   - Build analytics endpoints
   - Create visualization data formatters
   - Implement trend analysis

#### LLM Billing System

1. **Credit-based Usage Tracking**: ✅
   - ✅ Implemented token counting for input/output with model-specific cost ratios
   - ✅ Created credit conversion system based on model cost
   - ✅ Built usage tracking and quota enforcement with plan-specific limits
   - ✅ Set up usage alerts and notifications

2. **BYO-LLM Provider System**: ✅
   - ✅ Implemented secure API key storage in Supabase
   - ✅ Created model provider adapters (Claude, Gemini, Mistral, etc.)
   - ✅ Built agent-level model selection
   - ✅ Implemented provider-specific rate limiting

3. **Billing API Routes**: ✅
   - ✅ Created `/api/llm/stream` for unified LLM access with credit enforcement
   - ✅ Built `/api/billing/usage` for credit tracking and reporting
   - ✅ Implemented `/api/billing/subscription` endpoints for subscription management
   - ✅ Set up Stripe integration for add-on credit purchases and subscription management
   - ✅ Added `/api/billing/subscription/limits` for resource usage enforcement

4. **Admin Dashboard**: 🟡
   - ✅ Created organization usage overview
   - ✅ Built resource type enforcement for agents, workflows, batch jobs, etc.
   - ✅ Implemented quota management system with plan-specific limits
   - 🟡 Set up overage notification system (partial)

#### Documentation & Configuration

1. **Dynamic Documentation**:
   - Create documentation generator
   - Implement API reference
   - Build interactive examples

2. **Configuration System**:
   - Implement agent configuration
   - Create system settings
   - Build configuration UI endpoints

---

## 📂 Recommended File/Folder Structure

```
/app
  /api
    /agents
      /[id]
        /memory
        /route.ts
      /route.ts
    /tasks
      /[id]
        /complete
        /route.ts
      /route.ts
    /chat
      /[agentId]
        /history
        /route.ts
      /route.ts
    /workflows
      /[id]
        /execute
        /route.ts
      /route.ts
    /plugin-engine
      /context-mappings
      /errors
      /integrations
      /tasks
  /dashboard
    /agents
    /tasks
    /workflows
    /integrations
    /monitoring
  /lib
    /ai
      /chat.ts
      /memory.ts
      /tools.ts
    /auth
      /jwt.ts
      /roles.ts
    /db
      /prisma
      /repositories
      /migrations
    /integrations
      /notion-adapter.ts
      /gmail-adapter.ts
      /slack-adapter.ts
    /plugin-engine
      /error-handler.ts
      /plugin-engine.ts
      /context-mapper.ts
      /scheduler.ts
    /utils
      /date.ts
      /encryption.ts
      /validation.ts
    /workflows
      /engine.ts
      /nodes.ts
      /processors.ts
```

## 🚀 Next Steps

1. **Database Schema Design**
   - Finalize all table models (Supabase + Prisma)
   - Create schema and migration scripts
   - Set up indexes for performance

2. **Core API Endpoints**
   - Implement `/api/agents` and `/api/tasks` first
   - Add `/api/chat/[agentId]` with AI streaming
   - Create basic workflow storage

3. **Authentication**
   - Choose between Supabase Auth or JWT setup
   - Implement role-based access control
   - Secure all API routes

## 📊 Progress Tracking

| Phase | Component | Progress | ETA |
|-------|-----------|----------|-----|
| 1 | Database Schema | 100% | ✅ Completed Jun 6, 2025 |
| 1 | Core APIs | 75% | In Progress |
| 1 | Auth & Security | 60% | In Progress |
| 1 | AI Integration | 0% | TBD |
| 2 | Agent Memory | 50% | In Progress |
| 2 | Integrations | 20% | TBD |
| 2 | Knowledge System | 100% | ✅ Completed Jun 8, 2025 |
| 2 | Real-time Events | 0% | TBD |
| 3 | Workflow Engine | 30% | In Progress |
| 3 | File Storage | 0% | TBD |
| 3 | Monitoring & Analytics | 15% | TBD |
| 3 | LLM Billing System | 90% | ✅ Mostly Complete |
| 3 | Docs & Config | 0% | TBD |

## 📝 Notes

- ✅ Database schema has been successfully implemented in Supabase (June 6, 2025)
- ✅ Test data creation and validation scripts are in place
- ✅ Error handling system has been implemented and tested
- ✅ Core API tests implemented with proper mocking for all major routes (June 7, 2025)
- ✅ Hybrid architecture with Supabase Auth + Prisma ORM successfully implemented
- ✅ Centralized validation and authentication utilities created (June 7, 2025)
- ✅ Knowledge base API implemented with CRUD operations (June 7, 2025)
- ✅ User settings and API key management implemented (June 7, 2025)
- ✅ Enhanced agent memory system with context awareness (June 7, 2025)
- ✅ Workflow execution API implemented (June 7, 2025)
- ✅ LLM Billing System with Stripe integration implemented (June 7, 2025)
- ✅ Subscription usage limits for Overseer-specific resource types (June 7, 2025)
- ✅ Credit tracking and enforcement with plan-specific limits (June 7, 2025)
- ✅ Batch processing system with credit pre-authorization (June 7, 2025)
- ✅ Redis caching layer for LLM responses to reduce token usage (June 7, 2025)
- Adapter interfaces exist but need completion
- Focus on Supabase and Redis integration throughout implementation
- Follow Airbnb Style Guide for code formatting
