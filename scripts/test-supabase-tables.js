#!/usr/bin/env node

/**
 * Overseer Supabase Tables Test
 * Tests connection to Supabase database via Supabase JavaScript client
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
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
    const testUser = {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'test@example.com',
      role: 'user',
      api_keys: [],
      api_key_metadata: [],
      preferences: {},
      metadata: {}
    };
    
    const { data: userData, error: userError } = await supabase
      .from('User')
      .upsert(testUser)
      .select();
    
    if (userError) {
      console.error(`❌ Error creating test user: ${userError.message}`);
    } else {
      console.log('✅ Test user created successfully');
      console.log('User data:', userData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n🎉 Supabase tables test completed!');
}

testTables();
