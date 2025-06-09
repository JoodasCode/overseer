const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

async function verifyAgents() {
  console.log('✅ Verifying Communications Department agents...');
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get all agents
    const { data: agents, error: agentsError } = await supabase
      .from('Agent')
      .select('*')
      .contains('metadata', { department: 'communications' });

    if (agentsError) {
      console.error('❌ Error fetching agents:', agentsError);
      return;
    }

    if (!agents || agents.length === 0) {
      console.log('⚠️ No Communications Department agents found');
      return;
    }

    console.log(`🎯 Found ${agents.length} Communications Department agents:`);
    console.log();

    agents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name}`);
      console.log(`   Role: ${agent.preferences?.role || 'Not specified'}`);
      console.log(`   Description: ${agent.description}`);
      console.log(`   Avatar: ${agent.avatar_url}`);
      console.log(`   Tools: ${agent.tools?.join(', ') || 'None'}`);
      console.log(`   Personality: ${agent.personality}`);
      console.log(`   Created: ${new Date(agent.created_at).toLocaleString()}`);
      console.log();
    });

    // Check total agent count
    const { count, error: countError } = await supabase
      .from('Agent')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`📊 Total agents in database: ${count}`);
    }

    console.log('🎉 Communications Department setup verification complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the verification
if (require.main === module) {
  verifyAgents()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyAgents }; 