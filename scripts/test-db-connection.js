#!/usr/bin/env node

/**
 * Overseer Database Connection Test
 * Tests connection to Supabase database via Prisma client
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('=== Overseer Database Connection Test ===');
  console.log(`Database URL: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);
  
  try {
    // Test basic connection
    console.log('\n🔍 Testing database connection...');
    const dbVersion = await prisma.$queryRaw`SELECT version();`;
    console.log('✅ Successfully connected to database');
    console.log(`Database version: ${JSON.stringify(dbVersion[0].version)}`);
    
    // Check tables
    console.log('\n📋 Checking database tables...');
    
    // User table
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ User table: ${userCount} records`);
    } catch (error) {
      console.error(`❌ User table error: ${error.message}`);
    }
    
    // Agent table
    try {
      const agentCount = await prisma.agent.count();
      console.log(`✅ Agent table: ${agentCount} records`);
    } catch (error) {
      console.error(`❌ Agent table error: ${error.message}`);
    }
    
    // AgentMemory table
    try {
      const memoryCount = await prisma.agentMemory.count();
      console.log(`✅ AgentMemory table: ${memoryCount} records`);
    } catch (error) {
      console.error(`❌ AgentMemory table error: ${error.message}`);
    }
    
    // Task table
    try {
      const taskCount = await prisma.task.count();
      console.log(`✅ Task table: ${taskCount} records`);
    } catch (error) {
      console.error(`❌ Task table error: ${error.message}`);
    }
    
    // Create a test user
    console.log('\n🧪 Creating a test user...');
    try {
      const testUser = await prisma.user.upsert({
        where: { email: 'test@overseer.ai' },
        update: {},
        create: {
          email: 'test@overseer.ai',
          display_name: 'Test User',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
          preferences: { theme: 'dark', notifications: true }
        }
      });
      console.log(`✅ Test user created/updated: ${testUser.id}`);
      
      // Create a test agent for this user
      console.log('\n🤖 Creating a test agent...');
      const testAgent = await prisma.agent.upsert({
        where: {
          user_id_name: {
            user_id: testUser.id,
            name: 'Test Agent'
          }
        },
        update: {},
        create: {
          user_id: testUser.id,
          name: 'Test Agent',
          description: 'A test agent for database connectivity verification',
          tools: { enabled: ['web_search', 'calculator'] },
          preferences: { model: 'gpt-4o', temperature: 0.7 }
        }
      });
      console.log(`✅ Test agent created/updated: ${testAgent.id}`);
      
    } catch (error) {
      console.error(`❌ Error creating test data: ${error.message}`);
    }
    
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code === 'P1001') {
      console.log('\n⚠️ Cannot connect to database server. Please check:');
      console.log('1. Your DATABASE_URL in .env file');
      console.log('2. Network connectivity to the database server');
      console.log('3. Firewall settings that might be blocking the connection');
    } else if (error.code === 'P1003') {
      console.log('\n⚠️ Database schema issues. Please check:');
      console.log('1. That you have applied the schema.sql file to your database');
      console.log('2. That your Prisma schema matches the database schema');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testConnection()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
