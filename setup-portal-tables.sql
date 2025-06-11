-- Portal Database Setup - Essential Tables
-- Run this in your Supabase SQL Editor to fix the dashboard

-- 1. Portal Activity Log Table (CRITICAL - causing the dashboard error)
CREATE TABLE IF NOT EXISTS portal_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type TEXT NOT NULL, -- user, agent, system
  actor_id UUID,
  action TEXT NOT NULL,
  description TEXT,
  meta JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES portal_agents(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Portal Agents Table (if not exists)
CREATE TABLE IF NOT EXISTS portal_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  role TEXT,
  persona TEXT,
  avatar_url TEXT,
  tools JSONB DEFAULT '[]',
  personality_profile JSONB DEFAULT '{}',
  memory_map JSONB DEFAULT '{}',
  task_feed JSONB DEFAULT '{}',
  level_xp INTEGER DEFAULT 0,
  efficiency_score DECIMAL(5,2) DEFAULT 100.00,
  is_active BOOLEAN DEFAULT true,
  department_type TEXT,
  status TEXT DEFAULT 'idle',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Portal Departments Table
CREATE TABLE IF NOT EXISTS portal_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  color TEXT,
  description TEXT,
  agent_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Portal Notifications Table
CREATE TABLE IF NOT EXISTS portal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES portal_agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- task, report, warning, insight, system
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'unread', -- unread, read, archived
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  action_url TEXT,
  meta JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Agent Modes Table
CREATE TABLE IF NOT EXISTS agent_modes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES portal_agents(id) ON DELETE CASCADE,
    mode_name VARCHAR(50) NOT NULL,
    description TEXT,
    tone_override VARCHAR(100),
    response_length VARCHAR(20) DEFAULT 'medium',
    temperature_override DECIMAL(3,2),
    max_tokens_override INTEGER,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_portal_activity_log_user_id ON portal_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_activity_log_created_at ON portal_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_portal_agents_user_id ON portal_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_agents_status ON portal_agents(status);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_user_id ON portal_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_modes_agent_id ON agent_modes(agent_id);

-- Enable Row Level Security
ALTER TABLE portal_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_modes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portal_activity_log
CREATE POLICY "Users can view own activity" ON portal_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity" ON portal_activity_log
  FOR INSERT WITH CHECK (true);

-- RLS Policies for portal_agents
CREATE POLICY "Users can manage own agents" ON portal_agents
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for portal_departments (public read)
CREATE POLICY "Anyone can view departments" ON portal_departments
  FOR SELECT USING (true);

-- RLS Policies for portal_notifications
CREATE POLICY "Users can view own notifications" ON portal_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON portal_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for agent_modes
CREATE POLICY "Users can manage agent modes" ON agent_modes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM portal_agents 
      WHERE portal_agents.id = agent_modes.agent_id 
      AND portal_agents.user_id = auth.uid()
    )
  );

-- Insert Default Departments
INSERT INTO portal_departments (name, slug, icon, color, description) VALUES
('HR', 'hr', '👥', '#10B981', 'Human resources and people management'),
('Operations', 'operations', '⚙️', '#F59E0B', 'Business operations and process management'),
('Product', 'product', '🚀', '#8B5CF6', 'Product development and management'),
('Finance', 'finance', '💰', '#EF4444', 'Financial planning and analysis'),
('Analytics', 'analytics', '📊', '#06B6D4', 'Data analysis and business intelligence')
ON CONFLICT (slug) DO NOTHING;

-- Helper Function to Log Portal Activities
CREATE OR REPLACE FUNCTION log_portal_activity(
  p_actor_type TEXT,
  p_actor_id UUID,
  p_action TEXT,
  p_description TEXT DEFAULT NULL,
  p_meta JSONB DEFAULT '{}',
  p_user_id UUID DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO portal_activity_log (
    actor_type, actor_id, action, description, meta, user_id, agent_id
  ) VALUES (
    p_actor_type, p_actor_id, p_action, p_description, p_meta, p_user_id, p_agent_id
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to Create Portal Notifications
CREATE OR REPLACE FUNCTION create_portal_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal',
  p_action_url TEXT DEFAULT NULL,
  p_meta JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO portal_notifications (
    user_id, agent_id, type, title, description, priority, action_url, meta
  ) VALUES (
    p_user_id, p_agent_id, p_type, p_title, p_description, p_priority, p_action_url, p_meta
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample activities to test the dashboard
INSERT INTO portal_activity_log (actor_type, action, description, user_id, created_at) VALUES
('system', 'database_setup', 'Portal database tables created successfully', (SELECT auth.uid()), NOW() - INTERVAL '2 hours'),
('system', 'migration_complete', 'Database migration to portal architecture completed', (SELECT auth.uid()), NOW() - INTERVAL '1 hour'),
('user', 'dashboard_access', 'User accessed the portal dashboard', (SELECT auth.uid()), NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Portal database setup complete! 🎉' as status; 