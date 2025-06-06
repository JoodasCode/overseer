-- Overseer Core Schema - Phase 1
-- This schema defines the core tables needed for the Overseer platform

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  avatar VARCHAR(10) NOT NULL, -- emoji
  persona TEXT NOT NULL,
  tools TEXT[] DEFAULT '{}',
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active', -- active, idle, offline
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  total_tasks_completed INTEGER DEFAULT 0,
  favorite_tools TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for agents
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

-- Agent Memory table
CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  weekly_goals TEXT,
  recent_learnings TEXT[] DEFAULT '{}',
  preferences TEXT[] DEFAULT '{}',
  skills_unlocked TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for agent memory
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_id ON agent_memory(agent_id);

-- Memory Logs table
CREATE TABLE IF NOT EXISTS memory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- learning, skill, interaction, achievement
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for memory logs
CREATE INDEX IF NOT EXISTS idx_memory_logs_agent_id ON memory_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_memory_logs_type ON memory_logs(type);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  details TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, in-progress, waiting, completed
  priority VARCHAR(10) NOT NULL, -- low, medium, high
  xp_reward INTEGER,
  agent_id UUID REFERENCES agents(id),
  user_id UUID REFERENCES auth.users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL, -- workflow configuration
  status VARCHAR(20) DEFAULT 'draft', -- draft, active, paused
  run_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  last_run TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for workflows
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);

-- Workflow Executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id),
  status VARCHAR(20) NOT NULL, -- running, completed, failed
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  execution_time INTEGER, -- milliseconds
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for workflow executions
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id),
  user_id UUID REFERENCES auth.users(id),
  role VARCHAR(20) NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- context, tokens used, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for chat messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_agent_id ON chat_messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update the updated_at column
CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON agents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_memory_updated_at
BEFORE UPDATE ON agent_memory
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at
BEFORE UPDATE ON workflows
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies
-- Ensure users can only access their own data

-- Agents RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY agents_select_policy ON agents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY agents_insert_policy ON agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY agents_update_policy ON agents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY agents_delete_policy ON agents
  FOR DELETE USING (auth.uid() = user_id);

-- Tasks RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_select_policy ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY tasks_insert_policy ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY tasks_update_policy ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY tasks_delete_policy ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Workflows RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflows_select_policy ON workflows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY workflows_insert_policy ON workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY workflows_update_policy ON workflows
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY workflows_delete_policy ON workflows
  FOR DELETE USING (auth.uid() = user_id);

-- Chat Messages RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_messages_select_policy ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY chat_messages_insert_policy ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY chat_messages_update_policy ON chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY chat_messages_delete_policy ON chat_messages
  FOR DELETE USING (auth.uid() = user_id);
