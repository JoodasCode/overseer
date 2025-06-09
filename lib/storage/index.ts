/**
 * Storage Service Factory
 * 
 * Provides a singleton instance of the StorageService.
 * Following Airbnb Style Guide for code formatting.
 */

import { StorageService } from './storage-service';
import { getStorageConfig } from './config';
import { ErrorHandler } from '../error-handler';

// Create a singleton instance of the error handler for storage operations
const errorHandler = new ErrorHandler();

// Create a singleton instance of the storage service
let storageServiceInstance: StorageService | null = null;

/**
 * Get the storage service instance
 * 
 * @returns The storage service instance
 */
export function getStorageService(): StorageService {
  if (!storageServiceInstance) {
    const config = getStorageConfig();
    storageServiceInstance = new StorageService(config, errorHandler);
  }
  return storageServiceInstance;
}

// Export other storage-related components
export * from './types';
export * from './storage-service';
export * from './s3-provider';
export * from './supabase-provider';
export * from './config';
