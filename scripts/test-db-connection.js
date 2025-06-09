#!/usr/bin/env node

/**
 * Overseer Database Connection Test
 * Tests connection to Supabase database via Supabase client
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📡 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('🔑 Service Role Key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Test basic connection
    console.log('\n1. Testing basic table access...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .limit(5);

    if (agentsError) {
      console.error('❌ Error accessing agents table:', agentsError);
    } else {
      console.log('✅ Successfully accessed agents table');
      console.log(`📊 Found ${agents?.length || 0} existing agents`);
    }

    // Test user authentication
    console.log('\n2. Testing authentication...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error accessing users:', usersError);
    } else {
      console.log('✅ Successfully accessed users');
      console.log(`👥 Found ${users?.users?.length || 0} users`);
    }

    // Try creating a simple test agent
    console.log('\n3. Testing agent creation...');
    const testAgent = {
      name: 'Test Agent',
      description: 'A test agent',
      role: 'Test Role',
      persona: 'Test persona',
      avatar: '🤖',
      tools: ['test'],
      user_id: users?.users?.[0]?.id
    };

    const { data: createdAgent, error: createError } = await supabase
      .from('agents')
      .insert(testAgent)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating test agent:', createError);
    } else {
      console.log('✅ Successfully created test agent:', createdAgent.name);
      
      // Clean up - delete the test agent
      const { error: deleteError } = await supabase
        .from('agents')
        .delete()
        .eq('id', createdAgent.id);
      
      if (deleteError) {
        console.error('⚠️  Error cleaning up test agent:', deleteError);
      } else {
        console.log('🧹 Test agent cleaned up');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      console.log('\n✅ Database test complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database test failed:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseConnection };
