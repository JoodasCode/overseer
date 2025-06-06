#!/usr/bin/env node

/**
 * Overseer SQL Extraction Script
 * Extracts SQL from Prisma schema for manual application in Supabase SQL Editor
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Extracting SQL from Prisma Schema ===');

try {
  // Generate SQL from Prisma schema
  console.log('🚀 Generating SQL from Prisma schema...');
  
  // Use Prisma format command to generate SQL
  execSync('npx prisma format', { stdio: 'inherit' });
  
  // Generate SQL schema file
  const sqlOutput = execSync('npx prisma migrate sql --preview-feature', { encoding: 'utf8' });
  
  // Clean up the SQL output
  const cleanedSQL = sqlOutput
    .replace(/-- CreateEnum/g, '\n-- CreateEnum')
    .replace(/-- CreateTable/g, '\n-- CreateTable')
    .replace(/-- CreateIndex/g, '\n-- CreateIndex')
    .replace(/-- AddForeignKey/g, '\n-- AddForeignKey');
  
  // Write SQL to file
  const sqlFilePath = path.join(process.cwd(), 'prisma', 'schema.sql');
  fs.writeFileSync(sqlFilePath, cleanedSQL, 'utf8');
  
  console.log(`✅ SQL extracted and saved to ${sqlFilePath}`);
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
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
