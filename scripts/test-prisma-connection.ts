// CommonJS syntax for better compatibility with Node.js environment
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

// Database URL from Supabase credentials
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:fYVVOkqrPqGOgd14@db.rxchyyxsipdopwpwnxku.supabase.co:5432/postgres';

// Supabase credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rxchyyxsipdopwpwnxku.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fYVVOkqrPqGOgd14';

// Initialize Prisma Client with explicit connection URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

// Test database connection
async function testConnection() {
  try {
    console.log('Testing Prisma database connection...');
    console.log(`Using database URL: ${DATABASE_URL.replace(/:[^:]*@/, ':****@')}`); // Hide password in logs
    
    // Test connection by querying the database version
    const result = await prisma.$queryRaw`SELECT version();`;
    console.log('✅ Database connection successful!');
    console.log('Database info:', result);
    
    // Try to query some tables to verify schema
    try {
      const agentCount = await prisma.agent.count();
      console.log(`✅ Agent table exists with ${agentCount} records`);
    } catch (error) {
      console.log('❌ Could not query Agent table:', error.message);
    }
    
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ User table exists with ${userCount} records`);
    } catch (error) {
      console.log('❌ Could not query User table:', error.message);
    }
    
    try {
      const taskCount = await prisma.task.count();
      console.log(`✅ Task table exists with ${taskCount} records`);
    } catch (error) {
      console.log('❌ Could not query Task table:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log(`Using Supabase URL: ${SUPABASE_URL}`);
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Try a simple query to test connection
    const { data, error } = await supabase.from('User').select('count');
    
    if (error) {
      if (error.code === '42P01') { // Table doesn't exist yet
        console.log('⚠️ User table not found - this is expected if you haven\'t applied the schema yet');
      } else {
        throw error;
      }
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('Data:', data);
    }
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
  }
}

// Run tests
async function runTests() {
  console.log('=== Overseer Database Connection Tests ===');
  await testConnection();
  await testSupabaseConnection();
  console.log('=== Tests completed ===');
}

runTests();
