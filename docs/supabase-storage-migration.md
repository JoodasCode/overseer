# Supabase Storage Migration Guide

This document outlines the migration from AWS S3 to Supabase Storage for unified architecture and better integration.

## Overview

We've migrated from AWS S3 to Supabase Storage for several key benefits:

### **Benefits of Supabase Storage**
- **Unified Authentication**: Files automatically tied to authenticated users
- **Row Level Security**: Built-in access control for file privacy
- **CDN Integration**: Global edge distribution for fast file access
- **Cost Efficiency**: No separate AWS billing, unified Supabase pricing
- **MCP Management**: Direct control through Supabase MCP in Cursor
- **Better DX**: Single dashboard for auth, DB, storage, and edge functions

## Storage Architecture

### **Buckets Created**

1. **`public-files`** - Publicly accessible files
   - Size limit: 50MB
   - MIME types: `image/*`, `document/*`, `text/*`, `application/*`
   - Use case: Public documents, shared assets

2. **`private-files`** - User private files 
   - Size limit: 50MB
   - MIME types: `image/*`, `document/*`, `text/*`, `application/*`
   - Use case: Personal documents, private uploads

3. **`agent-assets`** - Agent profile images and assets
   - Size limit: 10MB
   - MIME types: `image/*`
   - Use case: Agent avatars, profile images

4. **`user-uploads`** - General user file uploads
   - Size limit: 50MB
   - MIME types: `*/*` (all file types)
   - Use case: Any user-generated content

### **File Organization**

Files are organized by user ID for proper access control:
```
bucket-name/
  uploads/
    {user-id}/
      {file-id}.{extension}
```

### **Access Control**

Row Level Security (RLS) policies ensure:
- Users can only access their own private files
- Public files are readable by everyone
- Only file owners can modify/delete their files
- Authentication required for uploads

## Environment Configuration

### **Environment Variables**

Update your `.env` file:

```bash
# Storage Configuration
STORAGE_PROVIDER=SUPABASE

# Supabase Configuration (should already be set)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **Supported Providers**

The storage system now supports:
- `LOCAL` - Local filesystem storage
- `S3` - AWS S3 storage (legacy)
- `SUPABASE` - Supabase Storage (recommended)

## API Changes

### **Storage Service**

The `StorageService` class now automatically detects the provider and uses the appropriate implementation:

```typescript
import { getStorageService } from '@/lib/storage';

const storageService = getStorageService();

// Upload a file (works with any provider)
const metadata = await storageService.uploadFile(
  buffer,
  fileName,
  mimeType,
  userId,
  { isPublic: false }
);

// Generate presigned URLs (S3 and Supabase only)
const presigned = await storageService.generatePresignedUploadUrl(
  fileName,
  userId,
  { expiresInSeconds: 3600 }
);
```

### **New Features**

1. **Automatic bucket selection** based on file type and visibility
2. **Enhanced security** with RLS policies
3. **CDN acceleration** for public files
4. **Better error handling** with Supabase-specific error messages

## Migration Process

### **1. Setup Storage**

Run the setup script to create buckets:

```bash
npx tsx scripts/setup-supabase-storage.ts
```

### **2. Update Environment**

Set `STORAGE_PROVIDER=SUPABASE` in your environment variables.

### **3. Test Upload/Download**

Test the new storage system:

```bash
# Start the development server
npm run dev

# Test file upload through the UI
# Upload a file via the application interface
```

### **4. Data Migration (if needed)**

If you have existing S3 files, you can migrate them using:

```typescript
// Example migration script (implement as needed)
import { S3Provider } from '@/lib/storage/s3-provider';
import { SupabaseProvider } from '@/lib/storage/supabase-provider';

async function migrateFiles() {
  const s3Provider = new S3Provider(s3Config, errorHandler);
  const supabaseProvider = new SupabaseProvider(supabaseConfig, errorHandler);
  
  // Get list of files from S3
  // Download each file
  // Upload to Supabase Storage
  // Update database records
}
```

## File URLs

### **Public Files**
```
https://your-project.supabase.co/storage/v1/object/public/public-files/path/to/file.jpg
```

### **Private Files**
```
# Signed URL (temporary access)
https://your-project.supabase.co/storage/v1/object/sign/private-files/path/to/file.jpg?token=...
```

## Best Practices

### **1. File Organization**
- Use user ID in file paths for proper access control
- Include file ID to prevent naming conflicts
- Keep file extensions for proper MIME type detection

### **2. Security**
- Always validate file types on upload
- Use appropriate buckets for public vs private files
- Implement file size limits per use case

### **3. Performance**
- Use public buckets for files that don't need access control
- Leverage CDN for frequently accessed files
- Generate signed URLs with appropriate expiration times

### **4. Error Handling**
- Handle Supabase-specific error messages
- Implement retry logic for temporary failures
- Log storage operations for debugging

## Troubleshooting

### **Common Issues**

1. **"Bucket not found" errors**
   - Run the setup script to create buckets
   - Check bucket names in configuration

2. **Access denied for file operations**
   - Verify RLS policies are properly configured
   - Check authentication state
   - Ensure file path includes user ID

3. **File size exceeded errors**
   - Check bucket file size limits
   - Implement client-side file size validation

4. **MIME type not allowed**
   - Check bucket allowed MIME types
   - Update bucket configuration if needed

### **Debugging**

Enable debug logging:

```typescript
import { ErrorHandler } from '@/lib/error-handler';

const errorHandler = new ErrorHandler();
// Check error logs for detailed information
```

## Rollback Plan

If you need to rollback to S3:

1. Set `STORAGE_PROVIDER=S3` in environment variables
2. Ensure S3 credentials are configured
3. Restart the application

The storage service will automatically switch back to S3 provider.

## Monitoring

Monitor storage usage through:

1. **Supabase Dashboard** - Storage section
2. **Application logs** - Error handler reports
3. **Database queries** - File table statistics

```sql
-- Check storage usage by user
SELECT 
  "ownerId",
  COUNT(*) as file_count,
  SUM(size) as total_size,
  provider
FROM "File" 
GROUP BY "ownerId", provider;
```

## Next Steps

After successful migration:

1. **Remove AWS S3 dependencies** (optional)
2. **Update documentation** for new file URLs
3. **Monitor performance** and adjust as needed
4. **Implement advanced features** like image transformations
5. **Set up backup strategies** for critical files

## Support

For issues with the storage migration:

1. Check the error logs in the application
2. Review Supabase Storage documentation
3. Test with the storage service directly
4. Contact the development team if needed 