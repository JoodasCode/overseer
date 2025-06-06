#!/usr/bin/env node

/**
 * Overseer Database Final Setup Script
 * This script finalizes the Prisma database setup by:
 * 1. Generating the Prisma client
 * 2. Creating a local .env file with the correct database URL
 * 3. Providing instructions for manual schema application
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Supabase credentials
const SUPABASE_URL = 'https://rxchyyxsipdopwpwnxku.supabase.co';
const SUPABASE_ANON_KEY = 'fYVVOkqrPqGOgd14';

// Database URL construction
const SUPABASE_HOST = SUPABASE_URL.replace('https://', '').replace('http://', '');
const DATABASE_URL = `postgresql://postgres:${SUPABASE_ANON_KEY}@db.${SUPABASE_HOST}:5432/postgres?schema=public`;

console.log('=== Overseer Database Final Setup ===');

// Step 1: Generate Prisma client
try {
  console.log('\n📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully');
} catch (error) {
  console.error('❌ Error generating Prisma client:', error.message);
  process.exit(1);
}

// Step 2: Create or update .env file with DATABASE_URL
try {
  console.log('\n📝 Creating/updating .env file...');
  
  // Check if .env exists and read its content
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    
    // Remove existing DATABASE_URL if present
    envContent = envContent.split('\n')
      .filter(line => !line.startsWith('DATABASE_URL='))
      .join('\n');
    
    // Ensure there's a newline at the end
    if (!envContent.endsWith('\n')) {
      envContent += '\n';
    }
  }
  
  // Add the new DATABASE_URL
  envContent += `DATABASE_URL="${DATABASE_URL}"\n`;
  
  // Write the updated content back to .env
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ DATABASE_URL added to .env file');
  
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
  console.log('Please manually add the following to your .env file:');
  console.log(`DATABASE_URL="${DATABASE_URL}"`);
}

// Step 3: Provide instructions for manual schema application
console.log('\n🔧 Manual Schema Application Instructions:');
console.log('1. Open the Supabase dashboard: https://app.supabase.com');
console.log('2. Navigate to your project and go to the SQL Editor');
console.log('3. Open the generated SQL file at: prisma/schema.sql');
console.log('4. Copy the entire SQL content and paste it into the SQL Editor');
console.log('5. Execute the SQL to create all tables and relationships');

console.log('\n📋 Next Steps:');
console.log('1. Verify the database setup by running: node scripts/test-connection.js');
console.log('2. Start using Prisma client in your code by importing from lib/prisma.ts');
console.log('3. Begin implementing Phase 1 API routes using the Prisma client');

console.log('\n=== Setup Complete ===');
