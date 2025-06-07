/**
 * Storage Configuration
 * 
 * Defines configuration options for the storage service.
 * Following Airbnb Style Guide for code formatting.
 */

import { StorageConfig, StorageProvider } from './types';

/**
 * Get storage configuration from environment variables
 * 
 * @returns Storage configuration
 */
export function getStorageConfig(): StorageConfig {
  // Determine the storage provider from environment variables
  const provider = process.env.STORAGE_PROVIDER === 'S3' 
    ? StorageProvider.S3 
    : StorageProvider.LOCAL;

  // Common configuration
  const config: StorageConfig = {
    provider,
  };

  // Provider-specific configuration
  if (provider === StorageProvider.LOCAL) {
    config.localPath = process.env.LOCAL_STORAGE_PATH || './storage';
  } else if (provider === StorageProvider.S3) {
    config.bucketName = process.env.S3_BUCKET_NAME;
    config.region = process.env.S3_REGION || 'us-east-1';
    config.accessKeyId = process.env.S3_ACCESS_KEY;
    config.secretAccessKey = process.env.S3_SECRET_KEY;
    config.endpoint = process.env.S3_ENDPOINT; // Optional for custom S3-compatible services
  }

  return config;
}
