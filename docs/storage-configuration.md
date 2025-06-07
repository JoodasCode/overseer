# Storage Configuration Guide

This document outlines the environment variables and configuration options for the Overseer storage system.

## Environment Variables

### General Storage Configuration
- `STORAGE_PROVIDER` — Selects storage backend (`LOCAL` or `S3`).
- `MAX_FILE_SIZE_BYTES` — Maximum allowed file size for uploads (in bytes).

### Local Storage Configuration
- `LOCAL_STORAGE_PATH` — Path for local filesystem storage (default: './storage').

### AWS S3 Configuration
- `S3_BUCKET_NAME` — AWS S3 bucket name.
- `S3_REGION` — AWS region for the S3 bucket.
- `S3_ACCESS_KEY` — AWS access key ID.
- `S3_SECRET_KEY` — AWS secret access key.
- `S3_ENDPOINT` — Optional custom endpoint for S3-compatible storage.

## Usage Examples

### Local Storage Configuration
```
STORAGE_PROVIDER=LOCAL
LOCAL_STORAGE_PATH=./storage
MAX_FILE_SIZE_BYTES=10485760  # 10MB
```

### AWS S3 Configuration
```
STORAGE_PROVIDER=S3
S3_BUCKET_NAME=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY=your-access-key-id
S3_SECRET_KEY=your-secret-access-key
MAX_FILE_SIZE_BYTES=104857600  # 100MB
```

### S3-Compatible Storage (e.g., MinIO, DigitalOcean Spaces)
```
STORAGE_PROVIDER=S3
S3_BUCKET_NAME=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY=your-access-key-id
S3_SECRET_KEY=your-secret-access-key
S3_ENDPOINT=https://your-endpoint-url
MAX_FILE_SIZE_BYTES=104857600  # 100MB
```

## Implementation Details

The storage system uses a factory pattern to create the appropriate storage provider based on the `STORAGE_PROVIDER` environment variable. The factory is implemented in `/lib/storage/index.ts` and returns a singleton instance of the `StorageService` class.

All API endpoints use the `getStorageService()` function to access the storage service, ensuring consistent configuration across the application.
