#!/usr/bin/env node

/**
 * Overseer Default Environment Setup Script
 * Creates or updates the .env file with necessary environment variables using default values
 */

const fs = require('fs');
const path = require('path');

// Default values
const defaults = {
  // Supabase credentials
  NEXT_PUBLIC_SUPABASE_URL: 'https://rxchyyxsipdopwpwnxku.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Y2h5eXhzaXBkb3B3cHdueGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODYwNjY4ODAsImV4cCI6MjAwMTY0Mjg4MH0.KbKP51OMX69xkGKAXvHqzW7GGlBpYy2Pw-Yx_N0Uh9Y',
  
  // Database URL
  DATABASE_URL: 'postgresql://postgres:fYVVOkqrPqGOgd14@db.rxchyyxsipdopwpwnxku.supabase.co:5432/postgres?schema=public',
  
  // OpenAI API key for AI features (placeholder)
  OPENAI_API_KEY: 'sk-placeholder-add-your-key-here',
  
  // Next.js specific
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXTAUTH_SECRET: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
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

console.log('=== Overseer Default Environment Setup ===');

// Merge existing values with defaults
const env = { ...defaults, ...existingEnv };

// Write to .env file
let envContent = '# Overseer Environment Variables\n';
envContent += '# Generated on ' + new Date().toISOString() + '\n\n';

// Add each variable
Object.entries(env).forEach(([key, value]) => {
  envContent += `${key}=${value}\n`;
});

fs.writeFileSync(envPath, envContent, 'utf8');
console.log('✅ Environment variables saved to .env file');
console.log('The following variables have been set:');
Object.keys(env).forEach(key => {
  const displayValue = key.includes('KEY') || key.includes('SECRET') ? '[HIDDEN]' : env[key];
  console.log(`- ${key}: ${displayValue}`);
});

console.log('\n⚠️ Note: If you need to customize these values, please edit the .env file directly.');
