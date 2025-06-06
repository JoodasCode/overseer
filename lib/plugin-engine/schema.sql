-- Plugin Engine Database Schema for Supabase

-- User Integrations table
-- Stores OAuth tokens and connection status for each integration
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  scopes TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, tool_name)
);

-- Create index on user_id and tool_name
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_tool ON user_integrations (user_id, tool_name);

-- Scheduled Tasks table
-- Stores tasks scheduled for future execution
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  tool TEXT NOT NULL,
  intent TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  result JSONB DEFAULT NULL,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for scheduled tasks
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_user ON scheduled_tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_agent ON scheduled_tasks (agent_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks (status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_scheduled_time ON scheduled_tasks (scheduled_time);

-- Error Logs table
-- Stores errors that occur during task execution
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID,
  tool TEXT NOT NULL,
  action TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for error logs
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_agent ON error_logs (agent_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_tool ON error_logs (tool);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs (resolved);

-- Context Mappings table
-- Stores mappings between agent context and external IDs
CREATE TABLE IF NOT EXISTS context_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  tool TEXT NOT NULL,
  context_key TEXT NOT NULL,
  external_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, agent_id, tool, context_key)
);

-- Create indexes for context mappings
CREATE INDEX IF NOT EXISTS idx_context_mappings_user ON context_mappings (user_id);
CREATE INDEX IF NOT EXISTS idx_context_mappings_agent ON context_mappings (agent_id);
CREATE INDEX IF NOT EXISTS idx_context_mappings_tool ON context_mappings (tool);
CREATE INDEX IF NOT EXISTS idx_context_mappings_context_key ON context_mappings (context_key);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update the updated_at column
CREATE TRIGGER update_user_integrations_updated_at
BEFORE UPDATE ON user_integrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_tasks_updated_at
BEFORE UPDATE ON scheduled_tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_context_mappings_updated_at
BEFORE UPDATE ON context_mappings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies
-- Ensure users can only access their own data

-- User Integrations RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_integrations_select_policy ON user_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_integrations_insert_policy ON user_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_integrations_update_policy ON user_integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_integrations_delete_policy ON user_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Scheduled Tasks RLS
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY scheduled_tasks_select_policy ON scheduled_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY scheduled_tasks_insert_policy ON scheduled_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY scheduled_tasks_update_policy ON scheduled_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY scheduled_tasks_delete_policy ON scheduled_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Error Logs RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY error_logs_select_policy ON error_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY error_logs_insert_policy ON error_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY error_logs_update_policy ON error_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY error_logs_delete_policy ON error_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Context Mappings RLS
ALTER TABLE context_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY context_mappings_select_policy ON context_mappings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY context_mappings_insert_policy ON context_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY context_mappings_update_policy ON context_mappings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY context_mappings_delete_policy ON context_mappings
  FOR DELETE USING (auth.uid() = user_id);
