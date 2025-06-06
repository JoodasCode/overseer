#!/usr/bin/env node

/**
 * Overseer Environment Setup Script
 * Creates or updates the .env file with necessary environment variables
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default values
const defaults = {
  // Supabase credentials
  NEXT_PUBLIC_SUPABASE_URL: 'https://rxchyyxsipdopwpwnxku.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
  
  // Database URL
  DATABASE_URL: 'postgresql://postgres:[PASSWORD]@db.rxchyyxsipdopwpwnxku.supabase.co:5432/postgres?schema=public',
  
  // OpenAI API key for AI features
  OPENAI_API_KEY: '',
  
  // Next.js specific
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXTAUTH_SECRET: '',
};

// Path to .env file
const envPath = path.join(process.cwd(), '.env');

// Check if .env file exists and read its content
let existingEnv = {};
if (fs.existsSync(envPath)) {
  console.log('Existing .env file found. Will update with new values.');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Parse existing environment variables
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
        existingEnv[key] = value;
      }
    }
  });
}

console.log('=== Overseer Environment Setup ===');
console.log('Please provide the following environment variables:');
console.log('(Press Enter to keep existing values or use defaults)\n');

// Function to prompt for input
function prompt(question, defaultValue) {
  return new Promise((resolve) => {
    const existingValue = existingEnv[question] || defaultValue;
    const displayValue = existingValue ? ` [${existingValue}]` : '';
    
    rl.question(`${question}${displayValue}: `, (answer) => {
      resolve(answer || existingValue || '');
    });
  });
}

async function setupEnv() {
  // Collect environment variables
  const env = {};
  
  // Supabase URL
  env.NEXT_PUBLIC_SUPABASE_URL = await prompt('NEXT_PUBLIC_SUPABASE_URL', defaults.NEXT_PUBLIC_SUPABASE_URL);
  
  // Supabase Anon Key
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY = await prompt('NEXT_PUBLIC_SUPABASE_ANON_KEY', defaults.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // Database URL - construct using the anon key
  const dbPassword = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const dbUrl = defaults.DATABASE_URL.replace('[PASSWORD]', dbPassword);
  env.DATABASE_URL = await prompt('DATABASE_URL', dbUrl);
  
  // OpenAI API Key
  env.OPENAI_API_KEY = await prompt('OPENAI_API_KEY', defaults.OPENAI_API_KEY);
  
  // Next.js specific
  env.NEXTAUTH_URL = await prompt('NEXTAUTH_URL', defaults.NEXTAUTH_URL);
  
  // Generate a random secret if not provided
  const randomSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  env.NEXTAUTH_SECRET = await prompt('NEXTAUTH_SECRET', existingEnv.NEXTAUTH_SECRET || randomSecret);
  
  // Write to .env file
  let envContent = '# Overseer Environment Variables\n';
  envContent += '# Generated on ' + new Date().toISOString() + '\n\n';
  
  // Add each variable
  Object.entries(env).forEach(([key, value]) => {
    envContent += `${key}=${value}\n`;
  });
  
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('\n✅ Environment variables saved to .env file');
  
  rl.close();
}

setupEnv();
