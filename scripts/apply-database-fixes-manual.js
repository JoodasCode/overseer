#!/usr/bin/env node

/**
 * Apply Database Fixes Manually
 * 
 * This script applies database fixes using direct SQL execution
 * instead of relying on stored procedures.
 */

const { createClient } = require('@supabase/supabase-js');

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

async function executeSQLQuery(name, query) {
  console.log(`🔧 ${name}...`);
  
  try {
    // Use the raw SQL execution endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: query })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`✅ ${name} completed`);
    return true;
  } catch (error) {
    console.log(`❌ ${name} failed: ${error.message}`);
    return false;
  }
}

async function applyDatabaseFixes() {
  console.log('🔧 Applying Database Fixes Manually...\n');

  const fixes = [
    {
      name: 'Drop duplicate user_tokens policies',
      query: `
        DROP POLICY IF EXISTS "System can manage token records" ON public.user_tokens;
        DROP POLICY IF EXISTS "Users can manage their own tokens" ON public.user_tokens;
      `
    },
    {
      name: 'Create user_tokens SELECT policy',
      query: `
        CREATE POLICY "user_tokens_select_policy" ON public.user_tokens
          FOR SELECT USING (user_id = (SELECT auth.uid()) OR auth.role() = 'service_role');
      `
    },
    {
      name: 'Create user_tokens INSERT policy',
      query: `
        CREATE POLICY "user_tokens_insert_policy" ON public.user_tokens
          FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()) OR auth.role() = 'service_role');
      `
    },
    {
      name: 'Create user_tokens UPDATE policy',
      query: `
        CREATE POLICY "user_tokens_update_policy" ON public.user_tokens
          FOR UPDATE USING (user_id = (SELECT auth.uid()) OR auth.role() = 'service_role')
          WITH CHECK (user_id = (SELECT auth.uid()) OR auth.role() = 'service_role');
      `
    },
    {
      name: 'Create user_tokens DELETE policy',
      query: `
        CREATE POLICY "user_tokens_delete_policy" ON public.user_tokens
          FOR DELETE USING (user_id = (SELECT auth.uid()) OR auth.role() = 'service_role');
      `
    },
    {
      name: 'Drop duplicate workflow_executions policies',
      query: `
        DROP POLICY IF EXISTS "System can manage workflow executions" ON public.workflow_executions;
        DROP POLICY IF EXISTS "Users can view their own workflow executions" ON public.workflow_executions;
      `
    },
    {
      name: 'Create workflow_executions SELECT policy',
      query: `
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
      name: 'Add Integration user_id index',
      query: 'CREATE INDEX IF NOT EXISTS idx_integration_user_id ON public.Integration(user_id);'
    },
    {
      name: 'Add KnowledgeBase user_id index',
      query: 'CREATE INDEX IF NOT EXISTS idx_knowledgebase_user_id ON public.KnowledgeBase(user_id);'
    },
    {
      name: 'Add portal_notifications user_id index',
      query: 'CREATE INDEX IF NOT EXISTS idx_portal_notifications_user_id ON public.portal_notifications(user_id);'
    },
    {
      name: 'Add usage_logs user_id index',
      query: 'CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);'
    },
    {
      name: 'Add workflow_executions workflow_id index',
      query: 'CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);'
    },
    {
      name: 'Add workflows user_id index',
      query: 'CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);'
    },
    {
      name: 'Drop unused conversation_id index',
      query: 'DROP INDEX IF EXISTS idx_portal_agent_logs_conversation_id;'
    },
    {
      name: 'Drop unused user_tokens user_id index',
      query: 'DROP INDEX IF EXISTS idx_user_tokens_user_id;'
    },
    {
      name: 'Drop unused action_logs user_id index',
      query: 'DROP INDEX IF EXISTS idx_action_logs_user_id;'
    },
    {
      name: 'Drop unused portal_activity_log agent_id index',
      query: 'DROP INDEX IF EXISTS idx_portal_activity_log_agent_id;'
    },
    {
      name: 'Drop unused portal_notifications agent_id index',
      query: 'DROP INDEX IF EXISTS idx_portal_notifications_agent_id;'
    },
    {
      name: 'Drop unused usage_logs agent_id index',
      query: 'DROP INDEX IF EXISTS idx_usage_logs_agent_id;'
    },
    {
      name: 'Drop unused portal_agent_logs user_agent index',
      query: 'DROP INDEX IF EXISTS idx_portal_agent_logs_user_agent;'
    },
    {
      name: 'Drop unused user_tokens usage_quota index',
      query: 'DROP INDEX IF EXISTS idx_user_tokens_usage_quota;'
    },
    {
      name: 'Drop old consume_tokens function',
      query: 'DROP FUNCTION IF EXISTS public.consume_tokens;'
    },
    {
      name: 'Create secure consume_tokens function',
      query: `
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
      `
    },
    {
      name: 'Grant permissions to consume_tokens function',
      query: 'GRANT EXECUTE ON FUNCTION public.consume_tokens TO authenticated, anon;'
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const fix of fixes) {
    const success = await executeSQLQuery(fix.name, fix.query);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);

  if (errorCount === 0) {
    console.log('\n🎉 All database fixes applied successfully!');
    console.log('\n📋 Fixes Applied:');
    console.log('   ✅ Consolidated duplicate RLS policies on user_tokens');
    console.log('   ✅ Consolidated duplicate RLS policies on workflow_executions');
    console.log('   ✅ Added 6 missing foreign key indexes');
    console.log('   ✅ Removed 8 unused indexes');
    console.log('   ✅ Fixed consume_tokens function security');
    console.log('\n⚠️  Manual Actions Still Required:');
    console.log('   🔧 Go to Supabase Dashboard > Authentication > Settings');
    console.log('   🔧 Set OTP expiry to less than 1 hour (3600 seconds)');
    console.log('   🔧 Enable "Leaked Password Protection"');
    console.log('\n🎯 Database Performance & Security: OPTIMIZED ✨');
  } else if (successCount > errorCount) {
    console.log('\n⚠️  Most fixes applied successfully. Database significantly improved!');
  } else {
    console.log('\n❌ Many fixes failed. You may need to apply them manually in Supabase console.');
  }

  console.log('\n🔗 To complete the fixes manually, go to:');
  console.log('   https://app.supabase.com/project/dmljaxdvnuczjwhuzuhs/sql');
  console.log('   Copy and paste the SQL from: sql/fix_remaining_database_issues.sql');
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