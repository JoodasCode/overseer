-- Portal Shift Phase 2: Database Rewiring
-- This migration transforms the existing schema into a portal-first architecture

-- First, ensure we have proper RLS and permissions
-- Grant necessary permissions for table operations
-- GRANT ALL ON SCHEMA public TO postgres;

-- ============================================================================
-- STEP 1: RENAME EXISTING TABLES TO PORTAL_ PREFIX
-- ============================================================================

-- Rename core tables to portal_ prefix
ALTER TABLE IF EXISTS agents RENAME TO portal_agents;
ALTER TABLE IF EXISTS agent_memory RENAME TO portal_agent_memory;
ALTER TABLE IF EXISTS memory_logs RENAME TO portal_memory_logs;
ALTER TABLE IF EXISTS tasks RENAME TO portal_agent_tasks;
ALTER TABLE IF EXISTS chat_messages RENAME TO portal_agent_logs;

-- Update index names to match new table names
ALTER INDEX IF EXISTS idx_agents_user_id RENAME TO idx_portal_agents_user_id;
ALTER INDEX IF EXISTS idx_agents_status RENAME TO idx_portal_agents_status;
ALTER INDEX IF EXISTS idx_agent_memory_agent_id RENAME TO idx_portal_agent_memory_agent_id;
ALTER INDEX IF EXISTS idx_memory_logs_agent_id RENAME TO idx_portal_memory_logs_agent_id;
ALTER INDEX IF EXISTS idx_memory_logs_type RENAME TO idx_portal_memory_logs_type;
ALTER INDEX IF EXISTS idx_tasks_agent_id RENAME TO idx_portal_agent_tasks_agent_id;
ALTER INDEX IF EXISTS idx_tasks_user_id RENAME TO idx_portal_agent_tasks_user_id;
ALTER INDEX IF EXISTS idx_tasks_status RENAME TO idx_portal_agent_tasks_status;
ALTER INDEX IF EXISTS idx_tasks_priority RENAME TO idx_portal_agent_tasks_priority;
ALTER INDEX IF EXISTS idx_chat_messages_agent_id RENAME TO idx_portal_agent_logs_agent_id;
ALTER INDEX IF EXISTS idx_chat_messages_user_id RENAME TO idx_portal_agent_logs_user_id;
ALTER INDEX IF EXISTS idx_chat_messages_created_at RENAME TO idx_portal_agent_logs_created_at;

-- Update trigger names
DROP TRIGGER IF EXISTS update_agents_updated_at ON portal_agents;
DROP TRIGGER IF EXISTS update_agent_memory_updated_at ON portal_agent_memory;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON portal_agent_tasks;

CREATE TRIGGER update_portal_agents_updated_at
BEFORE UPDATE ON portal_agents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_agent_memory_updated_at
BEFORE UPDATE ON portal_agent_memory
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_agent_tasks_updated_at
BEFORE UPDATE ON portal_agent_tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 2: ADD NEW FIELDS TO EXISTING PORTAL TABLES
-- ============================================================================

-- Add portal-specific fields to portal_agents
ALTER TABLE portal_agents ADD COLUMN IF NOT EXISTS personality_profile JSONB DEFAULT '{}';
ALTER TABLE portal_agents ADD COLUMN IF NOT EXISTS memory_map JSONB DEFAULT '{}';
ALTER TABLE portal_agents ADD COLUMN IF NOT EXISTS task_feed JSONB DEFAULT '{}';
ALTER TABLE portal_agents ADD COLUMN IF NOT EXISTS level_xp INTEGER DEFAULT 0;
ALTER TABLE portal_agents ADD COLUMN IF NOT EXISTS efficiency_score DECIMAL(5,2) DEFAULT 100.00;
ALTER TABLE portal_agents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE portal_agents ADD COLUMN IF NOT EXISTS department_type TEXT;

-- Add portal-specific fields to portal_agent_memory
ALTER TABLE portal_agent_memory ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'memory';
ALTER TABLE portal_agent_memory ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update portal_agent_memory to include user_id based on agent ownership
UPDATE portal_agent_memory 
SET user_id = (
  SELECT pa.user_id 
  FROM portal_agents pa 
  WHERE pa.id = portal_agent_memory.agent_id
) 
WHERE user_id IS NULL;

-- ============================================================================
-- STEP 3: CREATE NEW PORTAL TABLES
-- ============================================================================

-- Portal Departments Table
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

-- Insert default departments
INSERT INTO public.portal_departments (name, slug, icon, color, description) VALUES
('HR', 'hr', '👥', '#10B981', 'Human resources and people management'),
('Operations', 'operations', '⚙️', '#F59E0B', 'Business operations and process management'),
('Product', 'product', '🚀', '#8B5CF6', 'Product development and management'),
('Finance', 'finance', '💰', '#EF4444', 'Financial planning and analysis'),
('Analytics', 'analytics', '📊', '#06B6D4', 'Data analysis and business intelligence');

-- Portal Agent Groups Table (many-to-many relationship between agents and departments)
CREATE TABLE IF NOT EXISTS portal_agent_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES portal_agents(id) ON DELETE CASCADE,
  department_id UUID REFERENCES portal_departments(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_name TEXT,
  custom_avatar TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portal Knowledge Base Table
CREATE TABLE IF NOT EXISTS portal_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES portal_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  type TEXT DEFAULT 'document', -- document, memory, learning, context
  access_level TEXT DEFAULT 'private', -- private, shared, public
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portal Activity Log Table
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

-- Portal Notifications Table
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

-- ============================================================================
-- STEP 4: CREATE INDEXES FOR NEW TABLES
-- ============================================================================

-- Portal Agent Groups indexes
CREATE INDEX IF NOT EXISTS idx_portal_agent_groups_agent_id ON portal_agent_groups(agent_id);
CREATE INDEX IF NOT EXISTS idx_portal_agent_groups_department_id ON portal_agent_groups(department_id);
CREATE INDEX IF NOT EXISTS idx_portal_agent_groups_user_id ON portal_agent_groups(user_id);

-- Portal Knowledge Base indexes
CREATE INDEX IF NOT EXISTS idx_portal_knowledge_base_agent_id ON portal_knowledge_base(agent_id);
CREATE INDEX IF NOT EXISTS idx_portal_knowledge_base_user_id ON portal_knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_knowledge_base_type ON portal_knowledge_base(type);
CREATE INDEX IF NOT EXISTS idx_portal_knowledge_base_tags ON portal_knowledge_base USING GIN(tags);

-- Portal Activity Log indexes
CREATE INDEX IF NOT EXISTS idx_portal_activity_log_actor_type ON portal_activity_log(actor_type);
CREATE INDEX IF NOT EXISTS idx_portal_activity_log_actor_id ON portal_activity_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_portal_activity_log_user_id ON portal_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_activity_log_agent_id ON portal_activity_log(agent_id);
CREATE INDEX IF NOT EXISTS idx_portal_activity_log_created_at ON portal_activity_log(created_at);

-- Portal Notifications indexes
CREATE INDEX IF NOT EXISTS idx_portal_notifications_user_id ON portal_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_agent_id ON portal_notifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_type ON portal_notifications(type);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_status ON portal_notifications(status);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_created_at ON portal_notifications(created_at);

-- ============================================================================
-- STEP 5: SETUP ROW LEVEL SECURITY FOR NEW TABLES
-- ============================================================================

-- Portal Agent Groups RLS
ALTER TABLE portal_agent_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agent groups" ON portal_agent_groups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent groups" ON portal_agent_groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent groups" ON portal_agent_groups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agent groups" ON portal_agent_groups
  FOR DELETE USING (auth.uid() = user_id);

-- Portal Knowledge Base RLS
ALTER TABLE portal_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own knowledge" ON portal_knowledge_base
  FOR SELECT USING (auth.uid() = user_id OR access_level = 'public');

CREATE POLICY "Users can insert own knowledge" ON portal_knowledge_base
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge" ON portal_knowledge_base
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge" ON portal_knowledge_base
  FOR DELETE USING (auth.uid() = user_id);

-- Portal Activity Log RLS
ALTER TABLE portal_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON portal_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity" ON portal_activity_log
  FOR INSERT WITH CHECK (true); -- Allow system to log activities

-- Portal Notifications RLS
ALTER TABLE portal_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON portal_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON portal_notifications
  FOR INSERT WITH CHECK (true); -- Allow system to create notifications

CREATE POLICY "Users can update own notifications" ON portal_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON portal_notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 6: CREATE TRIGGERS FOR NEW TABLES
-- ============================================================================

-- Update triggers for new tables
CREATE TRIGGER update_portal_agent_groups_updated_at
BEFORE UPDATE ON portal_agent_groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_knowledge_base_updated_at
BEFORE UPDATE ON portal_knowledge_base
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_notifications_updated_at
BEFORE UPDATE ON portal_notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 7: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to log portal activities
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

-- Function to create portal notifications
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

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log this migration
SELECT log_portal_activity(
  'system', 
  NULL, 
  'database_migration', 
  'Completed Portal Shift Phase 2: Database Rewiring',
  '{"migration": "12_portal_shift_phase2", "version": "2.0"}'::JSONB
); 