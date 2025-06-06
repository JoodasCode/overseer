-- Prisma Schema SQL Migration for Overseer Backend
-- Generated from prisma/schema.prisma

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User model extended from Supabase auth.users
CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" TEXT NOT NULL UNIQUE,
  "display_name" TEXT,
  "avatar_url" TEXT,
  "preferences" JSONB DEFAULT '{}',
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Agent model
CREATE TABLE IF NOT EXISTS "Agent" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "avatar_url" TEXT,
  "tools" JSONB DEFAULT '{}',
  "stats" JSONB DEFAULT '{}',
  "preferences" JSONB DEFAULT '{}',
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes for Agent
CREATE INDEX IF NOT EXISTS "Agent_user_id_idx" ON "Agent"("user_id");
CREATE INDEX IF NOT EXISTS "Agent_name_idx" ON "Agent"("name");

-- Agent Memory model
CREATE TABLE IF NOT EXISTS "AgentMemory" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "agent_id" UUID NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'string',
  "embedding" FLOAT[] NOT NULL,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("agent_id") REFERENCES "Agent"("id") ON DELETE CASCADE,
  UNIQUE("agent_id", "key")
);

-- Create indexes for AgentMemory
CREATE INDEX IF NOT EXISTS "AgentMemory_agent_id_idx" ON "AgentMemory"("agent_id");
CREATE INDEX IF NOT EXISTS "AgentMemory_key_idx" ON "AgentMemory"("key");

-- Memory Logs model
CREATE TABLE IF NOT EXISTS "MemoryLog" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "agent_id" UUID NOT NULL,
  "operation" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "old_value" TEXT,
  "new_value" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("agent_id") REFERENCES "Agent"("id") ON DELETE CASCADE
);

-- Create indexes for MemoryLog
CREATE INDEX IF NOT EXISTS "MemoryLog_agent_id_idx" ON "MemoryLog"("agent_id");
CREATE INDEX IF NOT EXISTS "MemoryLog_key_idx" ON "MemoryLog"("key");
CREATE INDEX IF NOT EXISTS "MemoryLog_created_at_idx" ON "MemoryLog"("created_at");

-- Task Status enum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- Task Priority enum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Tasks model
CREATE TABLE IF NOT EXISTS "Task" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "agent_id" UUID,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "due_date" TIMESTAMPTZ(6),
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ(6),
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("agent_id") REFERENCES "Agent"("id") ON DELETE SET NULL
);

-- Create indexes for Task
CREATE INDEX IF NOT EXISTS "Task_user_id_idx" ON "Task"("user_id");
CREATE INDEX IF NOT EXISTS "Task_agent_id_idx" ON "Task"("agent_id");
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task"("status");
CREATE INDEX IF NOT EXISTS "Task_priority_idx" ON "Task"("priority");
CREATE INDEX IF NOT EXISTS "Task_due_date_idx" ON "Task"("due_date");

-- Chat Messages model
CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "embedding" FLOAT[] NOT NULL,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("agent_id") REFERENCES "Agent"("id") ON DELETE CASCADE
);

-- Create indexes for ChatMessage
CREATE INDEX IF NOT EXISTS "ChatMessage_user_id_idx" ON "ChatMessage"("user_id");
CREATE INDEX IF NOT EXISTS "ChatMessage_agent_id_idx" ON "ChatMessage"("agent_id");
CREATE INDEX IF NOT EXISTS "ChatMessage_created_at_idx" ON "ChatMessage"("created_at");

-- Workflow Status enum
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- Workflows model
CREATE TABLE IF NOT EXISTS "Workflow" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
  "triggers" JSONB DEFAULT '{}',
  "actions" JSONB DEFAULT '{}',
  "config" JSONB DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes for Workflow
CREATE INDEX IF NOT EXISTS "Workflow_user_id_idx" ON "Workflow"("user_id");
CREATE INDEX IF NOT EXISTS "Workflow_status_idx" ON "Workflow"("status");

-- Workflow Execution Status enum
CREATE TYPE "WorkflowExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- Workflow Executions model
CREATE TABLE IF NOT EXISTS "WorkflowExecution" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "workflow_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "status" "WorkflowExecutionStatus" NOT NULL DEFAULT 'PENDING',
  "trigger_data" JSONB DEFAULT '{}',
  "result" JSONB DEFAULT '{}',
  "error" TEXT,
  "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ(6),
  FOREIGN KEY ("workflow_id") REFERENCES "Workflow"("id") ON DELETE CASCADE,
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes for WorkflowExecution
CREATE INDEX IF NOT EXISTS "WorkflowExecution_workflow_id_idx" ON "WorkflowExecution"("workflow_id");
CREATE INDEX IF NOT EXISTS "WorkflowExecution_user_id_idx" ON "WorkflowExecution"("user_id");
CREATE INDEX IF NOT EXISTS "WorkflowExecution_status_idx" ON "WorkflowExecution"("status");
CREATE INDEX IF NOT EXISTS "WorkflowExecution_started_at_idx" ON "WorkflowExecution"("started_at");

-- Error Logs model
CREATE TABLE IF NOT EXISTS "ErrorLog" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "agent_id" UUID,
  "error_type" TEXT NOT NULL,
  "error_message" TEXT NOT NULL,
  "stack_trace" TEXT,
  "context" JSONB DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("agent_id") REFERENCES "Agent"("id") ON DELETE SET NULL
);

-- Create indexes for ErrorLog
CREATE INDEX IF NOT EXISTS "ErrorLog_user_id_idx" ON "ErrorLog"("user_id");
CREATE INDEX IF NOT EXISTS "ErrorLog_agent_id_idx" ON "ErrorLog"("agent_id");
CREATE INDEX IF NOT EXISTS "ErrorLog_error_type_idx" ON "ErrorLog"("error_type");
CREATE INDEX IF NOT EXISTS "ErrorLog_created_at_idx" ON "ErrorLog"("created_at");

-- Integrations model
CREATE TABLE IF NOT EXISTS "Integration" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "service_name" TEXT NOT NULL,
  "service_id" TEXT,
  "access_token" TEXT,
  "refresh_token" TEXT,
  "token_expires_at" TIMESTAMPTZ(6),
  "config" JSONB DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes for Integration
CREATE INDEX IF NOT EXISTS "Integration_user_id_idx" ON "Integration"("user_id");
CREATE INDEX IF NOT EXISTS "Integration_service_name_idx" ON "Integration"("service_name");
CREATE INDEX IF NOT EXISTS "Integration_status_idx" ON "Integration"("status");

-- Knowledge Base model
CREATE TABLE IF NOT EXISTS "KnowledgeBase" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "content_type" TEXT NOT NULL,
  "embedding" FLOAT[] NOT NULL,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes for KnowledgeBase
CREATE INDEX IF NOT EXISTS "KnowledgeBase_user_id_idx" ON "KnowledgeBase"("user_id");
CREATE INDEX IF NOT EXISTS "KnowledgeBase_content_type_idx" ON "KnowledgeBase"("content_type");

-- Enable Row Level Security
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Agent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentMemory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MemoryLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workflow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkflowExecution" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ErrorLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Integration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeBase" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (example for Agent table)
CREATE POLICY "Users can view their own agents" ON "Agent"
  FOR SELECT USING (auth.uid() = "user_id");
  
CREATE POLICY "Users can create their own agents" ON "Agent"
  FOR INSERT WITH CHECK (auth.uid() = "user_id");
  
CREATE POLICY "Users can update their own agents" ON "Agent"
  FOR UPDATE USING (auth.uid() = "user_id");
  
CREATE POLICY "Users can delete their own agents" ON "Agent"
  FOR DELETE USING (auth.uid() = "user_id");

-- Note: You'll need to create similar RLS policies for all tables
-- based on your application's security requirements
