# 🎨 AGENTS OS Frontend Specification

## 📋 Overview

This document provides a complete specification for the AGENTS OS frontend - a sophisticated AI agent management portal. The frontend should be built as a modern, responsive web application with real-time capabilities and intuitive user experience.

**Tech Stack Recommendations:**
- **Framework**: Next.js 14+ (App Router) or React 18+ with Vite
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: React Context + useReducer or Zustand
- **Authentication**: Supabase Auth
- **Real-time**: WebSockets or Supabase Realtime
- **Charts**: Recharts or Chart.js
- **Icons**: Lucide React or Heroicons

---

## 🏗️ Application Architecture

### Layout Structure
```
┌─────────────────────────────────────────┐
│ Header (Auth, Notifications, Profile)   │
├─────────┬───────────────────────────────┤
│         │                               │
│ Sidebar │        Main Content           │
│ (Nav)   │        (Dynamic Pages)        │
│         │                               │
│         │                               │
├─────────┴───────────────────────────────┤
│ Footer (Optional)                       │
└─────────────────────────────────────────┘
```

### Responsive Behavior
- **Desktop (1024px+)**: Full sidebar + main content
- **Tablet (768-1023px)**: Collapsible sidebar
- **Mobile (<768px)**: Bottom navigation or hamburger menu

---

## 🔐 Authentication Flow

### Landing Page (Unauthenticated)
```
┌─────────────────────────────────────────┐
│ Hero Section                            │
│ - "Manage Your AI Agent Team"           │
│ - Key features overview                 │
│ - Sign Up / Sign In buttons            │
├─────────────────────────────────────────┤
│ Features Section                        │
│ - Agent collaboration                   │
│ - Persistent memory                     │
│ - Workflow automation                   │
├─────────────────────────────────────────┤
│ CTA Section                             │
│ - "Get Started" button                  │
└─────────────────────────────────────────┘
```

### Authentication Modal/Page
- **Sign Up**: Email, password, confirm password
- **Sign In**: Email, password, "Remember me"
- **Social Auth**: Google, GitHub (optional)
- **Password Reset**: Email-based recovery
- **Email Verification**: Required for new accounts

### Post-Authentication Redirect
- **New Users**: Onboarding flow → Create first agent
- **Returning Users**: `/portal/dashboard`

---

## 🏠 Portal Dashboard

### Dashboard Layout
```
┌─────────────────────────────────────────┐
│ Header: "Welcome back, [Name]"          │
│ Quick Actions: [+ Create Agent] [Refresh]│
├─────────────────┬───────────────────────┤
│ Agent Cards     │ Recent Activity       │
│ (2-3 columns)   │ - Last 10 activities  │
│                 │ - Real-time updates   │
├─────────────────┼───────────────────────┤
│ Team Stats      │ Needs Attention       │
│ - Total agents  │ - Offline agents      │
│ - Active rate   │ - Failed tasks        │
│ - Departments   │ - System alerts       │
└─────────────────┴───────────────────────┘
```

### Agent Cards
Each agent card should display:
- **Avatar**: Emoji or custom image
- **Name & Role**: "Alex - Strategic Coordinator"
- **Status Indicator**: Green (active), Yellow (idle), Red (offline), Blue (collaborating)
- **Last Active**: "2 minutes ago"
- **Department Badge**: Color-coded department tag
- **Quick Actions**: Chat button, Settings button

### Interactive Elements
- **Hover Effects**: Subtle elevation and glow
- **Click Actions**: Navigate to agent detail or start chat
- **Status Updates**: Real-time status changes with smooth animations
- **Loading States**: Skeleton loaders while fetching data

---

## 🤖 Agent Management

### Agent Directory (`/portal/agents`)
```
┌─────────────────────────────────────────┐
│ Header: "Your Agents" [+ Create Agent]  │
│ Filters: [All] [Active] [Offline] [Dept]│
├─────────────────────────────────────────┤
│ Agent Grid/List View                    │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ Agent 1 │ │ Agent 2 │ │ Agent 3 │    │
│ │ Card    │ │ Card    │ │ Card    │    │
│ └─────────┘ └─────────┘ └─────────┘    │
├─────────────────────────────────────────┤
│ Pagination or Infinite Scroll          │
└─────────────────────────────────────────┘
```

### Agent Creation Flow
1. **Basic Info**: Name, role, description
2. **Personality**: Select from presets or custom
3. **Tools**: Choose available integrations
4. **Department**: Assign to department (optional)
5. **Review**: Confirm settings and create

### Agent Detail Page (`/portal/agents/[id]`)
```
┌─────────────────────────────────────────┐
│ Agent Header                            │
│ [Avatar] Alex - Strategic Coordinator   │
│ Status: Active | Last seen: 2 min ago   │
│ [Chat] [Edit] [Delete] [Collaborate]    │
├─────────────────┬───────────────────────┤
│ Agent Info      │ Recent Conversations  │
│ - Personality   │ - Chat history        │
│ - Tools         │ - Message previews    │
│ - Memory        │ - Timestamps          │
│ - Performance   │                       │
├─────────────────┼───────────────────────┤
│ Collaboration   │ Memory & Context      │
│ - Team messages │ - Learned preferences │
│ - Shared memory │ - Active goals        │
│ - Statistics    │ - Context sessions    │
└─────────────────┴───────────────────────┘
```

---

## 💬 Chat Interface

### Chat Layout
```
┌─────────────────────────────────────────┐
│ Chat Header                             │
│ [Avatar] Alex | Mode: Standard ▼        │
│ Status: Active | [Collaborate] [Memory] │
├─────────────────────────────────────────┤
│ Message History                         │
│ ┌─────────────────────────────────────┐ │
│ │ User: Help me plan a project        │ │
│ │ 2:30 PM                             │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Alex: I'd be happy to help you...   │ │
│ │ 2:31 PM                             │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Input Area                              │
│ [Type your message...] [Send] [Attach]  │
└─────────────────────────────────────────┘
```

### Chat Features
- **Streaming Responses**: Real-time message streaming with typing indicators
- **Mode Switching**: Dropdown to change agent mode (urgent, detailed, creative)
- **Memory Context**: Sidebar showing relevant memories and context
- **Collaboration Panel**: Invite other agents to the conversation
- **Message Actions**: Copy, edit, delete, react to messages
- **File Attachments**: Support for documents, images (future feature)

### Message Types
- **User Messages**: Right-aligned, blue background
- **Agent Messages**: Left-aligned, gray background with agent avatar
- **System Messages**: Centered, italic text for mode changes, etc.
- **Collaboration Messages**: Special styling for inter-agent communication

---

## 🚀 User Flows

### First-Time User Journey
1. **Landing Page**: Learn about the platform
2. **Sign Up**: Create account with email verification
3. **Onboarding**: Welcome tour and first agent creation
4. **First Chat**: Guided interaction with their first agent
5. **Explore Features**: Discover departments, workflows, integrations

### Daily User Journey
1. **Login**: Quick authentication
2. **Dashboard**: Overview of agent activity and alerts
3. **Chat**: Interact with agents for daily tasks
4. **Monitor**: Check agent performance and system health
5. **Collaborate**: Facilitate agent-to-agent collaboration

### Power User Journey
1. **Workflow Creation**: Build complex automation workflows
2. **Integration Setup**: Connect multiple external services
3. **Team Management**: Organize agents into departments
4. **Analytics Review**: Analyze performance and optimize
5. **Advanced Configuration**: Fine-tune agent personalities and behaviors

---

## 🎨 Design System

### Color Palette
```css
/* Primary Colors */
--primary-50: #eff6ff;
--primary-500: #3b82f6;
--primary-900: #1e3a8a;

/* Status Colors */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #06b6d4;

/* Neutral Colors */
--gray-50: #f9fafb;
--gray-500: #6b7280;
--gray-900: #111827;
```

### Typography
- **Headings**: Inter or Poppins (bold, clean)
- **Body Text**: Inter or System UI (readable, accessible)
- **Code**: JetBrains Mono or Fira Code (monospace)

### Component Patterns
- **Cards**: Subtle shadows, rounded corners, hover effects
- **Buttons**: Clear hierarchy (primary, secondary, ghost)
- **Forms**: Consistent spacing, clear validation states
- **Navigation**: Active states, breadcrumbs, clear hierarchy

---

## 📱 Mobile Experience

### Mobile Navigation
- **Bottom Tab Bar**: Dashboard, Agents, Chat, More
- **Hamburger Menu**: Secondary navigation items
- **Swipe Gestures**: Navigate between chat conversations

### Mobile-Specific Features
- **Touch Optimized**: Larger touch targets, swipe actions
- **Offline Support**: Cache recent conversations and agent data
- **Push Notifications**: Mobile notifications for important events
- **Voice Input**: Speech-to-text for chat messages (future feature)

---

## ⚡ Performance & UX

### Loading States
- **Skeleton Loaders**: For cards, lists, and content areas
- **Progressive Loading**: Load critical content first
- **Optimistic Updates**: Immediate UI feedback for user actions
- **Error Boundaries**: Graceful error handling with recovery options

### Real-time Features
- **Live Status Updates**: Agent status changes in real-time
- **Typing Indicators**: Show when agents are "thinking"
- **Presence Indicators**: Show who's online/active
- **Live Collaboration**: Real-time updates in shared workspaces

### Accessibility
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and roles
- **Color Contrast**: WCAG AA compliance
- **Focus Management**: Clear focus indicators and logical tab order

---

## 🔧 State Management

### Global State Structure
```javascript
{
  auth: {
    user: User | null,
    session: Session | null,
    loading: boolean
  },
  agents: {
    list: Agent[],
    selected: Agent | null,
    loading: boolean,
    error: string | null
  },
  chat: {
    conversations: Conversation[],
    activeConversation: string | null,
    messages: Message[],
    streaming: boolean
  },
  notifications: {
    items: Notification[],
    unreadCount: number
  },
  ui: {
    sidebarOpen: boolean,
    theme: 'light' | 'dark',
    notifications: Toast[]
  }
}
```

### Data Flow
1. **API Calls**: Centralized API service layer
2. **State Updates**: Actions dispatch state changes
3. **Component Updates**: React to state changes with useEffect
4. **Optimistic Updates**: Update UI immediately, sync with server
5. **Error Handling**: Rollback optimistic updates on failure

---

## 📋 Development Checklist

### Setup & Configuration
- [ ] Project initialization with chosen framework
- [ ] Tailwind CSS + Shadcn/ui setup
- [ ] Authentication integration (Supabase)
- [ ] API client configuration
- [ ] State management setup

### Core Components
- [ ] Layout components (Header, Sidebar, Footer)
- [ ] Authentication components (Login, Signup, Reset)
- [ ] Agent components (Card, List, Detail, Create)
- [ ] Chat components (Interface, Message, Input)
- [ ] Dashboard components (Stats, Activity, Attention)

### Pages & Routing
- [ ] Landing page (unauthenticated)
- [ ] Portal dashboard
- [ ] Agent management pages
- [ ] Chat interface
- [ ] Department pages
- [ ] Settings pages

### Advanced Features
- [ ] Real-time updates (WebSocket/Supabase Realtime)
- [ ] Notification system
- [ ] Workflow builder (if included)
- [ ] Analytics dashboard
- [ ] Mobile responsiveness

### Testing & Deployment
- [ ] Unit tests for components
- [ ] Integration tests for user flows
- [ ] E2E tests for critical paths
- [ ] Performance optimization
- [ ] Deployment configuration

---

This specification provides a comprehensive guide for building a modern, user-friendly frontend for the AGENTS OS platform. The focus is on creating an intuitive, responsive, and feature-rich experience that makes AI agent management feel natural and powerful.
