#!/usr/bin/env node

/**
 * Overseer Supabase Tables Test
 * Tests connection to Supabase database via Supabase JavaScript client
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testTables() {
  console.log('=== Overseer Supabase Tables Test ===');
  console.log(`Using Supabase URL: ${SUPABASE_URL}`);
  console.log('Using Supabase Key: [SERVICE ROLE KEY]');
  
  try {
    // Test authentication
    console.log('\n🔑 Testing Supabase authentication...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    console.log('✅ Supabase authentication successful');
    
    // Test tables
    console.log('\n📋 Checking database tables...');
    
    const tables = [
      'User',
      'Agent',
      'AgentMemory',
      'Task',
      'ChatMessage',
      'Workflow',
      'WorkflowExecution',
      'ErrorLog',
      'Integration',
      'KnowledgeBase',
      'MemoryLog'
    ];
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`❌ ${table} table error: ${error.message}`);
        } else {
          console.log(`✅ ${table} table accessible, count: ${count}`);
        }
      } catch (error) {
        console.error(`❌ ${table} table error: ${error.message}`);
      }
    }
    
    // Create a test user
    console.log('\n🧪 Creating a test user...');
    try {
      const { data: existingUsers, error: findError } = await supabase
        .from('User')
        .select('id')
        .eq('email', 'test@overseer.ai')
        .limit(1);
      
      let userId;
      
      if (findError) {
        console.error(`❌ Error checking for existing user: ${findError.message}`);
      } else if (existingUsers && existingUsers.length > 0) {
        userId = existingUsers[0].id;
        console.log(`✅ Found existing test user: ${userId}`);
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('User')
          .insert({
            email: 'test@overseer.ai',
            display_name: 'Test User',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
            preferences: { theme: 'dark', notifications: true }
          })
          .select();
        
        if (createError) {
          console.error(`❌ Error creating test user: ${createError.message}`);
        } else {
          userId = newUser[0].id;
          console.log(`✅ Created new test user: ${userId}`);
        }
      }
      
      // Create a test agent if we have a user ID
      if (userId) {
        console.log('\n🤖 Creating a test agent...');
        
        const { data: existingAgents, error: findAgentError } = await supabase
          .from('Agent')
          .select('id')
          .eq('user_id', userId)
          .eq('name', 'Test Agent')
          .limit(1);
        
        if (findAgentError) {
          console.error(`❌ Error checking for existing agent: ${findAgentError.message}`);
        } else if (existingAgents && existingAgents.length > 0) {
          console.log(`✅ Found existing test agent: ${existingAgents[0].id}`);
        } else {
          // Create new agent
          const { data: newAgent, error: createAgentError } = await supabase
            .from('Agent')
            .insert({
              user_id: userId,
              name: 'Test Agent',
              description: 'A test agent for database connectivity verification',
              tools: { enabled: ['web_search', 'calculator'] },
              preferences: { model: 'gpt-4o', temperature: 0.7 }
            })
            .select();
          
          if (createAgentError) {
            console.error(`❌ Error creating test agent: ${createAgentError.message}`);
          } else {
            console.log(`✅ Created new test agent: ${newAgent[0].id}`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error creating test data: ${error.message}`);
    }
    
    console.log('\n🎉 Supabase tables test completed!');
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
  }
}

// Run the test
testTables();
