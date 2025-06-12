#!/usr/bin/env node

/**
 * Apply Final Database Fixes
 * 
 * This script applies the remaining database optimizations to fix:
 * - Multiple permissive policies
 * - Unindexed foreign keys
 * - Unused indexes
 * - Function security issues
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyDatabaseFixes() {
  console.log('🔧 Applying Final Database Fixes...\n');

  const fixes = [
    {
      name: 'Consolidate user_tokens duplicate policies',
      sql: `
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
      `
    },
    {
      name: 'Consolidate workflow_executions duplicate policies',
      sql: `
        DROP POLICY IF EXISTS "System can manage workflow executions" ON public.workflow_executions;
        DROP POLICY IF EXISTS "Users can view their own workflow executions" ON public.workflow_executions;
        
        CREATE POLICY "workflow_executions_select_policy" ON public.workflow_executions
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM workflows w 
              WHERE w.id = workflow_id AND w.user_id = (SELECT auth.uid())
            ) OR auth.role() = 'service_role'
          );
      `
    },
    {
      name: 'Add missing foreign key indexes',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_integration_user_id ON public.Integration(user_id);
        CREATE INDEX IF NOT EXISTS idx_knowledgebase_user_id ON public.KnowledgeBase(user_id);
        CREATE INDEX IF NOT EXISTS idx_portal_notifications_user_id ON public.portal_notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
        CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
      `
    },
    {
      name: 'Remove unused indexes',
      sql: `
        DROP INDEX IF EXISTS idx_portal_agent_logs_conversation_id;
        DROP INDEX IF EXISTS idx_user_tokens_user_id;
        DROP INDEX IF EXISTS idx_action_logs_user_id;
        DROP INDEX IF EXISTS idx_portal_activity_log_agent_id;
        DROP INDEX IF EXISTS idx_portal_notifications_agent_id;
        DROP INDEX IF EXISTS idx_usage_logs_agent_id;
        DROP INDEX IF EXISTS idx_portal_agent_logs_user_agent;
        DROP INDEX IF EXISTS idx_user_tokens_usage_quota;
      `
    },
    {
      name: 'Fix consume_tokens function security',
      sql: `
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
          FROM user_tokens
          WHERE user_id = p_user_id;
          
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
      `
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const fix of fixes) {
    console.log(`🔧 Applying: ${fix.name}...`);
    
    try {
      const { error } = await supabase.rpc('exec', { 
        sql: fix.sql 
      });

      if (error) {
        console.log(`❌ ${fix.name} failed: ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ ${fix.name} completed`);
        successCount++;
      }
    } catch (error) {
      console.log(`❌ ${fix.name} error: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);

  if (errorCount === 0) {
    console.log('\n🎉 All database fixes applied successfully!');
    console.log('\n📋 Fixes Applied:');
    console.log('   ✅ Consolidated duplicate RLS policies');
    console.log('   ✅ Added missing foreign key indexes');
    console.log('   ✅ Removed unused indexes');
    console.log('   ✅ Fixed function security issues');
    console.log('\n⚠️  Manual Actions Required:');
    console.log('   🔧 Go to Supabase Dashboard > Authentication > Settings');
    console.log('   🔧 Set OTP expiry to less than 1 hour');
    console.log('   🔧 Enable "Leaked Password Protection"');
  }

  console.log('\n✨ Database optimization complete!');
}

// Run the script
if (require.main === module) {
  applyDatabaseFixes()
    .catch(error => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { applyDatabaseFixes }; 