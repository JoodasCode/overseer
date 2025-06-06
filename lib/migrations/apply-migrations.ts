import { readFileSync } from 'fs';
import { join } from 'path';
import { applyMigration } from '../supabase-client';

/**
 * Apply migrations to the database
 */
async function applyMigrations() {
  try {
    // Read and apply the core schema migration
    const coreSchemaSql = readFileSync(
      join(__dirname, '001_core_schema.sql'),
      'utf8'
    );
    
    await applyMigration('001_core_schema', coreSchemaSql);
    
    console.log('All migrations applied successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
applyMigrations();
