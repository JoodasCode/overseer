#!/usr/bin/env node

/**
 * Overseer Prisma Client Generation Script
 * Generates the Prisma client for use in the application
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Generating Prisma Client ===');

try {
  // Check if the prisma directory exists
  const prismaDir = path.join(process.cwd(), 'prisma');
  if (!fs.existsSync(prismaDir)) {
    console.error('❌ Prisma directory not found');
    process.exit(1);
  }

  // Check if the schema file exists
  const schemaPath = path.join(prismaDir, 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Prisma schema file not found');
    process.exit(1);
  }

  console.log('✅ Found Prisma schema file');
  
  // Generate the Prisma client
  console.log('\n🚀 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\n✅ Prisma client generated successfully');
  console.log('\nYou can now use the Prisma client in your application:');
  console.log('import { prisma } from \'../lib/prisma\';');
  
} catch (error) {
  console.error('❌ Error generating Prisma client:', error.message);
  process.exit(1);
}
