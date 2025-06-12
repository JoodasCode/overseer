-- =====================================================
-- FIX REMAINING DATABASE ISSUES
-- Addresses all remaining linter warnings and security issues
-- =====================================================

-- Fix 1: Consolidate user_tokens duplicate policies
-- Multiple permissive policies cause performance issues
-- Drop the overlapping policies and create clean ones

DROP POLICY IF EXISTS "System can manage token records" ON public.user_tokens;
DROP POLICY IF EXISTS "Users can manage their own tokens" ON public.user_tokens;

-- Create single, efficient policies for user_tokens
CREATE POLICY "user_tokens_select_policy" ON public.user_tokens
  FOR SELECT USING (user_id = (SELECT auth.uid()) OR auth.role() = 'service_role');

CREATE POLICY "user_tokens_insert_policy" ON public.user_tokens
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()) OR auth.role() = 'service_role');

CREATE POLICY "user_tokens_update_policy" ON public.user_tokens
  FOR UPDATE USING (user_id = (SELECT auth.uid()) OR auth.role() = 'service_role')
  WITH CHECK (user_id = (SELECT auth.uid()) OR auth.role() = 'service_role');

CREATE POLICY "user_tokens_delete_policy" ON public.user_tokens
  FOR DELETE USING (user_id = (SELECT auth.uid()) OR auth.role() = 'service_role');

-- Fix 2: Consolidate workflow_executions duplicate policies
DROP POLICY IF EXISTS "System can manage workflow executions" ON public.workflow_executions;
DROP POLICY IF EXISTS "Users can view their own workflow executions" ON public.workflow_executions;

-- Create single, efficient policy for workflow_executions
CREATE POLICY "workflow_executions_select_policy" ON public.workflow_executions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workflows w 
      WHERE w.id = workflow_id AND w.user_id = (SELECT auth.uid())
    ) OR auth.role() = 'service_role'
  );

-- Fix 3: Add missing indexes for foreign keys
-- These improve query performance for joins and foreign key lookups
CREATE INDEX IF NOT EXISTS idx_integration_user_id ON public.Integration(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledgebase_user_id ON public.KnowledgeBase(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_user_id ON public.portal_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);

-- Fix 4: Drop unused indexes to improve performance
-- These indexes are not being used and slow down INSERT/UPDATE operations
DROP INDEX IF EXISTS idx_portal_agent_logs_conversation_id;
DROP INDEX IF EXISTS idx_user_tokens_user_id;
DROP INDEX IF EXISTS idx_action_logs_user_id;
DROP INDEX IF EXISTS idx_portal_activity_log_agent_id;
DROP INDEX IF EXISTS idx_portal_notifications_agent_id;
DROP INDEX IF EXISTS idx_usage_logs_agent_id;
DROP INDEX IF EXISTS idx_portal_agent_logs_user_agent;
DROP INDEX IF EXISTS idx_user_tokens_usage_quota;

-- Fix 5: Fix consume_tokens function security
-- The function has mutable search_path which is a security risk
DROP FUNCTION IF EXISTS public.consume_tokens;
CREATE OR REPLACE FUNCTION public.consume_tokens(
  p_user_id UUID,
  p_agent_id UUID,
  p_conversation_id UUID,
  p_message_content TEXT,
  p_openai_tokens INTEGER DEFAULT NULL,
  p_tokens INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_usage INTEGER;
  current_quota INTEGER;
BEGIN
  -- Get current usage and quota
  SELECT tokens_used, token_quota INTO current_usage, current_quota
  FROM user_tokens
  WHERE user_id = p_user_id;
  
  -- Check if user has enough tokens
  IF current_usage + p_tokens > current_quota THEN
    RETURN FALSE;
  END IF;
  
  -- Update token usage
  UPDATE user_tokens
  SET 
    tokens_used = tokens_used + p_tokens,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log the conversation
  INSERT INTO portal_agent_logs (
    user_id,
    agent_id,
    conversation_id,
    role,
    content,
    tokens_consumed,
    openai_tokens,
    created_at
  ) VALUES (
    p_user_id,
    p_agent_id,
    p_conversation_id,
    'user',
    p_message_content,
    p_tokens,
    p_openai_tokens,
    NOW()
  );
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.consume_tokens TO authenticated, anon;

-- Summary of fixes applied:
-- ✅ Consolidated duplicate RLS policies on user_tokens table
-- ✅ Consolidated duplicate RLS policies on workflow_executions table  
-- ✅ Added missing foreign key indexes (6 indexes)
-- ✅ Removed 8 unused indexes
-- ✅ Fixed consume_tokens function security (added SET search_path = public)
-- ⚠️  Auth settings need manual update in Supabase Dashboard

COMMENT ON SCHEMA public IS 'Database optimization completed - All linter issues resolved except auth settings which require dashboard configuration'; 