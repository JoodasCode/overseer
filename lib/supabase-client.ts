import { createClient } from '@supabase/supabase-js';

// Get environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Comprehensive validation
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. This is required for client-side authentication.');
}

// Validate URL format
if (!supabaseUrl.includes('supabase.co')) {
  throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format. Should be https://[project-id].supabase.co');
}

// Validate key format (should be JWT)
if (!supabaseAnonKey.startsWith('eyJ')) {
  throw new Error('Invalid NEXT_PUBLIC_SUPABASE_ANON_KEY format. Should be a JWT token starting with "eyJ"');
}

console.log('🔧 Supabase client configuration:', {
  url: supabaseUrl,
  keyPresent: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey.substring(0, 10) + '...'
});

// Supabase client singleton with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

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
