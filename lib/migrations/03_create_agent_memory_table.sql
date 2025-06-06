-- Create agent_memory table
CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  weekly_goals TEXT DEFAULT '',
  preferences JSONB DEFAULT '[]',
  recent_learnings JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own agent memory" ON agent_memory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_memory.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own agent memory" ON agent_memory
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_memory.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own agent memory" ON agent_memory
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_memory.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own agent memory" ON agent_memory
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_memory.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_id ON agent_memory(agent_id);
