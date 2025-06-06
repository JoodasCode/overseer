const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

function setupPrismaEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase URL or key is missing from environment variables.');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.');
    process.exit(1);
  }

  console.log('Supabase URL found:', supabaseUrl);
  
  // Extract the host from the Supabase URL
  const url = new URL(supabaseUrl);
  const host = url.hostname;
  
  // Construct the Prisma DATABASE_URL
  // Format: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
  const databaseUrl = `postgresql://postgres:${supabaseKey}@${host}:5432/postgres?schema=public`;
  
  // Create or update .env.prisma file
  const envPath = path.join(process.cwd(), '.env.prisma');
  fs.writeFileSync(envPath, `DATABASE_URL="${databaseUrl}"\n`);
  
  console.log('Prisma environment file created at .env.prisma');
  console.log('To use this file with Prisma commands, run:');
  console.log('  npx dotenv -e .env.prisma -- npx prisma migrate dev');
  console.log('  npx dotenv -e .env.prisma -- npx prisma db push');
  
  // Test the connection
  console.log('Testing Supabase connection...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  supabase.from('users').select('id').limit(1)
    .then(({ data, error }: { data: any; error: any }) => {
      if (error) {
        console.error('Error connecting to Supabase:', error.message);
        process.exit(1);
      }
      
      console.log('Successfully connected to Supabase!');
      console.log('Database URL has been configured for Prisma.');
    })
    .catch((error: any) => {
      console.error('An error occurred:', error);
      process.exit(1);
    });
}

setupPrismaEnv();

