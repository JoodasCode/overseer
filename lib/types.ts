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
