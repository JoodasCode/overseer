#!/usr/bin/env node

/**
 * Overseer Supabase Key Update Script
 * Updates the .env file with the correct Supabase service role key
 */

const fs = require('fs');
const path = require('path');

// Supabase credentials
const SUPABASE_URL = 'https://rxchyyxsipdopwpwnxku.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Y2h5eXhzaXBkb3B3cHdueGt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE0MDc5NywiZXhwIjoyMDY0NzE2Nzk3fQ.MgQ-4KEXstx6pKx7KPoFu7-OXMGAf7ktxr6o4FZl3hI';

// Database URL construction
const DATABASE_URL = `postgresql://postgres:${SUPABASE_SERVICE_KEY}@db.rxchyyxsipdopwpwnxku.supabase.co:5432/postgres?schema=public`;

// Path to .env file
const envPath = path.join(process.cwd(), '.env');

// Check if .env file exists and read its content
let envContent = '';
if (fs.existsSync(envPath)) {
  console.log('Existing .env file found. Updating with new values.');
  envContent = fs.readFileSync(envPath, 'utf8');
  
  // Parse existing environment variables
  const envVars = {};
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        envVars[key] = value;
      }
    }
  });
  
  // Update with new values
  envVars['NEXT_PUBLIC_SUPABASE_URL'] = `"${SUPABASE_URL}"`;
  envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = `"${SUPABASE_SERVICE_KEY}"`;
  envVars['DATABASE_URL'] = `"${DATABASE_URL}"`;
  
  // Rebuild env content
  envContent = '# Overseer Environment Variables\n';
  envContent += '# Updated on ' + new Date().toISOString() + '\n\n';
  
  Object.entries(envVars).forEach(([key, value]) => {
    envContent += `${key}=${value}\n`;
  });
} else {
  console.log('No .env file found. Creating new file.');
  envContent = '# Overseer Environment Variables\n';
  envContent += '# Created on ' + new Date().toISOString() + '\n\n';
  envContent += `NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"\n`;
  envContent += `NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_SERVICE_KEY}"\n`;
  envContent += `DATABASE_URL="${DATABASE_URL}"\n`;
  envContent += `OPENAI_API_KEY="sk-placeholder-add-your-key-here"\n`;
  envContent += `NEXTAUTH_URL="http://localhost:3000"\n`;
  envContent += `NEXTAUTH_SECRET="${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}"\n`;
}

// Write to .env file
fs.writeFileSync(envPath, envContent, 'utf8');
console.log('✅ Environment variables updated with service role key');
console.log('The following variables have been set:');
console.log(`- NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL}`);
console.log(`- NEXT_PUBLIC_SUPABASE_ANON_KEY: [SERVICE ROLE KEY]`);
console.log(`- DATABASE_URL: [UPDATED WITH SERVICE ROLE KEY]`);
