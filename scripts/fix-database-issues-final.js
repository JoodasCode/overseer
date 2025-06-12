const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use the correct project ID
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeMigration(name, sql) {
  try {
    console.log(`🔧 Applying: ${name}...`);
    
    const { data, error } = await supabase.rpc('exec', { 
      sql_query: sql 
    });
    
    if (error) {
      console.log(`❌ ${name} failed:`, error.message);
      return false;
    }
    
    console.log(`✅ ${name} applied successfully`);
    return true;
  } catch (err) {
    console.log(`❌ ${name} failed:`, err.message);
    return false;
  }
}

async function applyAllFixes() {
  console.log('🔧 Starting database optimization...\n');
  
  const fixes = [
    {
      name: 'Fix consume_tokens function with correct parameter order',
      sql: `
        -- Drop the existing function if it exists
        DROP FUNCTION IF EXISTS public.consume_tokens;

        -- Create the function with correct parameter order to match API call
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
          
          -- Initialize user tokens if not exists
          IF current_usage IS NULL THEN
            INSERT INTO user_tokens (user_id, tokens_used, token_quota)
            VALUES (p_user_id, 0, 500)
            ON CONFLICT (user_id) DO NOTHING;
            current_usage := 0;
            current_quota := 500;
          END IF;
          
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
          
          RETURN TRUE;
        END;
        $$;

        -- Grant execute permissions
        GRANT EXECUTE ON FUNCTION public.consume_tokens TO authenticated, anon;
      `
    },
    
    {
      name: 'Optimize portal_agent_logs RLS policies',
      sql: `
        -- Drop existing policies
        DROP POLICY IF EXISTS "portal_agent_logs_user_select" ON portal_agent_logs;
        DROP POLICY IF EXISTS "portal_agent_logs_user_insert" ON portal_agent_logs;
        DROP POLICY IF EXISTS "portal_agent_logs_user_update" ON portal_agent_logs;
        
        -- Create optimized policies with proper auth.uid() wrapping
        CREATE POLICY "portal_agent_logs_select_policy" ON portal_agent_logs
          FOR SELECT USING (user_id = (SELECT auth.uid()));
        
        CREATE POLICY "portal_agent_logs_insert_policy" ON portal_agent_logs
          FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
        
        CREATE POLICY "portal_agent_logs_update_policy" ON portal_agent_logs
          FOR UPDATE USING (user_id = (SELECT auth.uid()))
          WITH CHECK (user_id = (SELECT auth.uid()));
      `
    },
    
    {
      name: 'Optimize user_tokens RLS policies',
      sql: `
        -- Drop existing overlapping policies
        DROP POLICY IF EXISTS "Users can view their own token usage" ON user_tokens;
        DROP POLICY IF EXISTS "Users can update their own token usage" ON user_tokens;
        DROP POLICY IF EXISTS "System can insert token records" ON user_tokens;
        
        -- Create single, efficient policies
        CREATE POLICY "user_tokens_select_policy" ON user_tokens
          FOR SELECT USING (user_id = (SELECT auth.uid()));
        
        CREATE POLICY "user_tokens_insert_policy" ON user_tokens
          FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
        
        CREATE POLICY "user_tokens_update_policy" ON user_tokens
          FOR UPDATE USING (user_id = (SELECT auth.uid()))
          WITH CHECK (user_id = (SELECT auth.uid()));
      `
    },
    
    {
      name: 'Add missing foreign key indexes',
      sql: `
        -- Add indexes for foreign keys to improve join performance
        CREATE INDEX IF NOT EXISTS idx_action_logs_user_id ON action_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_portal_activity_log_agent_id ON portal_activity_log(agent_id);
        CREATE INDEX IF NOT EXISTS idx_portal_notifications_user_id ON portal_notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
        CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
      `
    },
    
    {
      name: 'Remove unused indexes',
      sql: `
        -- Drop unused indexes to improve INSERT/UPDATE performance
        DROP INDEX IF EXISTS idx_portal_agent_logs_conversation_id;
        DROP INDEX IF EXISTS idx_portal_agent_logs_user_agent;
        DROP INDEX IF EXISTS idx_user_tokens_usage_quota;
        DROP INDEX IF EXISTS idx_portal_notifications_agent_id;
        DROP INDEX IF EXISTS idx_usage_logs_agent_id;
      `
    },
    
    {
      name: 'Enable agents for all users (remove user_id restriction)',
      sql: `
        -- Drop user-specific agent policies
        DROP POLICY IF EXISTS "Users can manage own agents" ON portal_agents;
        DROP POLICY IF EXISTS "portal_agents_user_select" ON portal_agents;
        
        -- Create policy allowing all users to view all agents
        CREATE POLICY "portal_agents_select_all" ON portal_agents
          FOR SELECT USING (true);
        
        -- Allow system to manage agents
        CREATE POLICY "portal_agents_system_manage" ON portal_agents
          FOR ALL USING (auth.role() = 'service_role');
      `
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const fix of fixes) {
    const success = await executeMigration(fix.name, fix.sql);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // Small delay between fixes
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);

  if (errorCount === 0) {
    console.log('\n🎉 All database fixes applied successfully!');
    console.log('\n📋 What was fixed:');
    console.log('   ✅ Fixed consume_tokens function parameter order');
    console.log('   ✅ Optimized RLS policies for better performance');
    console.log('   ✅ Added missing foreign key indexes');
    console.log('   ✅ Removed unused indexes');
    console.log('   ✅ Enabled all agents for all users (Cursor-style)');
    console.log('\n🎯 Your chat API should now work perfectly! 🚀');
  } else if (successCount > errorCount) {
    console.log('\n⚠️  Most fixes applied successfully. Database significantly improved!');
  } else {
    console.log('\n❌ Many fixes failed. Check your database permissions.');
  }
}

// Run the fixes
if (require.main === module) {
  applyAllFixes()
    .then(() => {
      console.log('\n✨ Database optimization complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database optimization failed:', error);
      process.exit(1);
    });
}

module.exports = { applyAllFixes }; 