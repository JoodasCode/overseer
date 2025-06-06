#!/usr/bin/env node

/**
 * Overseer SQL Generation Script
 * Generates SQL from Prisma schema for manual application in Supabase SQL Editor
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== Generating SQL from Prisma Schema ===');

try {
  // Create a temporary directory for migration
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prisma-migration-'));
  console.log(`🔧 Created temporary directory: ${tempDir}`);
  
  // Copy the schema to the temp directory
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const tempSchemaPath = path.join(tempDir, 'schema.prisma');
  fs.copyFileSync(schemaPath, tempSchemaPath);
  
  // Create a temporary .env file with a dummy DATABASE_URL
  const tempEnvPath = path.join(tempDir, '.env');
  fs.writeFileSync(tempEnvPath, 'DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"', 'utf8');
  
  // Generate migration in the temp directory
  console.log('🚀 Generating migration...');
  try {
    execSync('npx prisma migrate dev --name init --create-only', {
      cwd: tempDir,
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: 'postgresql://dummy:dummy@localhost:5432/dummy' }
    });
  } catch (error) {
    // This is expected to fail since we're using a dummy database URL
    console.log('⚠️ Expected migration failure with dummy URL (this is normal)');
  }
  
  // Find the migration directory
  const migrationDir = path.join(tempDir, 'prisma', 'migrations');
  if (!fs.existsSync(migrationDir)) {
    throw new Error('Migration directory not created');
  }
  
  // Find the latest migration
  const migrations = fs.readdirSync(migrationDir);
  if (migrations.length === 0) {
    throw new Error('No migrations found');
  }
  
  const latestMigration = migrations.sort().pop();
  const migrationPath = path.join(migrationDir, latestMigration, 'migration.sql');
  
  if (!fs.existsSync(migrationPath)) {
    throw new Error('Migration SQL file not found');
  }
  
  // Read the migration SQL
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Write SQL to file in the project
  const sqlFilePath = path.join(process.cwd(), 'prisma', 'schema.sql');
  fs.writeFileSync(sqlFilePath, migrationSQL, 'utf8');
  
  console.log(`✅ SQL generated and saved to ${sqlFilePath}`);
  console.log('\n📋 Instructions:');
  console.log('1. Open the Supabase dashboard');
  console.log('2. Navigate to the SQL Editor');
  console.log('3. Copy and paste the contents of prisma/schema.sql');
  console.log('4. Execute the SQL to create all tables and relationships');
  
  // Also create a file with RLS policies
  const rlsPoliciesPath = path.join(process.cwd(), 'prisma', 'rls_policies.sql');
  
  const rlsPolicies = `
-- Row Level Security Policies for Supabase
-- Apply these after creating the tables

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Agent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentMemory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workflow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkflowStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Integration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeBase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ErrorLog" ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view their own data" ON "User"
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update their own data" ON "User"
  FOR UPDATE USING (auth.uid() = id);

-- Agent policies
CREATE POLICY "Users can view their own agents" ON "Agent"
  FOR SELECT USING (auth.uid() = "userId");
  
CREATE POLICY "Users can create their own agents" ON "Agent"
  FOR INSERT WITH CHECK (auth.uid() = "userId");
  
CREATE POLICY "Users can update their own agents" ON "Agent"
  FOR UPDATE USING (auth.uid() = "userId");
  
CREATE POLICY "Users can delete their own agents" ON "Agent"
  FOR DELETE USING (auth.uid() = "userId");

-- AgentMemory policies
CREATE POLICY "Users can view their agents' memories" ON "AgentMemory"
  FOR SELECT USING (
    auth.uid() IN (
      SELECT "userId" FROM "Agent" WHERE id = "AgentMemory"."agentId"
    )
  );

-- Task policies
CREATE POLICY "Users can view their own tasks" ON "Task"
  FOR SELECT USING (auth.uid() = "userId");
  
CREATE POLICY "Users can create their own tasks" ON "Task"
  FOR INSERT WITH CHECK (auth.uid() = "userId");
  
CREATE POLICY "Users can update their own tasks" ON "Task"
  FOR UPDATE USING (auth.uid() = "userId");
  
CREATE POLICY "Users can delete their own tasks" ON "Task"
  FOR DELETE USING (auth.uid() = "userId");

-- Workflow policies
CREATE POLICY "Users can view their own workflows" ON "Workflow"
  FOR SELECT USING (auth.uid() = "userId");
  
CREATE POLICY "Users can create their own workflows" ON "Workflow"
  FOR INSERT WITH CHECK (auth.uid() = "userId");
  
CREATE POLICY "Users can update their own workflows" ON "Workflow"
  FOR UPDATE USING (auth.uid() = "userId");
  
CREATE POLICY "Users can delete their own workflows" ON "Workflow"
  FOR DELETE USING (auth.uid() = "userId");
`;

  fs.writeFileSync(rlsPoliciesPath, rlsPolicies, 'utf8');
  console.log(`✅ RLS policies saved to ${rlsPoliciesPath}`);
  
  // Clean up the temporary directory
  try {
    fs.rmSync(tempDir, { recursive: true });
    console.log(`🧹 Cleaned up temporary directory`);
  } catch (error) {
    console.log(`⚠️ Could not clean up temporary directory: ${error.message}`);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
