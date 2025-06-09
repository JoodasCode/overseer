require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('🔧 Environment check:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Set' : 'Not set');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔗 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 User count: ${userCount}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
    await prisma.$disconnect();
  }
}

testConnection(); 