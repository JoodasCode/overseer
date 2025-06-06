# 🤖 AGENTS OS - Complete Business Automation Platform

**Run your company like a game with AI agents**

A comprehensive, production-ready AI agent management system that transforms business operations into an engaging, gamified experience. Built with modern web technologies and designed for enterprise scalability.

---

## ✨ Features

### 🎮 Core Functionality
- **Agent Management**: Hire, customize, and manage AI agents with different roles
- **Task Assignment**: Create and assign tasks with XP rewards and priority levels
- **Gamification**: Level up agents, unlock skills, and track progress
- **Memory System**: Agents learn and remember from interactions
- **Automation Hub**: Set up workflows and agent collaborations
- **Real-time Chat**: Engage with agents in real-time through a chat interface

### 🎨 Customization
- **Emoji Selection**: Choose from curated emoji sets for each agent
  - 👤 Human (🧑‍💼 👩‍💻 👨‍🔬 👨‍🏫 👩‍🚀)
  - 🐾 Animal (🐸 🐻 🐱 🦊 🐼)
  - 👽 Fantasy (👽 🤖 👻 🧙‍♂️ 🐉)
  - 💎 Iconic (⚡ 🎯 🔥 🧠 🎮)
- **Personality Customization**: Define agent personas and preferences
- **Tool Integration**: Connect agents to various productivity tools
- **Workflow Templates**: Use pre-built templates for quick setup
- **Integration Marketplace**: Access third-party services through a centralized hub

### 📊 Analytics & Insights
- **Performance Tracking**: Monitor agent efficiency and task completion
- **XP & Leveling**: Structured progression system
- **Team Analytics**: Overview of team performance and growth
- **Memory Logs**: Track agent learning and skill development
- **Error Monitoring**: Real-time system error tracking
- **Agent Health**: Monitor agent performance and diagnostic information

---

## 🏗️ Architecture & Technology Stack

### Frontend Framework
- **Next.js 15** with App Router (latest stable)
- **React 18** with Server Components
- **TypeScript** for full type safety
- **Tailwind CSS** for styling with custom pixel-art theme

### UI Components
- **shadcn/ui** component library (fully customized)
- **Lucide React** for consistent iconography
- **Custom pixel-art styling** with GameBoy-inspired design system

### State Management
- **React Hooks** (useState, useEffect, useCallback)
- **Context API** for global state (when needed)
- **Local storage** for user preferences and settings

### Key Libraries & Tools
- **@radix-ui** primitives for accessible components
- **class-variance-authority** for component variants
- **clsx** for conditional class names
- **tailwind-merge** for class optimization

---

## 📁 Project Structure

\`\`\`
agents-os/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Home page (dashboard entry)
│   └── globals.css              # Global styles and CSS variables
├── components/                   # React components
│   ├── ui/                      # shadcn/ui base components
│   ├── core/                    # Core business components
│   ├── pages/                   # Page-level components
│   ├── modals/                  # Modal components
│   └── shared/                  # Shared utility components
├── lib/                         # Utilities and types
│   ├── types.ts                 # TypeScript type definitions
│   └── utils.ts                 # Utility functions
├── public/                      # Static assets
│   └── agents/                  # Agent avatar images
└── README.md                    # This file
\`\`\`

---

## 🧩 Component Architecture

### Core Components

#### 1. AgentsDashboard (`components/agents-dashboard.tsx`)
- **Purpose**: Main application shell and routing
- **Features**: Page navigation, agent state management, sidebar integration
- **Dependencies**: All page components, sidebar, top bar
- **State**: Current page, selected agent, agent list

#### 2. AppSidebar (`components/app-sidebar.tsx`)
- **Purpose**: Navigation sidebar with shadcn/ui integration
- **Features**: Workspace navigation, monitoring tools, quick actions
- **Dependencies**: shadcn/ui Sidebar components
- **Sections**: Workspace, Workflows, Monitoring, Quick Actions

#### 3. TopBar (`components/top-bar.tsx`)
- **Purpose**: Global header with search and notifications
- **Features**: Search functionality, notification center, user menu
- **Dependencies**: shadcn/ui components

### Page Components

#### 4. DashboardOverview (`components/dashboard-overview.tsx`)
- **Purpose**: Main mission control interface
- **Features**: Agent overview, task summary, performance metrics
- **Key Metrics**: Active agents, pending tasks, completion rates
- **Interactions**: Agent selection, quick task creation

#### 5. AgentPage (`components/agent-page.tsx`)
- **Purpose**: Individual agent management interface
- **Features**: Agent switching, task management, chat integration
- **Tabs**: Tasks, Memory, Tools, Knowledge
- **Actions**: Create tasks, start chat, configure agent

#### 6. WorkflowBuilder (`components/workflow-builder.tsx`)
- **Purpose**: Visual drag-and-drop workflow editor
- **Features**: Node library, canvas editing, connection system
- **Node Types**: Triggers, Actions, Agents, Conditions, Utilities
- **Capabilities**: Save/load workflows, test execution, configuration

#### 7. TemplateMarketplace (`components/template-marketplace.tsx`)
- **Purpose**: Pre-built workflow template store
- **Features**: Template browsing, filtering, installation
- **Categories**: Marketing, Sales, HR, Operations, Customer Service
- **Metrics**: Ratings, downloads, complexity levels

#### 8. ErrorMonitoringDashboard (`components/error-monitoring-dashboard.tsx`)
- **Purpose**: Real-time system error tracking
- **Features**: Error log, trend analysis, alert configuration
- **Monitoring**: Integration errors, agent failures, system health
- **Tools**: Search, filtering, error resolution tracking

#### 9. AgentHealthMonitor (`components/agent-health-monitor.tsx`)
- **Purpose**: Agent performance and diagnostic monitoring
- **Features**: Health scores, performance metrics, issue detection
- **Metrics**: Response time, success rate, memory usage
- **Actions**: Agent restart, memory clearing, configuration

#### 10. IntegrationHub (`components/integration-hub.tsx`)
- **Purpose**: Third-party service connection management
- **Features**: OAuth flows, API key management, connection testing
- **Integrations**: Gmail, Slack, Notion, HubSpot, LinkedIn
- **Status**: Connected, error, syncing, disconnected states

### Specialized Components

#### 11. AgentChatInterface (`components/agent-chat-interface.tsx`)
- **Purpose**: Real-time chat with AI agents
- **Features**: Streaming responses, context awareness, feedback system
- **Capabilities**: Message history, regeneration, copy/paste
- **Context**: Recent tasks, brand guidelines, performance data

#### 12. KnowledgeUpload (`components/knowledge-upload.tsx`)
- **Purpose**: Agent training data management
- **Features**: File upload, URL processing, categorization
- **Formats**: PDF, TXT, DOC, CSV, images
- **Processing**: Drag-and-drop, progress tracking, category management

#### 13. HireAgentModal (`components/hire-agent-modal.tsx`)
- **Purpose**: Two-step agent creation process
- **Features**: Template selection, emoji customization
- **Templates**: Pre-built agent roles with tools and specialties
- **Customization**: Emoji selection from curated categories

#### 14. NewTaskModal (`components/new-task-modal.tsx`)
- **Purpose**: Smart task creation with XP calculation
- **Features**: Priority-based XP rewards, agent matching
- **Categories**: Content, Analysis, Communication, Research
- **Intelligence**: Automatic XP calculation, agent recommendations

---

## 🎨 Design System

### Color Palette
\`\`\`css
/* Primary Colors */
--primary: 142 69 173;           /* GameBoy Green */
--primary-foreground: 355 7 97;

/* Background Colors */
--background: 0 0 100;           /* Clean White */
--foreground: 222.2 84 4.9;

/* Accent Colors */
--muted: 210 40 98;
--muted-foreground: 215.4 16.3 46.9;
--accent: 210 40 98;
--accent-foreground: 222.2 84 4.9;

/* Border & Ring */
--border: 214.3 31.8 91.4;
--ring: 222.2 84 4.9;
\`\`\`

### Typography
- **Headers**: Press Start 2P (pixel font) - `font-pixel`
- **Body Text**: Inter (clean, readable) - `font-clean`
- **UI Elements**: Mix of both for visual hierarchy

### Custom Classes
- `.border-pixel` - Pixel-perfect borders
- `.font-pixel` - Retro pixel font
- `.font-clean` - Modern clean font

---

## 🔧 Backend Integration Guide

### Recommended Backend Architecture

#### API Routes Structure
\`\`\`typescript
// app/api/agents/route.ts
export async function GET() {
  // Fetch agents from database
}

export async function POST(request: Request) {
  // Create new agent
}

// app/api/agents/[id]/route.ts
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // Update agent
}

// app/api/tasks/route.ts
export async function POST(request: Request) {
  // Create new task
}

// app/api/workflows/route.ts
export async function GET() {
  // Fetch workflows
}

export async function POST(request: Request) {
  // Save workflow
}
\`\`\`

#### Database Schema (Recommended: PostgreSQL + Prisma)
\`\`\`prisma
// prisma/schema.prisma
model Agent {
  id                    String   @id @default(cuid())
  name                  String
  role                  String
  avatar                String
  persona               String
  tools                 String[]
  level                 Int      @default(1)
  status                AgentStatus @default(ACTIVE)
  lastActive            DateTime @updatedAt
  joinedDate            DateTime @default(now())
  totalTasksCompleted   Int      @default(0)
  favoriteTools         String[]
  tasks                 Task[]
  memory                AgentMemory?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model Task {
  id          String     @id @default(cuid())
  title       String
  details     String
  priority    Priority
  status      TaskStatus @default(PENDING)
  xpReward    Int?
  agentId     String
  agent       Agent      @relation(fields: [agentId], references: [id])
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Workflow {
  id          String   @id @default(cuid())
  name        String
  description String
  nodes       Json
  status      WorkflowStatus @default(DRAFT)
  runCount    Int      @default(0)
  successRate Float    @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum AgentStatus {
  ACTIVE
  IDLE
  OFFLINE
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  WAITING
  COMPLETED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum WorkflowStatus {
  DRAFT
  ACTIVE
  PAUSED
}
\`\`\`

#### Environment Variables
\`\`\`env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/agents_os"

# AI Integration
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Third-party Integrations
GMAIL_CLIENT_ID="..."
GMAIL_CLIENT_SECRET="..."
SLACK_CLIENT_ID="..."
SLACK_CLIENT_SECRET="..."
NOTION_CLIENT_ID="..."
NOTION_CLIENT_SECRET="..."

# Authentication (if using NextAuth)
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Monitoring
SENTRY_DSN="https://..."
\`\`\`

#### AI Integration (Recommended: Vercel AI SDK)
\`\`\`typescript
// lib/ai.ts
import { openai } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'

export async function generateAgentResponse(
  agentId: string,
  message: string,
  context: string[]
) {
  const agent = await getAgent(agentId)
  
  const { text } = await generateText({
    model: openai('gpt-4'),
    system: `You are ${agent.name}, a ${agent.role}. ${agent.persona}`,
    prompt: message,
    // Add context from agent memory and recent tasks
  })
  
  return text
}

export async function streamAgentResponse(
  agentId: string,
  message: string,
  context: string[]
) {
  const agent = await getAgent(agentId)
  
  return streamText({
    model: openai('gpt-4'),
    system: `You are ${agent.name}, a ${agent.role}. ${agent.persona}`,
    prompt: message,
  })
}
\`\`\`

#### Real-time Features (Recommended: WebSockets or Server-Sent Events)
\`\`\`typescript
// app/api/chat/[agentId]/route.ts
export async function POST(request: Request) {
  const { message } = await request.json()
  
  const stream = await streamAgentResponse(agentId, message, context)
  
  return stream.toDataStreamResponse()
}

// For real-time updates
// app/api/agents/[id]/status/route.ts
export async function GET(request: Request) {
  // Server-sent events for agent status updates
  const stream = new ReadableStream({
    start(controller) {
      // Send periodic agent status updates
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
\`\`\`

---

## 🚀 Deployment Recommendations

### Recommended Stack for Production

#### Frontend Hosting
- **Vercel** (recommended) - Seamless Next.js deployment
- **Netlify** - Alternative with good Next.js support
- **AWS Amplify** - Enterprise option with AWS integration

#### Database
- **Neon** (recommended) - Serverless PostgreSQL
- **Supabase** - PostgreSQL with real-time features
- **PlanetScale** - Serverless MySQL alternative

#### AI Services
- **OpenAI API** - GPT-4 for agent responses
- **Anthropic Claude** - Alternative AI provider
- **Vercel AI SDK** - Unified AI interface

#### Monitoring & Analytics
- **Sentry** - Error tracking and performance monitoring
- **Vercel Analytics** - Web vitals and performance
- **PostHog** - Product analytics and feature flags

#### Authentication
- **NextAuth.js** - Flexible authentication
- **Clerk** - Complete user management
- **Auth0** - Enterprise authentication

### Environment Setup
\`\`\`bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Set up database (if using Prisma)
npx prisma generate
npx prisma db push

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
\`\`\`

---

## 🛠️ Development Guidelines

### Code Organization
- **Components**: One component per file, co-located with styles
- **Types**: Centralized in `lib/types.ts`
- **Utilities**: Shared functions in `lib/utils.ts`
- **API Routes**: RESTful structure in `app/api/`

### Styling Conventions
- **Tailwind classes**: Use utility-first approach
- **Custom components**: Extend shadcn/ui components
- **Responsive design**: Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- **Dark mode**: Ready for implementation with CSS variables

### State Management
- **Local state**: useState for component-specific state
- **Shared state**: Context API for cross-component state
- **Server state**: React Query/SWR for API data
- **Form state**: React Hook Form for complex forms

### Performance Optimization
- **Code splitting**: Automatic with Next.js App Router
- **Image optimization**: Next.js Image component
- **Bundle analysis**: `npm run analyze` (add webpack-bundle-analyzer)
- **Lazy loading**: React.lazy for heavy components

---

## 🔧 Component Integration Guide

### Adding New Agent Types
\`\`\`typescript
// Update lib/types.ts
interface Agent {
  // Add new properties
  specialization?: string[]
  certifications?: string[]
}

// Update components/hire-agent-modal.tsx
const availableAgents = [
  {
    id: "new-role",
    name: "New Role",
    role: "Specialist",
    tools: ["Tool1", "Tool2"],
    specialties: ["Specialty1", "Specialty2"],
    defaultEmoji: "🎯"
  }
]
\`\`\`

### Adding New Integrations
\`\`\`typescript
// Update components/integration-hub.tsx
const availableIntegrations = [
  {
    id: "new-service",
    name: "New Service",
    icon: "🔧",
    category: "productivity",
    hasOAuth: true,
    description: "Integration description",
    permissions: ["Read data", "Write data"]
  }
]
\`\`\`

### Adding New Workflow Nodes
\`\`\`typescript
// Update components/workflow-builder.tsx
const nodeTypes = {
  triggers: [
    {
      type: "trigger",
      title: "New Trigger",
      description: "Trigger description",
      icon: <Icon className="w-4 h-4" />,
      category: "category"
    }
  ]
}
\`\`\`

---

## 📊 Analytics & Monitoring Integration

### Error Tracking Setup
\`\`\`typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs'

export function trackError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context })
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  // Analytics tracking
}
\`\`\`

### Performance Monitoring
\`\`\`typescript
// lib/performance.ts
export function measurePerformance(name: string, fn: () => Promise<any>) {
  const start = performance.now()
  return fn().finally(() => {
    const duration = performance.now() - start
    console.log(`${name} took ${duration}ms`)
  })
}
\`\`\`

---

## 🔮 Future Enhancement Roadmap

### Phase 4: Enterprise Features
- **Multi-tenant architecture** with workspace isolation
- **Advanced permissions** and role-based access control
- **Audit logging** for compliance and security
- **API rate limiting** and usage analytics

### Phase 5: AI Enhancements
- **Custom model training** with agent-specific data
- **Multi-modal capabilities** (voice, image, video)
- **Advanced reasoning** with chain-of-thought prompting
- **Agent collaboration** with multi-agent workflows

### Phase 6: Platform Expansion
- **Mobile applications** (React Native)
- **Desktop applications** (Electron)
- **Browser extensions** for seamless integration
- **API marketplace** for third-party developers

---

## 🤝 Contributing Guidelines

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for quality

### Testing Strategy
- **Unit tests**: Jest + React Testing Library
- **Integration tests**: Playwright for E2E
- **Component tests**: Storybook for UI components
- **API tests**: Supertest for backend endpoints

---

## 📝 License & Support

### License
MIT License - feel free to use this project as a foundation for your own AI agent management system.

### Support
- **Documentation**: Comprehensive guides in `/docs`
- **Community**: Discord server for discussions
- **Issues**: GitHub Issues for bug reports
- **Enterprise**: Contact for custom implementations

---

## 🎮 Final Notes

AGENTS OS represents a complete paradigm shift in how businesses interact with AI. By gamifying agent management and providing enterprise-grade tools, it makes AI accessible to teams of all sizes while maintaining the sophistication needed for complex business operations.

The system is designed to grow with your organization - start with simple agent tasks and evolve into complex multi-agent workflows that can handle your most critical business processes.

**Built with ❤️ and lots of pixels by the AGENTS OS team**

---

*Ready to transform your business operations? Deploy AGENTS OS and start building your AI-powered team today!* 🚀
