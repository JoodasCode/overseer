// Test which environment files are being loaded
console.log('🔍 Environment Loading Test');
console.log('==============================');

// Test 1: No dotenv loading (raw Node.js)
console.log('\n1️⃣ Raw Node.js environment:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Set' : 'Not set');

// Test 2: Load .env with dotenv
console.log('\n2️⃣ After loading .env with dotenv:');
require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Set' : 'Not set');

// Test 3: Check .env.local specifically
console.log('\n3️⃣ Loading .env.local specifically:');
require('dotenv').config({ path: '.env.local' });
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Set' : 'Not set');

// Test 4: Check what files exist
const fs = require('fs');
console.log('\n4️⃣ Environment files that exist:');
const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
envFiles.forEach(file => {
  console.log(`${file}:`, fs.existsSync(file) ? '✅ Exists' : '❌ Not found');
});

// Test 5: Show first few characters of DATABASE_URL (safely)
console.log('\n5️⃣ DATABASE_URL format check:');
if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  console.log('Starts with:', url.substring(0, 20) + '...');
  console.log('Contains db-pooler:', url.includes('db-pooler.supabase.co') ? '✅ Yes' : '❌ No');
  console.log('Contains pgbouncer:', url.includes('pgbouncer=true') ? '✅ Yes' : '❌ No');
}

// Test 6: Show first few characters of DIRECT_URL (safely)
console.log('\n6️⃣ DIRECT_URL format check:');
if (process.env.DIRECT_URL) {
  const url = process.env.DIRECT_URL;
  console.log('Starts with:', url.substring(0, 20) + '...');
  console.log('Contains direct db:', url.includes('db.rxchyyxsipdopwpwnxku.supabase.co') ? '✅ Yes' : '❌ No');
  console.log('Port 5432:', url.includes(':5432') ? '✅ Yes' : '❌ No');
}

console.log('\n==============================');
console.log('�� Test Complete'); 