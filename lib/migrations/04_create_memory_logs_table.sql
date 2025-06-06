-- Create memory_logs table
CREATE TABLE IF NOT EXISTS memory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- e.g., 'learning', 'preference', 'goal'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE memory_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own memory logs" ON memory_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = memory_logs.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own memory logs" ON memory_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = memory_logs.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own memory logs" ON memory_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = memory_logs.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_memory_logs_agent_id ON memory_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_memory_logs_created_at ON memory_logs(created_at);
