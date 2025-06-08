export interface Task {
  id: string
  title: string
  status: "pending" | "in-progress" | "waiting" | "completed"
  details: string
  priority: "low" | "medium" | "high"
  xpReward?: number
}

export interface AgentMemory {
  weeklyGoals: string
  recentLearnings: string[]
  preferences: string[]
  skillsUnlocked: string[]
  memoryLogs: MemoryLog[]
}

export interface MemoryLog {
  id: string
  timestamp: string
  type: "learning" | "skill" | "interaction" | "achievement"
  content: string
}

export interface Agent {
  id: string
  name: string
  role: string
  avatar: string
  persona: string
  tools: string[]
  level: number
  status: "active" | "idle" | "offline"
  lastActive: string
  tasks: Task[]
  memory: AgentMemory
  joinedDate: string
  totalTasksCompleted: number
  favoriteTools: string[]
}

export interface LLMProvider {
  id: string
  name: string
  model: string
  status: "active" | "inactive"
  costPer1k: number
}

export interface Workflow {
  id: string
  name: string
  description?: string
  steps: WorkflowStep[]
  status: "active" | "inactive" | "draft"
  createdAt: string
  updatedAt: string
  userId: string
}

export interface WorkflowStep {
  id: string
  type: string
  config: any
  order: number
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: "pending" | "running" | "completed" | "failed"
  input?: any
  output?: any
  error?: string
  startedAt: string
  completedAt?: string
  userId: string
}

export interface ChatMessage {
  id: string
  agentId: string
  content: string
  role: "user" | "assistant"
  timestamp: string
  metadata?: any
}

export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  type: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
  userId: string
}

export interface KnowledgeBaseItem {
  id: string
  knowledgeBaseId: string
  title: string
  content: string
  type: string
  metadata?: any
  createdAt: string
  updatedAt: string
}
