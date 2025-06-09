// Test how Prisma loads environment variables
console.log('🔧 Prisma Environment Loading Test');
console.log('=====================================');

// Prisma uses dotenv by default, similar to Next.js
// Next.js loads in this order: .env.local > .env

console.log('\n📋 Environment File Loading Order:');
console.log('1. .env.local (highest priority)');
console.log('2. .env (lower priority)');

// Clear environment first
delete process.env.DATABASE_URL;
delete process.env.DIRECT_URL;

// Load .env first (like Prisma does)
console.log('\n🔄 Loading .env first:');
require('dotenv').config({ path: '.env' });
console.log('DATABASE_URL from .env:', process.env.DATABASE_URL ? 'Set' : 'Not set');
if (process.env.DATABASE_URL) {
  console.log('Quoted?', process.env.DATABASE_URL.startsWith('"') ? 'Yes' : 'No');
}

// Then load .env.local (which overwrites)
console.log('\n🔄 Loading .env.local (overwrites):');
require('dotenv').config({ path: '.env.local' });
console.log('DATABASE_URL from .env.local:', process.env.DATABASE_URL ? 'Set' : 'Not set');
if (process.env.DATABASE_URL) {
  console.log('Quoted?', process.env.DATABASE_URL.startsWith('"') ? 'Yes' : 'No');
  console.log('First 50 chars:', process.env.DATABASE_URL.substring(0, 50) + '...');
}

// Now test Prisma connection with this environment
console.log('\n🗄️ Testing Prisma with loaded environment:');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['info', 'warn', 'error']
});

async function testPrismaConnection() {
  try {
    console.log('🔗 Attempting Prisma connection...');
    await prisma.$connect();
    console.log('✅ Prisma connection successful!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message);
    // Check if it's a URL parsing issue
    if (error.message.includes('Invalid connection string')) {
      console.log('🚨 This looks like a URL parsing issue!');
    }
    await prisma.$disconnect();
  }
}

testPrismaConnection(); 