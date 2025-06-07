const { PrismaClient } = require('@prisma/client');

/**
 * Apply schema updates directly using Prisma Client
 */
async function updateSchema() {
  try {
    console.log('Starting schema update process...');
    
    // Initialize Prisma client
    const prisma = new PrismaClient();
    
    // Execute raw SQL to add the new columns
    const queries = [
      // Add role column if it doesn't exist
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user'`,
      
      // Add api_keys column if it doesn't exist
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "api_keys" JSONB NOT NULL DEFAULT '[]'`,
      
      // Add api_key_metadata column if it doesn't exist
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "api_key_metadata" JSONB NOT NULL DEFAULT '[]'`,
      
      // Add index on role for faster role-based queries
      `CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role")`
    ];
    
    // Execute each query
    for (const sql of queries) {
      console.log(`Executing: ${sql}`);
      await prisma.$executeRawUnsafe(sql);
      console.log('Query executed successfully');
    }
    
    console.log('Schema update completed successfully!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Schema update failed:', error);
    process.exit(1);
  }
}

// Execute the schema update
updateSchema().catch(console.error);
