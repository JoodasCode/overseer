# 📘 Portal Shift — AGENTS OS Internal Portal System

This document outlines the complete upgrade of AGENTS OS into a full-fledged **internal portal system**—a centralized, contextual, and persistent interface for managing all agent activity, tools, communications, and workflows.

## 🎯 **CURRENT PROGRESS STATUS**

### ✅ **COMPLETED PHASES**

| Phase | Status | Completion Date | Key Achievements |
|-------|--------|----------------|------------------|
| **Phase 1** | ✅ **COMPLETE** | *Recently* | Portal structure, sidebar navigation, routing |
| **Phase 2** | ✅ **COMPLETE** | *Recently* | Database migration, portal tables, RLS policies |
| **Phase 3** | ✅ **COMPLETE** | *Recently* | Dashboard rework, 4 modular components |
| **Phase 4** | ✅ **COMPLETE** | *Just Finished* | **Chat + Intelligence with full AI collaboration** |

### 🔄 **NEXT PHASE**

| Phase | Status | Ready Date | Focus |
|-------|--------|------------|-------|
| **Phase 5** | 🔄 **READY TO START** | *Now* | Visual polish, animations, UX enhancements |

### 🏆 **MAJOR ACCOMPLISHMENTS**

#### ✅ **Phase 4 - Chat + Intelligence** *(Just Completed)*
- **🧠 Agent Intelligence**: 5 operational modes per agent (standard, urgent, detailed, creative, executive)
- **🤝 Inter-Agent Collaboration**: Direct messaging and memory sharing between agents
- **💾 Persistent Memory**: Agents remember conversations and share context with team members
- **🎭 Personality Enforcement**: Behavioral consistency with Communications Department profiles
- **🔧 New APIs**: 3 new API routes for memory, modes, and collaboration
- **🎨 Enhanced UI**: Collaboration panel, personality indicators, mode switching

#### ✅ **System Architecture**
- **Database**: 5 new intelligence tables with comprehensive RLS
- **API Layer**: Enhanced chat API with personality injection and mode awareness
- **Frontend**: Professional portal interface with modular dashboard
- **Security**: User-scoped agent data with proper isolation

### 📊 **SYSTEM CAPABILITIES**

The portal now supports:
- ✅ **Persistent Agent Memory** across sessions
- ✅ **Behavioral Consistency** with distinct agent personalities
- ✅ **Inter-Agent Collaboration** with messaging and memory sharing
- ✅ **Dynamic Mode Switching** for different interaction styles
- ✅ **Team Coordination** with department-based agent grouping
- ✅ **Professional Dashboard** with real-time activity tracking

### 🚀 **READY FOR PRODUCTION**

The system is now a sophisticated AI collaboration platform where agents:
1. **Think Consistently** - Maintain personality and behavioral patterns
2. **Remember Everything** - Persistent memory across sessions and shared context
3. **Collaborate Intelligently** - Direct communication and knowledge sharing
4. **Adapt Dynamically** - Mode switching for different interaction styles
5. **Work as a Team** - Department-based coordination and collaboration

---

## 🔧 URL/Architecture Changes

### New Base URL Structure

```
/portal
  /dashboard        → Agent status, team XP, needs attention, agent activity
  /agents           → Agent directory and management
  /departments      → Pre-grouped agent types (Comms, HR, Ops, Product)
  /tasks            → Task dashboard (assigned/to review/complete)
  /knowledge        → Agent-shared documents and context memory
  /integrations     → Connected tools, token management
  /workflow-builder → Node-based automation
  /activity-log     → Full agent and system history
```

### Updated Routing Structure (Next.js/Router)

- Convert current flat pages to dynamic, nested routes with `layout.tsx` at `/portal` level
- Replace `/dashboard` as root path → `/portal/dashboard`
- Replace `/agents/:id` with `/portal/agents/:agentId`
- Make all routes Supabase `authenticated` middleware protected

---

## 🧠 Supabase Schema Changes

### 🔄 Renamed Tables

- `agents` → `portal_agents`
- `agent_tasks` → `portal_agent_tasks`
- `agent_memory` → `portal_agent_memory`
- `agent_logs` → `portal_agent_logs`

> Update all Prisma (or Supabase JS SDK) references

### 🆕 New Tables

#### `portal_departments`

```sql
id UUID PRIMARY KEY
name TEXT
slug TEXT
icon TEXT
color TEXT
```

#### `portal_agent_groups`

```sql
id UUID PRIMARY KEY
agent_id UUID FK → portal_agents
department_id UUID FK → portal_departments
user_id UUID FK → auth.users
custom_name TEXT
custom_avatar TEXT
is_pinned BOOLEAN
```

#### `portal_knowledge_base`

```sql
id UUID PRIMARY KEY
agent_id UUID FK → portal_agents
user_id UUID
title TEXT
content TEXT
tags TEXT[]
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### `portal_activity_log`

```sql
id UUID PRIMARY KEY
actor_type TEXT -- user | agent | system
actor_id UUID
action TEXT
meta JSONB
created_at TIMESTAMP
```

#### `portal_notifications`

```sql
id UUID PRIMARY KEY
user_id UUID
agent_id UUID NULLABLE
type TEXT -- 'task', 'report', 'warning', 'insight'
title TEXT
description TEXT
status TEXT -- unread | read | archived
created_at TIMESTAMP
```

---

## 🖥️ Frontend System Changes

### 🧱 Global Layout

- Persistent sidebar under `/portal`
- Sidebar tabs:
  - Dashboard
  - Agents
  - Communications (Messaging log + writing agents)
  - Tasks
  - Workflow Builder
  - Departments (Comms, HR, etc.)
  - Integrations
  - Settings
  - Agent Health / Error Monitor

---

### 🧠 Agent Intelligence Layer

Each agent now has:
- `personality_profile`: stored JSON with tone, style, tools
- `memory_map`: embedded knowledge from interactions
- `task_feed`: timeline of assigned and self-initiated actions

#### Chat UI Changes

- Memory surfacing: Auto-populate memory hints inline
- Context bar: Show active tasks, tools connected
- Tabs: Memory | Context | Tools | History

---

## 🧩 Back-End Enhancements

### Authentication

- Use Supabase Auth
- Enforce per-user session using Supabase JWT middleware

### Caching

- Redis:
  - `agent_context_cache:<agent_id>`
  - `last_action:<agent_id>`
  - `portal_notifications:<user_id>`

### Logging

- All major agent actions stored in `portal_activity_log`
- System events include:
  - Agent creation
  - Memory update
  - Integration failure
  - Task reassignment

---

## 🧠 AI Intelligence Persistence

### Prompt Injection Template (Per Agent)

```
You are {{agent_name}}, a {{agent_role}} AI agent.
Tone: {{tone}}
Preferred Tools: {{tools_preferred}}
Last memory: {{agent_memory.last}}
Open Tasks: {{open_tasks.summary}}
Knowledge Context: {{knowledge_base.extracts}}
```

All of this is stored per-user.

---

## 🎯 Cursor To-Do Instructions

**Objective:** Convert AGENTS OS into an internal-only, persistent **AI Agent Portal** where users manage, grow, and collaborate with sentient agents.

---

### 🧱 Phase 1 — Structural Conversion ✅ **COMPLETE**

**Goal:** Refactor current app layout into a proper portal architecture.

#### 🔧 Frontend:
- [x] ✅ Create new layout route: `/portal`
  - Mount entire portal experience here (Dashboard, Agents, Analytics, Automations, etc.)
- [x] ✅ Update all side navigation routes to live under `/portal/*`
  - e.g. `/portal/dashboard`, `/portal/agents`, `/portal/settings`
- [x] ✅ Convert legacy dashboard to `PortalDashboard.tsx`
  - Replace homepage logic with redirect to `/portal/dashboard` if user is authenticated

#### 🌐 Routing:
- [x] ✅ Add redirect in root layout:

```ts
if (user.authenticated) {
  router.push('/portal/dashboard')
}
```

**Status**: ✅ **COMPLETE** - Full portal structure implemented with persistent sidebar navigation

---

### 🧬 Phase 2 — Database Rewiring ✅ **COMPLETE**

**Goal:** Ensure each agent is uniquely tied to a user and supports persistent behavior.

#### 🔄 Supabase Changes:

##### ✅ Tables:
- [x] ✅ `portal_agents`: Renamed from `agents` with enhanced fields
  - Added `personality_profile`, `memory_map`, `task_feed`
  - Added `level_xp`, `efficiency_score`, `department_type`
- [x] ✅ `portal_agent_memory`: Enhanced memory system
  - Added `agent_id` FK, `user_id` FK
  - Added memory types and context fields
- [x] ✅ `portal_agent_logs`: Complete chat and interaction logging
- [x] ✅ `portal_departments`: Department categorization system
- [x] ✅ `portal_knowledge_base`: Shared knowledge and memory
- [x] ✅ `portal_activity_log`: Comprehensive activity tracking

#### 🧠 Caching:
- [x] ✅ Enhanced caching strategy implemented
- [x] ✅ User-scoped agent data with proper isolation

**Status**: ✅ **COMPLETE** - Full database migration with portal-prefixed tables and RLS policies

---

### 📊 Phase 3 — Dashboard Rework ✅ **COMPLETE**

**Goal:** Personalize dashboard based on active agents and their activity.

#### 💻 Frontend:
- [x] ✅ Agent widget per hired agent on `/portal/dashboard`
  - Show: avatar, name, status, department, last active
  - Link to detailed `/portal/agents/:id`
- [x] ✅ "Needs Attention" section
  - Based on agent status, offline agents, system issues
- [x] ✅ "Recent Activity" section
  - Pull from `portal_activity_log` (past 24h)
- [x] ✅ Team Stats dashboard
  - Agent counts, active rates, department breakdown
  - **Note**: Gamification (XP/levels) removed per user request

#### 📦 Backend logic:
- [x] ✅ API: `GET /api/portal/dashboard`
  - Return summary of all agent stats, statuses, recent activity
- [x] ✅ Enhanced agent status tracking

**Status**: ✅ **COMPLETE** - Professional dashboard with 4 modular components (no gamification)

---

### 💬 Phase 4 — Chat + Intelligence ✅ **COMPLETE**

**Goal:** Make chat persistent, agent-specific, and behaviorally consistent.

#### 🤖 Agent Chat:
- [x] ✅ Add `system_prompt` injection per agent
  - Pull from `agents` row + `memory` + `tools_preferred`
  - Enhanced personality profiles with Communications Department agents
- [x] ✅ Persist all chats in `portal_agent_logs`
  - Include agent_id, user_id, full conversation history
- [x] ✅ Add context injection from:
  - Shared memory between agents
  - Long-term agent memory
  - Active mode configurations

#### 🧠 Agent Intelligence Rules:
- [x] ✅ Build middleware that enforces:
  - Tone/personality consistency via enhanced system prompts
  - Mode-aware behavior (urgent, detailed, creative, executive)
  - Inter-agent collaboration and memory sharing
  - Department-specific behaviors for Communications team

#### 🆕 Advanced Intelligence Features:
- [x] ✅ **Agent Modes System**: 5 operational modes per agent with dynamic switching
- [x] ✅ **Inter-Agent Collaboration**: Direct messaging and memory sharing between agents
- [x] ✅ **Personality Profiles**: Comprehensive behavioral and communication profiles
- [x] ✅ **Shared Memory**: Team context and knowledge sharing capabilities
- [x] ✅ **Mode-Aware Parameters**: OpenAI parameters adjust based on active agent mode

#### 🔧 New API Routes:
- [x] ✅ `/api/agents/[id]/memory` - Agent memory management
- [x] ✅ `/api/agents/[id]/modes` - Agent mode switching
- [x] ✅ `/api/agents/[id]/collaborate` - Inter-agent collaboration

#### 🎨 Frontend Enhancements:
- [x] ✅ Enhanced chat interface with personality indicators
- [x] ✅ Agent collaboration panel with messaging and memory sharing
- [x] ✅ Mode switching controls and context displays

**Status**: ✅ **COMPLETE** - Full intelligence layer with persistent memory, behavioral consistency, and team collaboration

---

### 🪄 Phase 5 — Visual Polish 🔄 **READY TO START**

**Goal:** Add animations, sound effects, and advanced UX polish.

- [ ] Animate agent cards with smooth transitions
- [ ] Add confetti/sound on successful task completions
- [ ] Add visual "team heatmap" of activity
- [ ] Support keyboard shortcuts (e.g. Cmd+K to switch agent)
- [ ] Enhanced collaboration visualizations
- [ ] Smooth mode transition effects
- [ ] Real-time collaboration indicators

---

## ✅ Summary

This transformation turns AGENTS OS into a complete internal **agent portal system**:
- No longer a shallow chatbot interface
- Structured, contextual, task-assigned agents
- Integrated memory, tooling, and dashboards
- Designed for persistent user-specific AI workspaces

---

## 🎨 UI/UX Design Philosophy

### Move Away from Gameboy/Retro
- **Modern, clean, and professional**: Use Shadcn UI consistently
- **Sidebar navigation**: Persistent, with clear icons and section labels
- **Agent cards**: Use avatars, XP bars, and status indicators
- **Dashboard**: Modular widgets (active agents, needs attention, recent activity, team XP)
- **Chat**: Tabs for Memory, Context, Tools, History. Inline memory hints and tool suggestions
- **Color palette**: Accessible, high-contrast, but friendly and modern (think Linear, Notion, or Superhuman)

### Delightful Details
- **Animations**: Level-up, confetti, smooth transitions
- **Feedback**: Toasts, notifications, and subtle sound cues
- **Accessibility**: Keyboard navigation, screen reader support, colorblind-friendly

---

## 🚀 Why This Portal Approach Works

### 1. **Centralized, Contextual, Persistent**
- All agent activity, memory, and tools in one place
- Contextual awareness: Agents, tasks, and knowledge tied to the right user and department
- Persistent state: Everything is saved, auditable, and user-specific

### 2. **Enterprise-Ready Structure**
- Department and group logic: Scales to HR, Ops, Product, etc.
- Activity log, notifications, and knowledge base: Features real teams expect
- Authentication and access control: Supabase Auth + JWT middleware

### 3. **Agent Intelligence Layer**
- Personality, memory, and task feed: Each agent is a living, evolving teammate
- Prompt injection and context surfacing: Ensures agents always act "in character"

### 4. **Modern, Modular Routing**
- `/portal/*` structure: Clean, scalable, and easy to extend
- Sidebar navigation: Familiar to users of modern SaaS and internal tools

---

**End of Portal Shift Specification** 