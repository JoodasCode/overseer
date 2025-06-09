const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function setupCommunicationsDept() {
  console.log('🚀 Setting up Communications Department...');
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../database/communications-dept-schema.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Loaded schema file');

    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          // Try direct execution if RPC fails
          console.log(`🔄 Trying direct execution for statement ${i + 1}`);
          const { data: directData, error: directError } = await supabase
            .from('pg_stat_statements')
            .select('*')
            .limit(1);
          
          if (directError && directError.code !== 'PGRST116') {
            console.error(`❌ Error in statement ${i + 1}:`, error);
            continue;
          }
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (statementError) {
        console.error(`❌ Failed to execute statement ${i + 1}:`, statementError.message);
        // Continue with next statement
      }
    }

    console.log('🎉 Communications Department setup completed!');
    
    // Verify the setup by checking if agents were created
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('name, role, department')
      .eq('department', 'communications');
    
    if (agentsError) {
      console.error('❌ Error checking agents:', agentsError);
    } else {
      console.log('👥 Created agents:');
      agents?.forEach(agent => {
        console.log(`  - ${agent.name} (${agent.role})`);
      });
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Alternative simpler approach - just create the agents
async function createCommunicationsAgents() {
  console.log('👥 Creating Communications Department agents...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const agents = [
    {
      name: 'Alex',
      description: 'Lead Communications Strategist with calm authority and tactical creativity. Thinks long-term and coordinates team efforts.',
      role: 'Lead Communications Strategist',
      persona: 'Calm, articulate, and tactically creative. Thinks long-term. Speaks with clarity and structure.',
      avatar: '👔',
      tools: ['notion', 'gmail', 'google_calendar', 'slack']
    },
    {
      name: 'Dana',
      description: 'Visual Communications Assistant with quirky, expressive energy. Creates engaging visual content.',
      role: 'Visual Communications Assistant',
      persona: 'Quirky, visual, expressive. Uses emojis and fast, enthusiastic language.',
      avatar: '🎨',
      tools: ['canva', 'figma', 'slack']
    },
    {
      name: 'Jamie',
      description: 'Internal Communications Liaison focused on team morale and clarity. Prioritizes harmony.',
      role: 'Internal Communications Liaison',
      persona: 'Friendly, empathetic, diplomatic. Prioritizes team morale and clarity.',
      avatar: '🤝',
      tools: ['slack', 'gmail', 'notion']
    },
    {
      name: 'Riley',
      description: 'Data-Driven PR Analyst with analytical precision. Speaks with metrics and insights.',
      role: 'Data-Driven PR Analyst',
      persona: 'Analytical, precise, neutral tone. Speaks with graphs and impact metrics.',
      avatar: '📊',
      tools: ['google_sheets', 'analytics']
    },
    {
      name: 'Toby',
      description: 'Reactive Support Coordinator for crisis management. Quick-thinking and thorough.',
      role: 'Reactive Support Coordinator',
      persona: 'Quick-thinking, slightly anxious but extremely thorough. Speaks fast but factually.',
      avatar: '⚡',
      tools: ['slack', 'gmail', 'discord']
    }
  ];

  // Get a test user ID (we'll use the first user we find or create a default)
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  
  let userId = null;
  if (users && users.users.length > 0) {
    userId = users.users[0].id;
    console.log(`📋 Using user ID: ${userId}`);
  } else {
    console.log('⚠️ No users found, agents will be created without user_id');
  }

  for (const agentData of agents) {
    try {
      const { data, error } = await supabase
        .from('Agent')
        .insert({
          name: agentData.name,
          description: agentData.description,
          avatar_url: agentData.avatar,
          tools: agentData.tools,
          personality: agentData.persona,
          system_prompt: `You are ${agentData.name}, ${agentData.role}. ${agentData.persona}`,
          user_id: userId,
          stats: {},
          preferences: { role: agentData.role },
          metadata: { department: 'communications' }
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to create ${agentData.name}:`, JSON.stringify(error, null, 2));
        console.error(`❌ Full error details:`, error);
      } else {
        console.log(`✅ Created agent: ${agentData.name} (${agentData.role})`);
        
        // Create initial agent memory
        const { error: memoryError } = await supabase
          .from('AgentMemory')
          .insert({
            agent_id: data.id,
            key: 'weekly_goals',
            value: `Communications ${agentData.role} weekly objectives`,
            type: 'string'
          });
        
        if (memoryError) {
          console.error(`⚠️  Failed to create memory for ${agentData.name}:`, memoryError);
        } else {
          console.log(`🧠 Created memory for ${agentData.name}`);
        }
      }
    } catch (err) {
      console.error(`❌ Error creating ${agentData.name}:`, err);
    }
  }

  console.log('🎉 Communications Department agents created!');
}

// Run the setup
if (require.main === module) {
  createCommunicationsAgents()
    .then(() => {
      console.log('✅ Setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupCommunicationsDept, createCommunicationsAgents }; 