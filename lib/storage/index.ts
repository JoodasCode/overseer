/**
 * Storage Service Factory - Supabase Only
 * 
 * Provides a singleton instance of the StorageService using Supabase Storage.
 */

import { StorageService } from './storage-service';
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
    storageServiceInstance = new StorageService(errorHandler);
  }
  return storageServiceInstance;
}

// Export other storage-related components
export * from './types';
export * from './storage-service';
