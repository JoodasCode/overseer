import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Supabase client singleton
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
