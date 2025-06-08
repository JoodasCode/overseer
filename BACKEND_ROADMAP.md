# Overseer Backend Development Roadmap

## 🎯 Overview

This document outlines the comprehensive development plan for the Overseer backend, structured into three progressive phases with clear priorities and implementation guidelines.

## 🧱 Implementation Plan Overview

The backend development is divided into three phases, each building upon the previous to create a robust, scalable platform for AI agent management.

---

## ✅ Phase 1 – Foundational Core (Highest Priority)

### Database Schema
- [x] Implement core tables in Supabase:
  - `agents`, `tasks`, `agent_memory`, `workflows`
  - `context_mappings`, `tools`, `users`, `error_logs`
- [x] Set up Prisma for migration scripts
- [x] Create indexes for performance optimization

### Core APIs
- [x] Build API routes for:
  - `/api/agents` (CRUD)
  - `/api/tasks` (create, assign, update status)
  - `/api/chat/[agentId]` (streamed AI responses)
  - `/api/workflows` (save/load workflows)
  - `/api/knowledge-base` (document storage)

### Auth & Security
- [x] Implement JWT auth with NextAuth.js
- [x] Set up API key support for agents
- [x] Create role-based access (admin, member, agent)
- [ ] Add OAuth providers (Google, GitHub)

### AI Integration
- [x] Setup Vercel AI SDK for OpenAI GPT-4.1
- [x] Implement streaming chat system
- [x] Create agent memory context
- [x] Add token usage tracking

---

## 🧩 Phase 2 – Intelligent Agents & Integrations

### Agent Memory System
- [x] Build `agent_memory` system with persistence
- [x] Implement context awareness for each agent
- [x] Store: known terms, tools, fallback messages

### Integrations
- [x] Implement core adapters:
  - Notion, Gmail, Slack, Trello, Asana
- [x] Add OAuth + token refresh logic
- [x] Build webhook system

### Knowledge System
- [x] Add document upload support
- [x] Parse content and store embeddings
- [x] Enable knowledge-based retrieval for chat

### Real-time Features
- [x] WebSocket server setup
- [x] Implement trigger updates
- [x] Stream logs to dashboard

---

## ⚙️ Phase 3 – Power Features & Expansion

### Workflow Engine
- [x] Visual node runner
- [x] Trigger-condition-action system
- [x] Node processor registry
- [x] Schedule execution logic

### File Storage
- [x] Enable uploads via Supabase Storage
- [x] Connect file uploads to agents
- [x] Link knowledge to files

### Monitoring & Analytics
- [x] Build `/api/monitoring` routes
- [x] Track:
  - Agent XP trends
  - Task volume
  - Error rate per tool
  - Latency/response time
  - Token usage

### LLM Billing System
- [x] Implement credit-based usage tracking
- [x] Build BYO-LLM provider system
- [x] Create billing API routes
- [x] Integrate Stripe for add-on credits

### Documentation & Configuration
- [x] Add comprehensive API documentation

---

## 📂 File Structure

```
/app
  /api
    /agents
    /tasks
    /chat
    /workflows
    /plugin-engine
  /lib
    /ai
    /auth
    /db
    /integrations
    /plugin-engine
    /utils
    /workflows
```

## 🔧 Environment Setup

Required environment variables:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# OAuth
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=

# Cron
CRON_SECRET_TOKEN=
```

## 📊 Progress Tracking

| Component | Status | Last Updated |
|-----------|--------|--------------|
| Database Schema | ✅ Complete | Jun 6, 2025 |
| Core APIs | ✅ Complete | Jun 7, 2025 |
| Auth & Security | 🟡 In Progress | Jun 7, 2025 |
| AI Integration | ✅ Complete | Jun 7, 2025 |
| Agent Memory | ✅ Complete | Jun 7, 2025 |
| Integrations | ✅ Complete | Jun 7, 2025 |
| Knowledge System | ✅ Complete | Jun 7, 2025 |
| Real-time Features | ✅ Complete | Jun 7, 2025 |
| Workflow Engine | ✅ Complete | Jun 7, 2025 |
| File Storage | ✅ Complete | Jun 7, 2025 |
| Monitoring | ✅ Complete | Jun 7, 2025 |
| LLM Billing | ✅ Complete | Jun 7, 2025 |
| Documentation & Configuration | ✅ Complete | Jun 7, 2025 |

## 🚀 Next Steps

1. Complete OAuth provider integration
2. Implement automated testing for the workflow scheduler and other components

## 📝 Notes

- All core functionality is implemented and tested
- Focus on real-time features and workflow scheduling
- Need to complete OAuth provider integration
- Consider adding more third-party integrations
- Plan for enterprise features in future phases

## Completed Tasks
- Real-time features (SSE) implemented.
- Workflow scheduling API endpoints added.
- API documentation updated.

## Next Steps
- Implement automated testing for the workflow scheduler and other components.

## 🧪 Automated Testing Strategy

- Most core logic is covered by unit and integration tests using mocks for DB and external APIs.
- Workflow engine, plugin engine, and error handling are tested in isolation.
- End-to-end tests for workflow execution and plugin adapters run in mock mode if DB is unavailable.
- When DB is available, full integration tests are run for workflows, scheduling, and real-time features.
- Pending: Enable full integration tests for workflow scheduler and plugin engine once DB is live.

## ✅ Recently Completed
- Context mapping: single, bulk upsert, and bulk delete operations (Supabase + Redis)
- Comprehensive automated tests for:
  - Plugin adapters (Slack, Gmail, etc.)
  - Workflow engine (integration, error, retry)
  - Error handler (fallbacks, bulk resolution)
  - Context mapping (single, bulk, cache consistency)
  - WebSocket real-time events

## 🟡 Remaining Backend Tasks & Suggestions

1. **Database Migration & Live Integration**
   - Complete DB migration when Supabase is available
   - Run full integration tests with live DB

2. **OAuth Provider Finalization**
   - Finish and test Google, GitHub, Slack, Notion, etc. OAuth flows
   - Add more provider support as needed

3. **API Route Edge Cases**
   - Add more tests for API error handling, permissions, and edge cases
   - Test rate limiting, throttling, and abuse prevention

4. **Performance & Scalability**
   - Add load tests for workflow execution and plugin engine
   - Optimize Redis/Supabase usage for high concurrency

5. **Monitoring & Analytics**
   - Expand real-time monitoring (WebSocket events, error logs)
   - Add more analytics endpoints if needed

6. **Documentation & Developer Experience**
   - Add more usage examples to API docs
   - Expand README with advanced scenarios and troubleshooting

7. **Enterprise Features (Future)**
   - SSO, audit logs, advanced permissions, multi-org support
