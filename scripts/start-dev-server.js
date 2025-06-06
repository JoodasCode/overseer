#!/usr/bin/env node

/**
 * Overseer Development Server Starter
 * Generates Prisma client and starts the Next.js development server
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Overseer Development Server Starter ===');

try {
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found. Please run setup-default-env.js first.');
    process.exit(1);
  }
  
  // Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');
  
  // Start Next.js development server
  console.log('\n🚀 Starting Next.js development server...');
  console.log('📝 API endpoints will be available at:');
  console.log('   - http://localhost:3000/api/test-db (Database connection test)');
  console.log('   - http://localhost:3000/api/agents (Agents API)');
  console.log('   - http://localhost:3000/api/tasks (Tasks API)');
  console.log('   - http://localhost:3000/api/chat (Chat API)');
  console.log('   - http://localhost:3000/api/workflows (Workflows API)');
  console.log('\n⚠️ Press Ctrl+C to stop the server');
  
  // Execute npm run dev
  execSync('npm run dev', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
