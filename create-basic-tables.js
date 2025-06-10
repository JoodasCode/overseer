const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rxchyyxsipdopwpwnxku.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Y2h5eXhzaXBkb3B3cHdueGt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE0MDc5NywiZXhwIjoyMDY0NzE2Nzk3fQ.MgQ-4KEXstx6pKx7KPoFu7-OXMGAf7ktxr6o4FZl3hI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBasicTables() {
  try {
    console.log('🔍 Checking what tables exist...');
    
    // Try to list all tables
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.log('❌ Could not list tables:', error.message);
    } else {
      console.log('📊 Existing tables:', tables?.map(t => t.table_name) || []);
    }
    
    console.log('🚀 Creating portal_agents table directly...');
    
    // Create portal_agents table using the Supabase client
    // Since we can't use raw SQL, let's create a minimal table structure
    
    console.log('💡 Manual Solution Required:');
    console.log('');
    console.log('🔗 Open Supabase Dashboard: https://supabase.com/dashboard/project/rxchyyxsipdopwpwnxku/editor');
    console.log('');
    console.log('📝 Create the portal_agents table with this SQL:');
    console.log('');
    console.log(`
CREATE TABLE portal_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  role TEXT,
  persona TEXT,
  avatar TEXT,
  tools JSONB DEFAULT '[]',
  personality_profile JSONB DEFAULT '{}',
  memory_map JSONB DEFAULT '{}',
  task_feed JSONB DEFAULT '{}',
  level_xp INTEGER DEFAULT 0,
  efficiency_score DECIMAL(5,2) DEFAULT 100.00,
  is_active BOOLEAN DEFAULT true,
  department_type TEXT,
  status TEXT DEFAULT 'idle',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE portal_agents ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage own agents" ON portal_agents
FOR ALL USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_portal_agents_user_id ON portal_agents(user_id);
    `);
    
    console.log('');
    console.log('🎯 After creating the table, refresh your browser and the portal should work!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

createBasicTables(); 