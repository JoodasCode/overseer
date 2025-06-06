#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Overseer Migration SQL Generator');
console.log('===============================');
console.log('Generating SQL migration from Prisma schema');

// Create migrations directory if it doesn't exist
const migrationsDir = path.join(process.cwd(), 'prisma/migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

try {
  // Generate Prisma Client (doesn't require database connection)
  console.log('\nGenerating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated successfully');

  // Create a temporary database URL for migration generation
  const tempDbUrl = 'postgresql://postgres:postgres@localhost:5432/postgres';
  
  // Generate migration SQL without applying it
  console.log('\nGenerating SQL migration (dry run)...');
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
  const migrationName = `migration_${timestamp}`;
  
  try {
    // This will fail because we can't connect to the database, but it will generate the SQL
    execSync(`DATABASE_URL="${tempDbUrl}" npx prisma migrate dev --name ${migrationName} --create-only`, { 
      stdio: 'inherit',
      timeout: 10000
    });
  } catch (error) {
    // This is expected to fail, but we should have the migration files
    console.log('Expected error during migration generation (this is normal)');
  }
  
  // Find the generated migration directory
  const migrationDirs = fs.readdirSync(migrationsDir);
  const latestMigration = migrationDirs
    .filter(dir => dir.includes(migrationName))
    .sort()
    .pop();
  
  if (!latestMigration) {
    throw new Error('Migration directory not found');
  }
  
  const migrationPath = path.join(migrationsDir, latestMigration);
  const sqlFilePath = path.join(migrationPath, 'migration.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    throw new Error('Migration SQL file not found');
  }
  
  // Copy the SQL to a more accessible location
  const outputSqlPath = path.join(process.cwd(), 'prisma/schema.sql');
  fs.copyFileSync(sqlFilePath, outputSqlPath);
  
  console.log(`\n✅ Migration SQL generated successfully at: ${outputSqlPath}`);
  console.log('\nNext steps:');
  console.log('1. Open the Supabase dashboard: https://app.supabase.com');
  console.log('2. Go to the SQL Editor');
  console.log(`3. Copy the contents of ${outputSqlPath}`);
  console.log('4. Run the SQL in the Supabase SQL Editor');
  console.log('\nAfter applying the migration, add this to your .env file:');
  console.log('DATABASE_URL="postgresql://postgres:fYVVOkqrPqGOgd14@db.rxchyyxsipdopwpwnxku.supabase.co:5432/postgres"');
  
} catch (error) {
  console.error('\n❌ Error generating migration SQL:', error.message);
  if (error.stdout) console.error(error.stdout.toString());
  if (error.stderr) console.error(error.stderr.toString());
  process.exit(1);
}
