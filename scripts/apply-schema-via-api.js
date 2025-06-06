#!/usr/bin/env node

/**
 * Overseer Schema Application via Supabase API
 * Applies the database schema using Supabase REST API instead of direct PostgreSQL connection
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get Supabase credentials from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Path to SQL schema file
const schemaPath = path.join(process.cwd(), 'prisma', 'schema.sql');

// Check if schema file exists
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Schema file not found:', schemaPath);
  process.exit(1);
}

// Read schema file
const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

// Split SQL into individual statements
function splitSQLStatements(sql) {
  // This is a simple split and might not handle all SQL edge cases
  return sql
    .split(';')
    .map(statement => statement.trim())
    .filter(statement => statement.length > 0)
    .map(statement => statement + ';');
}

// Execute SQL statements
async function executeSQL() {
  console.log('=== Applying Schema via Supabase API ===');
  console.log(`Using Supabase URL: ${SUPABASE_URL}`);
  
  try {
    // First, test the connection
    console.log('\n🔑 Testing Supabase connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    console.log('✅ Supabase connection successful');
    
    // Split the SQL into individual statements
    const statements = splitSQLStatements(schemaSQL);
    console.log(`\n📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    console.log('\n🚀 Executing SQL statements...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const shortStatement = statement.length > 50 ? statement.substring(0, 50) + '...' : statement;
      
      try {
        console.log(`\n[${i + 1}/${statements.length}] Executing: ${shortStatement}`);
        
        // Execute the SQL using Supabase's rpc function
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          if (error.message.includes('already exists')) {
            console.log('⚠️ Object already exists, continuing...');
            successCount++;
          } else {
            console.error(`❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log('✅ Success');
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n=== Schema Application Summary ===');
    console.log(`Total statements: ${statements.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️ Some statements failed. You may need to apply the schema manually using the Supabase SQL Editor.');
      console.log('Please refer to the SUPABASE_SETUP_GUIDE.md for instructions.');
    } else {
      console.log('\n🎉 Schema applied successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️ Schema application failed. You may need to apply the schema manually using the Supabase SQL Editor.');
    console.log('Please refer to the SUPABASE_SETUP_GUIDE.md for instructions.');
  }
}

// Execute the function
executeSQL();
