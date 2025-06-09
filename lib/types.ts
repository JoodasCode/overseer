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
  user_id: string
  name: string
  description: string
  avatar_url: string
  tools: string[]
  stats: Record<string, any>
  preferences: Record<string, any>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  system_prompt: string
  personality: string
  llm_provider?: string
  llm_model?: string
  llm_api_key_id?: string
  llm_config?: Record<string, any>
  
  // Computed/compatibility properties
  role?: string
  avatar?: string
  persona?: string
  level?: number
  status?: "active" | "idle" | "offline" | "collaborating"
  lastActive?: string
  tasks?: Task[]
  memory?: AgentMemory
  joinedDate?: string
  totalTasksCompleted?: number
  favoriteTools?: string[]
  department?: string
  collaborating?: boolean
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

export interface AgentMode {
  id: string;
  agent_id: string;
  mode_name: string;
  tone_override?: string;
  tool_preferences?: Record<string, any>;
  response_length?: 'brief' | 'normal' | 'detailed';
  priority_threshold?: number;
  is_active: boolean;
  activated_at?: string;
  activated_by?: string;
  created_at: string;
}

export interface SharedAgentMemory {
  id: string;
  from_agent_id: string;
  to_agent_id: string;
  memory_type: string;
  content: string;
  context?: string;
  shared_at: string;
  context_expires_at?: string;
  from_agent?: {
    name: string;
    avatar: string;
  };
}
