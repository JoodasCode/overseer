#!/usr/bin/env ts-node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

/**
 * Apply all migration files in the migrations directory
 */
async function applyMigrations() {
  try {
    console.log('Starting migration process...');
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../lib/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter((file: string) => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations run in order
    
    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }
    
    console.log(`Found ${files.length} migration files to process.`);
    
    // Process each migration file
    for (const file of files) {
      console.log(`Processing migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`Error applying migration ${file}:`, error);
        throw error;
      }
      
      console.log(`Successfully applied migration: ${file}`);
    }
    
    console.log('All migrations applied successfully!');
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  }
}

// Execute the migrations
applyMigrations().catch(console.error);

module.exports = { applyMigrations };
