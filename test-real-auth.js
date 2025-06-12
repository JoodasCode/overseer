const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Create both clients - one for user auth, one for admin operations
const userClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function testRealAuth() {
  try {
    console.log('🧪 Testing REAL authentication flow...\n');

    // Step 1: Get a real user from the database
    const { data: users } = await adminClient.auth.admin.listUsers();
    const testUser = users.users[0];
    console.log(`🔐 Found test user: ${testUser.email} (${testUser.id})`);

    // Step 2: Create a real session for this user using admin
    console.log('🔑 Creating real session for user...');
    
    // Use admin to create a session directly
    const { data: sessionData, error: sessionError } = await adminClient.auth.admin.createUser({
      email: testUser.email,
      email_confirm: true,
      user_metadata: testUser.user_metadata || {}
    });

    if (sessionError) {
      console.log('User might already exist, trying to get existing user...');
      
      // Try to generate a token for existing user
      const { data: tokenData, error: tokenError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: testUser.email
      });
      
      if (tokenError) {
        console.error('❌ Error generating recovery link:', tokenError);
        return;
      }
      
      console.log('✅ Generated recovery link');
      
      // For testing purposes, let's use a different approach
      // We'll create a JWT token manually using the service role
      const jwt = require('jsonwebtoken');
      
      // Create a JWT token that mimics what Supabase would create
      const payload = {
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        sub: testUser.id,
        email: testUser.email,
        role: 'authenticated',
        iat: Math.floor(Date.now() / 1000)
      };
      
      // Use the JWT secret from Supabase (this is just for testing)
      const accessToken = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET || 'your-jwt-secret');
      
      console.log(`✅ Created test JWT token: ${accessToken.substring(0, 30)}...`);
    } else {
      console.log('✅ Created new user session');
      // Extract token from session if available
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        console.error('❌ No access token in session');
        return;
      }
      
      console.log(`✅ Extracted access token: ${accessToken.substring(0, 30)}...`);
    }

    // Step 3: Verify the token works with the user client
    console.log('🔍 Verifying token with user client...');
    
    const { data: { user }, error: userError } = await userClient.auth.getUser(accessToken);
    
    if (userError || !user) {
      console.error('❌ Token verification failed:', userError);
      return;
    }

    console.log(`✅ Token verified! User: ${user.email}`);

    // Step 4: Get user's agents
    const { data: agents } = await adminClient
      .from('portal_agents')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (agents.length === 0) {
      console.error('❌ No agents found for user');
      return;
    }

    const testAgent = agents[0];
    console.log(`🤖 Found agent: ${testAgent.name} (${testAgent.id})`);

    // Step 5: Test the chat API with the real token
    console.log('\n🚀 Testing chat API with REAL user token...');
    
    const chatResponse = await fetch('http://localhost:3000/api/agents/' + testAgent.id + '/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}` // Use the REAL user token
      },
      body: JSON.stringify({
        message: 'Hello! This is a test message with REAL authentication.',
        messages: []
      })
    });

    console.log(`📡 Chat API response status: ${chatResponse.status}`);

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat API SUCCESS!');
      console.log('📝 Response:', JSON.stringify(chatData, null, 2));
      
      // Test the debug endpoint too
      console.log('\n🔍 Testing debug endpoint with real token...');
      const debugResponse = await fetch('http://localhost:3000/api/debug-session', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const debugData = await debugResponse.json();
      console.log('Debug response:', JSON.stringify(debugData, null, 2));
      
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

testRealAuth(); 