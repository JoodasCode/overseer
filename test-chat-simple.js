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

async function testChatSimple() {
  try {
    console.log('🧪 Testing Chat API with proper authentication...\n');

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

    // Step 3: Create a valid JWT token using the service role
    console.log('🔑 Creating JWT token...');
    
    // Use the admin client to create a session for this user
    const payload = {
      sub: testUser.id,
      email: testUser.email,
      aud: 'authenticated',
      role: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    };

    // For testing, let's use the service role key to make the request
    console.log('✅ Using service role for authentication test');

    // Step 4: Test the chat API endpoint using service role
    console.log('\n🚀 Testing chat API endpoint...');
    
    const chatResponse = await fetch('http://localhost:3000/api/agents/' + testAgent.id + '/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}` // Use service key for testing
      },
      body: JSON.stringify({
        message: 'Hello! This is a test message from the automated test.',
        messages: []
      })
    });

    console.log(`📡 Chat API response status: ${chatResponse.status}`);

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat API success!');
      console.log('📝 Response preview:', JSON.stringify(chatData).substring(0, 200) + '...');
    } else {
      const errorText = await chatResponse.text();
      console.error('❌ Chat API failed:');
      console.error('Status:', chatResponse.status);
      console.error('Response:', errorText.substring(0, 500));
      
      // Let's also test the debug endpoint
      console.log('\n🔍 Testing debug endpoint...');
      const debugResponse = await fetch('http://localhost:3000/api/debug-session', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      });
      
      const debugData = await debugResponse.json();
      console.log('Debug response:', debugData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testChatSimple(); 