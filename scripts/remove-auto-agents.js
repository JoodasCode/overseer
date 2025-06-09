const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function removeAutoCreatedAgents() {
  console.log('🧹 Removing auto-created Communications Department agents...');
  console.log('📝 Restoring proper hire-first workflow...\n');
  
  try {
    // Find agents with communications department metadata
    const { data: agents, error: selectError } = await supabase
      .from('Agent')
      .select('id, name, description, created_at')
      .contains('metadata', { department: 'communications' });
      
    if (selectError) {
      console.error('❌ Error finding agents:', selectError);
      return;
    }
    
    if (!agents || agents.length === 0) {
      console.log('✅ No auto-created agents found to remove');
      console.log('👤 System is ready for individual agent hiring\n');
      return;
    }
    
    console.log(`📋 Found ${agents.length} auto-created agents:`);
    agents.forEach((agent, i) => {
      console.log(`${i + 1}. ${agent.name} - ${agent.description?.slice(0, 50)}...`);
    });
    console.log('');
    
    // Remove the auto-created agents
    const { error: deleteError } = await supabase
      .from('Agent')
      .delete()
      .contains('metadata', { department: 'communications' });
      
    if (deleteError) {
      console.error('❌ Error removing agents:', deleteError);
    } else {
      console.log('✅ Successfully removed auto-created Communications Department agents');
      console.log('👤 Users can now hire agents individually through the "Hire Agent" modal');
      console.log('🏗️ Department views will be dynamically generated from hired agents');
      console.log('🔧 Team collaboration happens through Workflow Builder\n');
      
      console.log('🎯 Correct Flow Restored:');
      console.log('   1. User clicks "Hire Agent"');
      console.log('   2. User selects agent template (Alex, Dana, etc.)');
      console.log('   3. User customizes and optionally assigns department');
      console.log('   4. Agent appears in their personal workforce');
      console.log('   5. Department views auto-generate from hired agents');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the cleanup
removeAutoCreatedAgents(); 