// Simple script to push the Prisma schema to the database
console.log('To push the Prisma schema to the database, follow these steps:');
console.log('');
console.log('1. Make sure you have set the DATABASE_URL in your .env file:');
console.log('   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=public"');
console.log('');
console.log('2. Replace [PASSWORD] with your Supabase database password (same as the anon key)');
console.log('   Replace [HOST] with your Supabase host (from the NEXT_PUBLIC_SUPABASE_URL)');
console.log('');
console.log('3. Run the following command to push the schema:');
console.log('   npx prisma db push');
console.log('');
console.log('4. To generate the Prisma client:');
console.log('   npx prisma generate');
console.log('');
console.log('Note: If you encounter any issues, try using the Supabase direct connection string:');
console.log('DATABASE_URL="postgres://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"');
