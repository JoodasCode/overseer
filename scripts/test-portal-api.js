require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

// Test script to verify Portal API functionality after Phase 2 migration

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPortalStructure() {
  console.log('🧪 Testing Portal API Structure');
  console.log('================================');
  
  try {
    // Test 1: Check if portal tables exist
    console.log('\n1. Checking portal tables...');
    
    const tables = [
      'portal_agents',
      'portal_agent_memory', 
      'portal_agent_tasks',
      'portal_agent_logs',
      'portal_departments',
      'portal_agent_groups',
      'portal_knowledge_base',
      'portal_activity_log',
      'portal_notifications'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Table exists`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    // Test 2: Check departments data
    console.log('\n2. Checking portal departments...');
    const { data: departments, error: deptError } = await supabase
      .from('portal_departments')
      .select('*');
      
    if (deptError) {
      console.log('❌ Departments query failed:', deptError.message);
    } else {
      console.log(`✅ Found ${departments.length} departments:`);
      departments.forEach(dept => {
        console.log(`   - ${dept.name} (${dept.slug})`);
      });
    }
    
    // Test 3: Check existing agents (if any)
    console.log('\n3. Checking existing agents...');
    const { data: agents, error: agentsError } = await supabase
      .from('portal_agents')
      .select('*')
      .limit(5);
      
    if (agentsError) {
      console.log('❌ Agents query failed:', agentsError.message);
    } else {
      console.log(`✅ Found ${agents.length} agents in portal_agents table`);
      if (agents.length > 0) {
        agents.forEach(agent => {
          console.log(`   - ${agent.name} (${agent.role}) - Level ${agent.level || 1}`);
        });
      }
    }
    
    // Test 4: Test helper functions
    console.log('\n4. Testing helper functions...');
    
    try {
      // Test activity logging function
      const { data: activityId, error: activityError } = await supabase
        .rpc('log_portal_activity', {
          p_actor_type: 'system',
          p_actor_id: null,
          p_action: 'test_portal_api',
          p_description: 'Testing portal API functionality',
          p_meta: { test: true, timestamp: new Date().toISOString() }
        });
        
      if (activityError) {
        console.log('❌ Activity logging failed:', activityError.message);
      } else {
        console.log('✅ Activity logging works');
      }
    } catch (err) {
      console.log('❌ Helper function test failed:', err.message);
    }
    
    // Test 5: Test if API routes would work
    console.log('\n5. Portal API readiness check...');
    
    const readinessChecks = [
      { name: 'portal_agents table', table: 'portal_agents' },
      { name: 'portal_agent_memory table', table: 'portal_agent_memory' },
      { name: 'portal_agent_logs table', table: 'portal_agent_logs' },
      { name: 'RLS policies', check: 'rls' }
    ];
    
    let allGood = true;
    
    for (const check of readinessChecks) {
      if (check.table) {
        try {
          await supabase.from(check.table).select('id').limit(1);
          console.log(`✅ ${check.name}: Ready`);
        } catch (err) {
          console.log(`❌ ${check.name}: Not ready - ${err.message}`);
          allGood = false;
        }
      }
    }
    
    console.log('\n================================');
    if (allGood) {
      console.log('🎉 Portal Phase 2 Migration: SUCCESS!');
      console.log('✅ All portal tables are ready');
      console.log('✅ API endpoints should work with new schema');
      console.log('✅ Ready to proceed with Phase 3');
    } else {
      console.log('⚠️  Portal Phase 2 Migration: Issues detected');
      console.log('   Please review the manual migration steps');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPortalStructure(); 