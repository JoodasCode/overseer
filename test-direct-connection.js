require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Test with direct URL only
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function testDirectConnection() {
  try {
    console.log('🔗 Testing DIRECT database connection...');
    console.log('Using URL:', process.env.DIRECT_URL ? 'Direct URL configured' : 'No direct URL');
    
    await prisma.$connect();
    console.log('✅ Direct database connection successful!');
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 User count: ${userCount}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Direct database connection failed:', error.message);
    console.error('Full error:', error);
    await prisma.$disconnect();
  }
}

testDirectConnection(); 