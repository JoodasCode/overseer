/**
 * Setup Supabase Storage
 * 
 * Creates storage buckets and sets up RLS policies for file management.
 * Following Airbnb Style Guide for code formatting.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorageBuckets() {
  console.log('🚀 Setting up Supabase Storage buckets...');

  // Define buckets to create
  const buckets = [
    {
      name: 'public-files',
      public: true,
      allowedMimeTypes: ['image/*', 'document/*', 'text/*', 'application/*'],
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
    },
    {
      name: 'private-files',
      public: false,
      allowedMimeTypes: ['image/*', 'document/*', 'text/*', 'application/*'],
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
    },
    {
      name: 'agent-assets',
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
    },
    {
      name: 'user-uploads',
      public: false,
      allowedMimeTypes: ['*/*'],
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
    },
  ];

  // Create buckets
  for (const bucket of buckets) {
    console.log(`📦 Creating bucket: ${bucket.name}...`);
    
    const { error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
      allowedMimeTypes: bucket.allowedMimeTypes,
      fileSizeLimit: bucket.fileSizeLimit,
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`✅ Bucket ${bucket.name} already exists`);
      } else {
        console.error(`❌ Failed to create bucket ${bucket.name}:`, error.message);
      }
    } else {
      console.log(`✅ Created bucket: ${bucket.name}`);
    }
  }
}

async function setupRLSPolicies() {
  console.log('🔐 Setting up RLS policies for storage...');

  const policies = [
    // Public files - read access for everyone, write access for authenticated users
    `
    CREATE POLICY "Public files are viewable by everyone" ON storage.objects
    FOR SELECT USING (bucket_id = 'public-files');
    `,
    `
    CREATE POLICY "Authenticated users can upload public files" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'public-files' 
      AND auth.role() = 'authenticated'
    );
    `,
    `
    CREATE POLICY "Users can update their own public files" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'public-files' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
    `,
    `
    CREATE POLICY "Users can delete their own public files" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'public-files' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
    `,

    // Private files - only accessible by file owner
    `
    CREATE POLICY "Users can view their own private files" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'private-files' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
    `,
    `
    CREATE POLICY "Users can upload their own private files" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'private-files' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
    `,
    `
    CREATE POLICY "Users can update their own private files" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'private-files' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
    `,
    `
    CREATE POLICY "Users can delete their own private files" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'private-files' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
    `,

    // Agent assets - read access for everyone, write access for file owner
    `
    CREATE POLICY "Agent assets are viewable by everyone" ON storage.objects
    FOR SELECT USING (bucket_id = 'agent-assets');
    `,
    `
    CREATE POLICY "Users can upload agent assets" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'agent-assets' 
      AND auth.role() = 'authenticated'
    );
    `,
    `
    CREATE POLICY "Users can update their own agent assets" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'agent-assets' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
    `,
    `
    CREATE POLICY "Users can delete their own agent assets" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'agent-assets' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
    `,

    // User uploads - only accessible by file owner
    `
    CREATE POLICY "Users can view their own uploads" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'user-uploads' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
    `,
    `
    CREATE POLICY "Users can upload their own files" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'user-uploads' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
    `,
    `
    CREATE POLICY "Users can update their own uploads" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'user-uploads' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
    `,
    `
    CREATE POLICY "Users can delete their own uploads" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'user-uploads' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
    `,
  ];

  // Execute policies
  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('exec', { sql: policy });
      if (error && !error.message.includes('already exists')) {
        console.error('❌ Failed to create policy:', error.message);
      }
    } catch (error: any) {
      // Most policies will fail if they already exist, which is fine
      if (!error.message?.includes('already exists')) {
        console.log('⚠️ Policy setup note:', error.message);
      }
    }
  }

  console.log('✅ RLS policies setup completed');
}

async function main() {
  try {
    console.log('🔧 Setting up Supabase Storage for Overseer...\n');

    await setupStorageBuckets();
    console.log('');
    await setupRLSPolicies();

    console.log('\n🎉 Supabase Storage setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Set STORAGE_PROVIDER=SUPABASE in your environment variables');
    console.log('2. Update your application to use Supabase Storage');
    console.log('3. Test file uploads and downloads');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
main(); 