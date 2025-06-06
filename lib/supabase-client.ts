import { createClient } from '@supabase/supabase-js';

// Supabase client singleton
export const supabase = createClient(
  'https://rxchyyxsipdopwpwnxku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Y2h5eXhzaXBkb3B3cHdueGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDA3OTcsImV4cCI6MjA2NDcxNjc5N30.F3B_omEBQwwOwQCKMzk3ImXVPNh_SypgNFAVpC8eiRA'
);

/**
 * Execute a SQL query against the Supabase database
 * @param query SQL query to execute
 * @returns Query result
 */
export async function executeSQL(query: string) {
  const { data, error } = await supabase.rpc('pgexecute', { query });
  
  if (error) {
    throw new Error(`SQL execution error: ${error.message}`);
  }
  
  return data;
}

/**
 * Apply a migration to the database
 * @param name Migration name
 * @param query SQL query to execute
 * @returns Migration result
 */
export async function applyMigration(name: string, query: string) {
  console.log(`Applying migration: ${name}`);
  
  try {
    const result = await executeSQL(query);
    console.log(`Migration ${name} applied successfully`);
    return result;
  } catch (error) {
    console.error(`Migration ${name} failed:`, error);
    throw error;
  }
}
