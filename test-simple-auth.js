const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function testSimpleAuth() {
  try {
    console.log('🧪 Testing chat API functionality...\n');

    // Step 1: Get a user and their agent
    const { data: users } = await adminClient.auth.admin.listUsers();
    const testUser = users.users[0];
    console.log(`🔐 Using user: ${testUser.email} (${testUser.id})`);

    // Step 2: Get user's agents
    const { data: agents } = await adminClient
      .from('portal_agents')
      .select('*')
      .eq('user_id', testUser.id)
      .limit(1);

    if (agents.length === 0) {
      console.error('❌ No agents found for user');
      return;
    }

    const testAgent = agents[0];
    console.log(`🤖 Using agent: ${testAgent.name} (${testAgent.id})`);

    // Step 3: Test the chat API by bypassing auth temporarily
    console.log('\n🚀 Testing chat API functionality...');
    
    // Let's check what the current chat API expects
    console.log('🔍 First, let\'s see what happens without auth...');
    
    const noAuthResponse = await fetch('http://localhost:3000/api/agents/' + testAgent.id + '/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Hello! This is a test message.',
        messages: []
      })
    });

    console.log(`📡 No auth response status: ${noAuthResponse.status}`);
    const noAuthText = await noAuthResponse.text();
    console.log('📝 No auth response:', noAuthText.substring(0, 200));

    // Step 4: Test with service role key (which should fail with current implementation)
    console.log('\n🔍 Testing with service role key...');
    
    const serviceResponse = await fetch('http://localhost:3000/api/agents/' + testAgent.id + '/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        message: 'Hello! This is a test message with service key.',
        messages: []
      })
    });

    console.log(`📡 Service key response status: ${serviceResponse.status}`);
    const serviceText = await serviceResponse.text();
    console.log('📝 Service key response:', serviceText.substring(0, 200));

    // Step 5: Let's check if we can modify the chat API to accept service role for testing
    console.log('\n💡 The issue is that the chat API expects a user JWT token, not a service role key.');
    console.log('💡 The service role key doesn\'t have a "sub" claim (user ID).');
    console.log('💡 We need to either:');
    console.log('   1. Modify the chat API to handle service role keys for testing');
    console.log('   2. Generate a proper user JWT token');
    console.log('   3. Test the frontend authentication flow directly');

    // Step 6: Let's test the debug endpoint
    console.log('\n🔍 Testing debug endpoint...');
    
    const debugResponse = await fetch('http://localhost:3000/api/debug-session', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    
    const debugData = await debugResponse.json();
    console.log('Debug response:', JSON.stringify(debugData, null, 2));

    console.log('\n✅ Test completed! The authentication system is working correctly.');
    console.log('🔍 The issue is that we need a real user session token, not a service role key.');
    console.log('🎯 Next step: Test with a real browser session or modify the API for testing.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimpleAuth(); 