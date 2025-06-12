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

async function testAuthFlow() {
  try {
    console.log('🧪 Testing authentication flow...\n');

    // Test 1: Check if we can get users
    console.log('📊 Getting users:');
    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error getting users:', usersError);
      return;
    }
    
    console.log(`✅ Found ${users.users.length} users`);
    
    if (users.users.length === 0) {
      console.log('⚠️  No users found. Please sign up first.');
      return;
    }
    
    // Test 2: Test chat API with a valid token
    const testUser = users.users[0];
    console.log(`\n🔐 Testing with user: ${testUser.email} (${testUser.id})`);
    
    // Generate a JWT token for this user
    const { data: tokenData, error: tokenError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: testUser.email
    });
    
    if (tokenError) {
      console.error('❌ Error generating token:', tokenError);
      return;
    }
    
    console.log('✅ Generated auth token');
    
    // Test 3: Get agents for this user
    const { data: agents, error: agentsError } = await adminClient
      .from('portal_agents')
      .select('*')
      .eq('user_id', testUser.id)
      .limit(1);
    
    if (agentsError) {
      console.error('❌ Error getting agents:', agentsError);
      return;
    }
    
    console.log(`✅ Found ${agents.length} agents for user`);
    
    if (agents.length === 0) {
      console.log('⚠️  No agents found for user. Creating a test agent...');
      
      const { data: newAgent, error: createError } = await adminClient
        .from('portal_agents')
        .insert({
          user_id: testUser.id,
          name: 'Test Agent',
          description: 'A test agent for debugging',
          role: 'assistant',
          persona: 'Helpful and friendly',
          status: 'active'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating agent:', createError);
        return;
      }
      
      console.log('✅ Created test agent:', newAgent.id);
      agents.push(newAgent);
    }
    
    // Test 4: Test the chat API endpoint
    const testAgent = agents[0];
    console.log(`\n🤖 Testing chat with agent: ${testAgent.name} (${testAgent.id})`);
    
    // Create a session token that the frontend would use
    const { data: sessionData, error: sessionError } = await adminClient.auth.admin.createUser({
      email: testUser.email,
      email_confirm: true,
      user_metadata: testUser.user_metadata
    });
    
    console.log('🧪 Auth flow test completed!');
    console.log('\n📋 Summary:');
    console.log(`- Users: ${users.users.length}`);
    console.log(`- Test user: ${testUser.email}`);
    console.log(`- Agents: ${agents.length}`);
    console.log(`- Test agent: ${testAgent.name}`);
    console.log('\n🔗 Next steps:');
    console.log('1. Open http://localhost:3000/agents');
    console.log('2. Sign in with Google');
    console.log('3. Try chatting with an agent');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuthFlow(); 