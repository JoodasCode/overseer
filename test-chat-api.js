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

async function testChatAPI() {
  try {
    console.log('🧪 Testing Chat API...\n');

    // Step 1: Get a user and their agent
    const { data: users } = await adminClient.auth.admin.listUsers();
    const testUser = users.users[0];
    console.log(`🔐 Using user: ${testUser.email}`);

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

    // Step 3: Generate a valid JWT token for the user
    console.log('🔑 Generating JWT token...');
    
    // Use the service role to create a session for the user
    const { data: sessionData, error: sessionError } = await adminClient.auth.admin.generateLink({
      type: 'signup',
      email: testUser.email,
      password: 'temp-password-123'
    });

    if (sessionError) {
      console.error('❌ Error generating session:', sessionError);
      return;
    }

    console.log('Session data:', sessionData);

    // For testing, let's use a simpler approach - create a JWT manually
    // Since we have service role access, we can validate the user directly
    const accessToken = 'test-token-' + testUser.id;
    
    console.log(`✅ Using test token for user: ${testUser.id}`);

    // Step 4: Test the chat API endpoint
    console.log('\n🚀 Testing chat API endpoint...');
    
    const chatResponse = await fetch('http://localhost:3000/api/agents/' + testAgent.id + '/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        message: 'Hello! This is a test message.',
        messages: []
      })
    });

    console.log(`📡 Chat API response status: ${chatResponse.status}`);

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat API success!');
      console.log('📝 Response:', chatData);
    } else {
      const errorText = await chatResponse.text();
      console.error('❌ Chat API failed:');
      console.error('Status:', chatResponse.status);
      console.error('Response:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testChatAPI(); 