-- =====================================================
-- SAFE FIX FOR REMAINING DATABASE ISSUES
-- Checks for table existence before applying fixes
-- =====================================================

-- Fix 1: Consolidate user_tokens duplicate policies (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_tokens') THEN
        DROP POLICY IF EXISTS "System can manage token records" ON public.user_tokens;
        DROP POLICY IF EXISTS "Users can manage their own tokens" ON public.user_tokens;
        
        CREATE POLICY "user_tokens_select_policy" ON public.user_tokens
          FOR SELECT USING (user_id = (SELECT auth.uid()) OR auth.role() = 'service_role');
        
        CREATE POLICY "user_tokens_insert_policy" ON public.user_tokens
          FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()) OR auth.role() = 'service_role');
        
        CREATE POLICY "user_tokens_update_policy" ON public.user_tokens
          FOR UPDATE USING (user_id = (SELECT auth.uid()) OR auth.role() = 'service_role')
          WITH CHECK (user_id = (SELECT auth.uid()) OR auth.role() = 'service_role');
        
        CREATE POLICY "user_tokens_delete_policy" ON public.user_tokens
          FOR DELETE USING (user_id = (SELECT auth.uid()) OR auth.role() = 'service_role');
        
        RAISE NOTICE 'Fixed user_tokens policies';
    ELSE
        RAISE NOTICE 'Skipped user_tokens (table does not exist)';
    END IF;
END
$$;

-- Fix 2: Consolidate workflow_executions duplicate policies (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_executions') THEN
        DROP POLICY IF EXISTS "System can manage workflow executions" ON public.workflow_executions;
        DROP POLICY IF EXISTS "Users can view their own workflow executions" ON public.workflow_executions;
        
        CREATE POLICY "workflow_executions_select_policy" ON public.workflow_executions
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM workflows w 
              WHERE w.id = workflow_id AND w.user_id = (SELECT auth.uid())
            ) OR auth.role() = 'service_role'
          );
        
        RAISE NOTICE 'Fixed workflow_executions policies';
    ELSE
        RAISE NOTICE 'Skipped workflow_executions (table does not exist)';
    END IF;
END
$$;

-- Fix 3: Add missing foreign key indexes (only for existing tables)
DO $$
BEGIN
    -- Integration table (case sensitive check)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Integration') THEN
        CREATE INDEX IF NOT EXISTS idx_integration_user_id ON public.Integration(user_id);
        RAISE NOTICE 'Added index to Integration table';
    ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration') THEN
        CREATE INDEX IF NOT EXISTS idx_integration_user_id ON public.integration(user_id);
        RAISE NOTICE 'Added index to integration table (lowercase)';
    ELSE
        RAISE NOTICE 'Skipped Integration/integration (table does not exist)';
    END IF;
    
    -- KnowledgeBase table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'KnowledgeBase') THEN
        CREATE INDEX IF NOT EXISTS idx_knowledgebase_user_id ON public.KnowledgeBase(user_id);
        RAISE NOTICE 'Added index to KnowledgeBase table';
    ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'knowledgebase') THEN
        CREATE INDEX IF NOT EXISTS idx_knowledgebase_user_id ON public.knowledgebase(user_id);
        RAISE NOTICE 'Added index to knowledgebase table (lowercase)';
    ELSE
        RAISE NOTICE 'Skipped KnowledgeBase/knowledgebase (table does not exist)';
    END IF;
    
    -- portal_notifications table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portal_notifications') THEN
        CREATE INDEX IF NOT EXISTS idx_portal_notifications_user_id ON public.portal_notifications(user_id);
        RAISE NOTICE 'Added index to portal_notifications table';
    ELSE
        RAISE NOTICE 'Skipped portal_notifications (table does not exist)';
    END IF;
    
    -- usage_logs table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usage_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
        RAISE NOTICE 'Added index to usage_logs table';
    ELSE
        RAISE NOTICE 'Skipped usage_logs (table does not exist)';
    END IF;
    
    -- workflow_executions table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_executions') THEN
        CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
        RAISE NOTICE 'Added index to workflow_executions table';
    ELSE
        RAISE NOTICE 'Skipped workflow_executions (table does not exist)';
    END IF;
    
    -- workflows table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflows') THEN
        CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
        RAISE NOTICE 'Added index to workflows table';
    ELSE
        RAISE NOTICE 'Skipped workflows (table does not exist)';
    END IF;
END
$$;

-- Fix 4: Remove unused indexes (safe - only drops if exists)
DROP INDEX IF EXISTS idx_portal_agent_logs_conversation_id;
DROP INDEX IF EXISTS idx_user_tokens_user_id;
DROP INDEX IF EXISTS idx_action_logs_user_id;
DROP INDEX IF EXISTS idx_portal_activity_log_agent_id;
DROP INDEX IF EXISTS idx_portal_notifications_agent_id;
DROP INDEX IF EXISTS idx_usage_logs_agent_id;
DROP INDEX IF EXISTS idx_portal_agent_logs_user_agent;
DROP INDEX IF EXISTS idx_user_tokens_usage_quota;

-- Fix 5: Fix consume_tokens function security (already working based on logs)
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
  SELECT tokens_used, token_quota INTO current_usage, current_quota
  FROM user_tokens WHERE user_id = p_user_id;
  
  IF current_usage + p_tokens > current_quota THEN
    RETURN FALSE;
  END IF;
  
  UPDATE user_tokens
  SET tokens_used = tokens_used + p_tokens, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  INSERT INTO portal_agent_logs (
    user_id, agent_id, conversation_id, role, content,
    tokens_consumed, openai_tokens, created_at
  ) VALUES (
    p_user_id, p_agent_id, p_conversation_id, 'user', p_message_content,
    p_tokens, p_openai_tokens, NOW()
  );
  
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_tokens TO authenticated, anon;

-- Summary message
DO $$
BEGIN
    RAISE NOTICE '=== DATABASE OPTIMIZATION COMPLETED ===';
    RAISE NOTICE 'Applied fixes only to existing tables';
    RAISE NOTICE 'Removed unused indexes to improve performance';
    RAISE NOTICE 'Fixed consume_tokens function security';
    RAISE NOTICE 'Consolidated duplicate RLS policies';
    RAISE NOTICE '=== MANUAL ACTIONS REQUIRED ===';
    RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Settings';
    RAISE NOTICE '2. Set OTP expiry to 3600 seconds (1 hour)';
    RAISE NOTICE '3. Enable "Leaked Password Protection"';
END
$$; 