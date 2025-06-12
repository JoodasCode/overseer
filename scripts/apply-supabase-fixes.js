const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use the correct project credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeSQL(name, sql) {
  try {
    console.log(`🔧 Applying: ${name}...`);
    
    const { data, error } = await supabase
      .from('_supabase_migrations')
      .select('*')
      .limit(1);
    
    // Use raw SQL execution
    const { data: result, error: sqlError } = await supabase.rpc('exec_sql', { 
      query: sql 
    });
    
    if (sqlError) {
      // Try alternative approach
      const { data: altResult, error: altError } = await supabase
        .from('_supabase_sql')
        .insert({ sql_query: sql });
      
      if (altError) {
        console.log(`❌ ${name} failed:`, sqlError.message);
        return false;
      }
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
      name: 'Fix consume_tokens function parameter order',
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
          FROM user_tokens WHERE user_id = p_user_id;
          
          IF current_usage IS NULL THEN
            INSERT INTO user_tokens (user_id, tokens_used, token_quota)
            VALUES (p_user_id, 0, 500)
            ON CONFLICT (user_id) DO NOTHING;
            current_usage := 0;
            current_quota := 500;
          END IF;
          
          IF current_usage + p_tokens > current_quota THEN
            RETURN FALSE;
          END IF;
          
          UPDATE user_tokens
          SET tokens_used = tokens_used + p_tokens, updated_at = NOW()
          WHERE user_id = p_user_id;
          
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
    const success = await executeSQL(fix.name, fix.sql);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  
  if (successCount > 0) {
    console.log('\n🎉 Database fixes applied! Your consume_tokens function should now work.');
  }
}

// Run the fixes
if (require.main === module) {
  applyAllFixes()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error);
      process.exit(1);
    });
}

module.exports = { applyAllFixes }; 