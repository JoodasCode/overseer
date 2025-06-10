const { readFileSync } = require('fs');
const { join } = require('path');
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback)');
  process.exit(1);
}

// Create admin client for migrations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Execute a SQL query directly against Supabase
 */
async function executeSQL(query: string) {
  console.log('Executing SQL query...');
  
  try {
    // Use the raw SQL approach for migrations
    const { data, error } = await supabase.rpc('sql', {
      query: query
    });
    
    if (error) {
      console.error(`Error executing SQL: ${error.message}`);
      throw error;
    }
    
    console.log('✅ SQL executed successfully');
    return data;
  } catch (error) {
    console.error('❌ SQL execution error:', error);
    throw error;
  }
}

/**
 * Apply Portal Shift Phase 2 migration
 */
async function applyPortalMigration() {
  console.log('🚀 Starting Portal Shift Phase 2: Database Rewiring');
  console.log('===============================================');
  
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'lib', 'migrations', '12_portal_shift_phase2.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log(`📄 Read migration file: ${migrationPath}`);
    console.log(`📏 Migration size: ${migrationSQL.length} characters`);
    
    // Apply the migration
    await executeSQL(migrationSQL);
    
    console.log('');
    console.log('✅ Portal Shift Phase 2 migration completed successfully!');
    console.log('');
    console.log('📊 Changes applied:');
    console.log('  • Renamed tables to portal_ prefix');
    console.log('  • Added new portal-specific fields');
    console.log('  • Created portal_departments table');
    console.log('  • Created portal_agent_groups table');
    console.log('  • Created portal_knowledge_base table');
    console.log('  • Created portal_activity_log table');
    console.log('  • Created portal_notifications table');
    console.log('  • Set up Row Level Security policies');
    console.log('  • Created helper functions for activity logging');
    console.log('');
    console.log('🔄 Next steps:');
    console.log('  1. Update API routes to use new table names');
    console.log('  2. Update frontend components to use new schema');
    console.log('  3. Test the portal functionality');
    
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('  1. Check your Supabase credentials');
    console.error('  2. Ensure you have database admin permissions');
    console.error('  3. Check the migration SQL syntax');
    console.error('  4. Review Supabase dashboard for any conflicts');
    process.exit(1);
  }
}

// Run the migration
applyPortalMigration();

module.exports = { applyPortalMigration }; 