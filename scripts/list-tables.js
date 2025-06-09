const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

async function listTables() {
  console.log('📋 Listing database tables...');
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // List all tables in the public schema
    const { data: tables, error: tablesError } = await supabase
      .rpc('list_tables');

    if (tablesError) {
      console.log('❌ Could not list tables with RPC, trying direct query...');
      
      // Try a different approach - query the information schema
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (schemaError) {
        console.error('❌ Error querying schema:', schemaError);
        
        // Try yet another approach - list some common table names
        const commonTables = ['Agent', 'agents', 'User', 'users', 'Task', 'tasks', 'AgentMemory', 'agent_memory'];
        
        console.log('\n🔍 Testing common table names...');
        for (const tableName of commonTables) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (!error) {
              console.log(`✅ Table exists: ${tableName}`);
              console.log(`   Sample columns: ${Object.keys(data[0] || {}).join(', ')}`);
            }
          } catch (e) {
            // Table doesn't exist or access denied
          }
        }
      } else {
        console.log('✅ Found tables:');
        schemaData?.forEach(table => {
          console.log(`  - ${table.table_name}`);
        });
      }
    } else {
      console.log('✅ Found tables:', tables);
    }

  } catch (error) {
    console.error('❌ Error listing tables:', error);
  }
}

// Run the function
if (require.main === module) {
  listTables()
    .then(() => {
      console.log('\n✅ Table listing complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Table listing failed:', error);
      process.exit(1);
    });
}

module.exports = { listTables }; 