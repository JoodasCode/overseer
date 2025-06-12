-- Emergency Security Fix Migration
-- Addresses critical data leakage vulnerability where users could see other users' chat history

-- Ensure portal_agent_logs table exists and has proper RLS
CREATE TABLE IF NOT EXISTS public.portal_agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on portal_agent_logs (CRITICAL SECURITY FIX)
ALTER TABLE public.portal_agent_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for portal_agent_logs
DROP POLICY IF EXISTS "Users can only view their own chat logs" ON public.portal_agent_logs;
CREATE POLICY "Users can only view their own chat logs" ON public.portal_agent_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only insert their own chat logs" ON public.portal_agent_logs;
CREATE POLICY "Users can only insert their own chat logs" ON public.portal_agent_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only update their own chat logs" ON public.portal_agent_logs;
CREATE POLICY "Users can only update their own chat logs" ON public.portal_agent_logs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only delete their own chat logs" ON public.portal_agent_logs;
CREATE POLICY "Users can only delete their own chat logs" ON public.portal_agent_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure portal_agent_memory table has proper RLS
CREATE TABLE IF NOT EXISTS public.portal_agent_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'general',
  content text NOT NULL,
  category text,
  importance_score integer DEFAULT 1,
  weekly_goals text,
  preferences jsonb DEFAULT '[]',
  recent_learnings jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on portal_agent_memory (CRITICAL SECURITY FIX)
ALTER TABLE public.portal_agent_memory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for portal_agent_memory
DROP POLICY IF EXISTS "Users can only view their own agent memory" ON public.portal_agent_memory;
CREATE POLICY "Users can only view their own agent memory" ON public.portal_agent_memory
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only insert their own agent memory" ON public.portal_agent_memory;
CREATE POLICY "Users can only insert their own agent memory" ON public.portal_agent_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only update their own agent memory" ON public.portal_agent_memory;
CREATE POLICY "Users can only update their own agent memory" ON public.portal_agent_memory
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only delete their own agent memory" ON public.portal_agent_memory;
CREATE POLICY "Users can only delete their own agent memory" ON public.portal_agent_memory
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure portal_agents table has proper RLS
ALTER TABLE public.portal_agents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for portal_agents
DROP POLICY IF EXISTS "Users can only view their own agents" ON public.portal_agents;
CREATE POLICY "Users can only view their own agents" ON public.portal_agents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only insert their own agents" ON public.portal_agents;
CREATE POLICY "Users can only insert their own agents" ON public.portal_agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only update their own agents" ON public.portal_agents;
CREATE POLICY "Users can only update their own agents" ON public.portal_agents
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only delete their own agents" ON public.portal_agents;
CREATE POLICY "Users can only delete their own agents" ON public.portal_agents
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_portal_agent_logs_user_id ON public.portal_agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_agent_logs_agent_id ON public.portal_agent_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_portal_agent_logs_created_at ON public.portal_agent_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_portal_agent_memory_user_id ON public.portal_agent_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_agent_memory_agent_id ON public.portal_agent_memory(agent_id);

-- Verify RLS is enabled (informational)
DO $$
BEGIN
  RAISE NOTICE 'RLS Status Check:';
  RAISE NOTICE 'portal_agent_logs RLS enabled: %', (SELECT row_security FROM pg_tables WHERE tablename = 'portal_agent_logs');
  RAISE NOTICE 'portal_agent_memory RLS enabled: %', (SELECT row_security FROM pg_tables WHERE tablename = 'portal_agent_memory');
  RAISE NOTICE 'portal_agents RLS enabled: %', (SELECT row_security FROM pg_tables WHERE tablename = 'portal_agents');
END $$; 