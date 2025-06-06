#!/usr/bin/env node

/**
 * Overseer Supabase Connection Verification Script
 * Tests Supabase connection and provides detailed diagnostics
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

console.log('=== Overseer Supabase Connection Verification ===');
console.log(`Using Supabase URL: ${SUPABASE_URL}`);
console.log('Using Supabase Anon Key: [HIDDEN]');

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyAuth() {
  console.log('\n🔑 Verifying Supabase Authentication...');
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Supabase Auth API connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase Auth API connection failed:', error.message);
    return false;
  }
}

async function verifySchemaAccess() {
  console.log('\n📊 Verifying Supabase Schema Access...');
  try {
    // Try to list tables in the public schema
    const { data, error } = await supabase.rpc('get_tables');
    
    if (error) {
      // If the RPC function doesn't exist, try a different approach
      if (error.message.includes('does not exist')) {
        console.log('⚠️ get_tables RPC function not found, trying direct query...');
        
        // Try a raw query to list tables
        const { data: tables, error: tablesError } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public');
        
        if (tablesError) {
          throw tablesError;
        }
        
        console.log('✅ Successfully accessed database schema');
        console.log('Tables in public schema:', tables.map(t => t.tablename));
        return true;
      } else {
        throw error;
      }
    }
    
    console.log('✅ Successfully accessed database schema');
    console.log('Tables:', data);
    return true;
  } catch (error) {
    console.error('❌ Schema access failed:', error.message);
    console.log('⚠️ This may indicate that:');
    console.log('  1. Your API key does not have sufficient permissions');
    console.log('  2. The database schema has not been applied yet');
    console.log('  3. Row Level Security (RLS) is blocking access');
    return false;
  }
}

async function checkTableExistence() {
  const coreTables = ['User', 'Agent', 'AgentMemory', 'Task'];
  const results = {};
  
  console.log('\n🔍 Checking for core tables...');
  
  for (const table of coreTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count');
      
      if (error) {
        if (error.code === '42P01') { // Table doesn't exist
          results[table] = { exists: false, error: 'Table not found' };
        } else {
          results[table] = { exists: false, error: error.message };
        }
      } else {
        results[table] = { exists: true, count: data[0]?.count || 0 };
      }
    } catch (error) {
      results[table] = { exists: false, error: error.message };
    }
  }
  
  // Display results
  let tablesFound = 0;
  for (const [table, result] of Object.entries(results)) {
    if (result.exists) {
      console.log(`✅ ${table}: Found with ${result.count} records`);
      tablesFound++;
    } else {
      console.log(`❌ ${table}: ${result.error}`);
    }
  }
  
  if (tablesFound === 0) {
    console.log('\n⚠️ No core tables found. You need to apply the database schema.');
    return false;
  } else if (tablesFound < coreTables.length) {
    console.log(`\n⚠️ Only ${tablesFound}/${coreTables.length} core tables found. Schema may be incomplete.`);
    return true;
  } else {
    console.log('\n✅ All core tables found!');
    return true;
  }
}

async function verifyConnection() {
  const authSuccess = await verifyAuth();
  const schemaSuccess = await verifySchemaAccess();
  let tablesSuccess = false;
  
  if (schemaSuccess) {
    tablesSuccess = await checkTableExistence();
  }
  
  console.log('\n=== Verification Results ===');
  console.log(`Authentication: ${authSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Schema Access: ${schemaSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Core Tables: ${tablesSuccess ? '✅ FOUND' : '❌ NOT FOUND'}`);
  
  if (!authSuccess || !schemaSuccess) {
    console.log('\n⚠️ Connection verification failed. Please check:');
    console.log('1. Your Supabase URL and anon key in the .env file');
    console.log('2. That your Supabase project is active');
    console.log('3. That your API key has the necessary permissions');
  } else if (!tablesSuccess) {
    console.log('\n⚠️ Connection successful but schema not applied.');
    console.log('Please follow the instructions in SUPABASE_SETUP_GUIDE.md to apply the schema.');
  } else {
    console.log('\n🎉 Verification successful! Your Supabase connection is working correctly.');
  }
}

verifyConnection();
