-- 🧠 FINAL TOKEN SYSTEM MIGRATION
-- Implements Cursor-inspired usage model with no agent hiring
-- Run this in Supabase SQL Editor

BEGIN;

-- ========================================
-- 1. USER TOKEN MANAGEMENT 
-- ========================================

-- Core token tracking table
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_used INTEGER DEFAULT 0,
  token_quota INTEGER DEFAULT 500, -- Free tier default
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reset_period TEXT DEFAULT 'monthly',
  total_lifetime_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT user_tokens_user_id_unique UNIQUE(user_id),
  CONSTRAINT user_tokens_positive_quota CHECK (token_quota >= 0),
  CONSTRAINT user_tokens_positive_used CHECK (tokens_used >= 0)
);

-- ========================================
-- 2. USAGE LOGGING & ANALYTICS
-- ========================================

-- Per-message token tracking  
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES portal_agents(id) ON DELETE CASCADE,
  message_content TEXT NOT NULL,
  tokens_consumed INTEGER DEFAULT 1,
  openai_tokens_used INTEGER, -- Actual OpenAI API usage
  conversation_id UUID, -- Group related messages
  message_type TEXT DEFAULT 'chat', -- 'chat', 'action', 'background'
  cost_tier TEXT DEFAULT 'standard', -- 'standard', 'premium', 'enterprise'
  response_time_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent action tracking (separate from chat)
CREATE TABLE IF NOT EXISTS action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES portal_agents(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'tool_call', 'integration_fetch', 'workflow_trigger'
  action_name TEXT NOT NULL, -- 'asana_fetch_tasks', 'slack_send_message'
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  execution_time_ms INTEGER,
  credits_consumed INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. ENHANCED AGENT LOGS (Replace portal_agent_logs)
-- ========================================

-- Update existing portal_agent_logs table to include token tracking
ALTER TABLE portal_agent_logs 
ADD COLUMN IF NOT EXISTS tokens_consumed INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS openai_tokens INTEGER,
ADD COLUMN IF NOT EXISTS conversation_id UUID,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'chat';

-- ========================================
-- 4. INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_agent_id ON usage_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_conversation_id ON usage_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_user_id ON action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_agent_id ON action_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_created_at ON action_logs(created_at);

-- ========================================
-- 5. ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on new tables
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;

-- User tokens policies
CREATE POLICY "Users can view their own token usage" ON user_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own token usage" ON user_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert token records" ON user_tokens
  FOR INSERT WITH CHECK (true);

-- Usage logs policies
CREATE POLICY "Users can view their own usage logs" ON usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage logs" ON usage_logs
  FOR INSERT WITH CHECK (true);

-- Action logs policies  
CREATE POLICY "Users can view their own action logs" ON action_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert action logs" ON action_logs
  FOR INSERT WITH CHECK (true);

-- ========================================
-- 6. AGENT ACCESS POLICY UPDATE
-- ========================================

-- CRITICAL: Remove user_id restriction from portal_agents
-- Now all users can see all agents (no hiring needed)
DROP POLICY IF EXISTS "Users can manage own agents" ON portal_agents;

-- New policy: All users can view all agents
CREATE POLICY "All users can view all agents" ON portal_agents
  FOR SELECT USING (true);

-- Only system/admin can manage agents
CREATE POLICY "System can manage agents" ON portal_agents
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ========================================
-- 7. UTILITY FUNCTIONS
-- ========================================

-- Function to initialize user tokens
CREATE OR REPLACE FUNCTION initialize_user_tokens(p_user_id UUID, p_quota INTEGER DEFAULT 500)
RETURNS UUID AS $$
DECLARE
  token_record_id UUID;
BEGIN
  INSERT INTO user_tokens (user_id, token_quota, tokens_used)
  VALUES (p_user_id, p_quota, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    token_quota = EXCLUDED.token_quota,
    updated_at = NOW()
  RETURNING id INTO token_record_id;
  
  RETURN token_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to consume tokens
CREATE OR REPLACE FUNCTION consume_tokens(
  p_user_id UUID,
  p_agent_id UUID,
  p_tokens INTEGER DEFAULT 1,
  p_conversation_id UUID DEFAULT NULL,
  p_message_content TEXT DEFAULT '',
  p_openai_tokens INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_used INTEGER;
  current_quota INTEGER;
BEGIN
  -- Get current usage
  SELECT tokens_used, token_quota INTO current_used, current_quota
  FROM user_tokens WHERE user_id = p_user_id;
  
  -- Check if user has enough tokens
  IF current_used + p_tokens > current_quota THEN
    RETURN FALSE;
  END IF;
  
  -- Update token usage
  UPDATE user_tokens 
  SET 
    tokens_used = tokens_used + p_tokens,
    total_lifetime_tokens = total_lifetime_tokens + p_tokens,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log the usage
  INSERT INTO usage_logs (
    user_id, agent_id, message_content, tokens_consumed, 
    openai_tokens_used, conversation_id
  ) VALUES (
    p_user_id, p_agent_id, p_message_content, p_tokens,
    p_openai_tokens, COALESCE(p_conversation_id, gen_random_uuid())
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get token usage summary
CREATE OR REPLACE FUNCTION get_token_usage(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'userId', user_id,
    'tokensUsed', tokens_used,
    'tokenQuota', token_quota,
    'tokensRemaining', token_quota - tokens_used,
    'percentUsed', ROUND((tokens_used::DECIMAL / token_quota::DECIMAL) * 100, 2),
    'lastReset', last_reset,
    'resetPeriod', reset_period,
    'lifetimeTokens', total_lifetime_tokens
  ) INTO result
  FROM user_tokens 
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(result, json_build_object(
    'userId', p_user_id,
    'tokensUsed', 0,
    'tokenQuota', 500,
    'tokensRemaining', 500,
    'percentUsed', 0,
    'lastReset', NOW(),
    'resetPeriod', 'monthly',
    'lifetimeTokens', 0
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly tokens (for cron job)
CREATE OR REPLACE FUNCTION reset_monthly_tokens()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER := 0;
BEGIN
  UPDATE user_tokens 
  SET 
    tokens_used = 0,
    last_reset = NOW(),
    updated_at = NOW()
  WHERE last_reset < NOW() - INTERVAL '1 month';
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 8. SAMPLE DATA MIGRATION
-- ========================================

-- Initialize tokens for all existing users
INSERT INTO user_tokens (user_id, token_quota, tokens_used)
SELECT 
  id as user_id,
  500 as token_quota, -- Default free tier
  0 as tokens_used
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample agents that all users can access
INSERT INTO portal_agents (
  id, name, description, role, persona, avatar_url, tools, department_type, status
) VALUES 
  (
    gen_random_uuid(),
    'Alex Rodriguez',
    'Strategic Coordinator and team efficiency expert',
    'Strategic Coordinator',
    'Analytical, systematic, and focused on optimization. Prefers structured approaches and data-driven decisions.',
    '/avatars/alex.jpg',
    '["task_management", "analytics", "coordination"]',
    'Communications',
    'active'
  ),
  (
    gen_random_uuid(),
    'Dana Chen', 
    'Creative Director with expertise in visual storytelling',
    'Creative Director',
    'Enthusiastic, creative, and visually oriented. Loves brainstorming and innovative solutions.',
    '/avatars/dana.jpg',
    '["design", "content_creation", "visual_storytelling"]',
    'Communications',
    'active'
  ),
  (
    gen_random_uuid(),
    'Riley Park',
    'Senior Data Analyst specialized in business intelligence',
    'Senior Data Analyst', 
    'Detail-oriented, logical, and metrics-focused. Prefers evidence-based recommendations.',
    '/avatars/riley.jpg',
    '["data_analysis", "reporting", "business_intelligence"]',
    'Communications',
    'active'
  ),
  (
    gen_random_uuid(),
    'Jamie Torres',
    'Communications Manager focused on team collaboration',
    'Communications Manager',
    'Collaborative, diplomatic, and people-focused. Excellent at facilitating team communication.',
    '/avatars/jamie.jpg',
    '["communication", "team_coordination", "project_management"]',
    'Communications', 
    'active'
  ),
  (
    gen_random_uuid(),
    'Toby Kim',
    'Operations Specialist for rapid response and execution',
    'Operations Specialist',
    'Action-oriented, responsive, and execution-focused. Thrives in fast-paced environments.',
    '/avatars/toby.jpg',
    '["operations", "rapid_response", "execution"]',
    'Communications',
    'active'
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Success message
SELECT 
  'Token system migration complete! 🚀' as status,
  'All users can now access all agents with token-based usage' as details; 