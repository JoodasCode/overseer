#!/usr/bin/env node

/**
 * Overseer Supabase API Connection Test
 * Tests Supabase REST API connectivity using the JavaScript client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment or use defaults
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

console.log('=== Overseer Supabase API Connection Test ===');
console.log(`Using Supabase URL: ${SUPABASE_URL}`);
console.log('Using Supabase Anon Key: [HIDDEN]');

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth() {
  try {
    console.log('\n🔑 Testing Supabase Authentication API...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Supabase Auth API connection successful');
    console.log('Session data:', data);
    return true;
  } catch (error) {
    console.error('❌ Supabase Auth API connection failed:', error.message);
    return false;
  }
}

async function testDatabase() {
  try {
    console.log('\n📊 Testing Supabase Database API...');
    
    // Try to get the database schema information
    const { data, error } = await supabase
      .from('_prisma_migrations')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') { // Table doesn't exist yet
        console.log('⚠️ _prisma_migrations table not found - this is expected if you haven\'t applied the schema yet');
        
        // Try a different approach - check if we can list tables
        const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
        
        if (tablesError) {
          throw tablesError;
        }
        
        console.log('✅ Successfully connected to Supabase Database API');
        console.log('Available tables:', tables);
      } else {
        throw error;
      }
    } else {
      console.log('✅ Successfully connected to Supabase Database API');
      console.log('Migration data:', data);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Supabase Database API connection failed:', error.message);
    return false;
  }
}

async function testStorage() {
  try {
    console.log('\n📁 Testing Supabase Storage API...');
    
    // List storage buckets
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Successfully connected to Supabase Storage API');
    console.log('Available buckets:', data);
    return true;
  } catch (error) {
    console.error('❌ Supabase Storage API connection failed:', error.message);
    return false;
  }
}

async function runTests() {
  let authSuccess = await testAuth();
  let dbSuccess = await testDatabase();
  let storageSuccess = await testStorage();
  
  console.log('\n=== Test Results Summary ===');
  console.log(`Authentication API: ${authSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Database API: ${dbSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Storage API: ${storageSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (!authSuccess || !dbSuccess || !storageSuccess) {
    console.log('\n⚠️ Some tests failed. Please check your Supabase configuration.');
    console.log('Next steps:');
    console.log('1. Verify your Supabase URL and anon key in the .env file');
    console.log('2. Check if your Supabase project is active');
    console.log('3. Apply the database schema using the SQL Editor in the Supabase dashboard');
  } else {
    console.log('\n🎉 All tests passed! Your Supabase connection is working correctly.');
  }
}

runTests();
