#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Overseer Database Setup Script');
console.log('==============================');
console.log('Setting up Prisma with the provided Supabase credentials');

// Try different connection formats
const connectionFormats = [
  // Format 1: Standard PostgreSQL format
  'postgresql://postgres:fYVVOkqrPqGOgd14@db.rxchyyxsipdopwpwnxku.supabase.co:5432/postgres',
  
  // Format 2: Alternative format with postgres protocol
  'postgres://postgres:fYVVOkqrPqGOgd14@db.rxchyyxsipdopwpwnxku.supabase.co:5432/postgres',
  
  // Format 3: With schema specified
  'postgresql://postgres:fYVVOkqrPqGOgd14@db.rxchyyxsipdopwpwnxku.supabase.co:5432/postgres?schema=public',
  
  // Format 4: With SSL mode
  'postgresql://postgres:fYVVOkqrPqGOgd14@db.rxchyyxsipdopwpwnxku.supabase.co:5432/postgres?sslmode=require',
];

// Create a temporary .env.prisma file in the project root
const tempEnvPath = path.join(process.cwd(), '.env.prisma.temp');

// Generate Prisma client first (this doesn't require a connection)
console.log('\nGenerating Prisma Client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated successfully');
} catch (error) {
  console.error('❌ Error generating Prisma Client:', error.message);
  process.exit(1);
}

// Try each connection format
let success = false;
for (const databaseUrl of connectionFormats) {
  console.log(`\nTrying connection with: ${databaseUrl.substring(0, 40)}...`);
  
  try {
    // Create temporary env file
    fs.writeFileSync(tempEnvPath, `DATABASE_URL="${databaseUrl}"\n`);
    
    // Try to push the schema
    console.log('Pushing schema to database...');
    execSync(`npx dotenv -e .env.prisma.temp -- npx prisma db push --accept-data-loss`, { 
      stdio: 'inherit',
      timeout: 30000 // 30 second timeout
    });
    
    console.log(`\n✅ Database setup completed successfully with connection: ${databaseUrl.substring(0, 40)}...`);
    console.log('\nNext steps:');
    console.log('1. Add the following to your .env file:');
    console.log(`DATABASE_URL="${databaseUrl}"`);
    console.log('2. Import the Prisma client in your code:');
    console.log('   import { prisma } from \'../lib/prisma\';');
    
    success = true;
    break;
  } catch (error) {
    console.error(`❌ Failed with this connection string: ${error.message}`);
  }
}

// Clean up temporary file
if (fs.existsSync(tempEnvPath)) {
  fs.unlinkSync(tempEnvPath);
}

if (!success) {
  console.error('\n❌ All connection attempts failed. Please check your Supabase credentials and network connectivity.');
  console.error('You may need to enable direct database connections in your Supabase project settings.');
  console.error('\nAlternative approach:');
  console.error('1. Try connecting through the Supabase dashboard');
  console.error('2. Run SQL migrations manually through the SQL editor');
  process.exit(1);
}
