/**
 * Storage Types - Supabase Only
 * 
 * Type definitions for the storage service using Supabase Storage.
 */

export enum StorageProvider {
  SUPABASE = 'supabase',
}

/**
 * Storage configuration for Supabase
 */
export interface StorageConfig {
  provider: StorageProvider.SUPABASE;
  supabaseUrl: string;
  supabaseKey: string;
}

/**
 * File metadata stored in the database
 */
export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  path: string;
  url?: string;
  provider: StorageProvider;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  metadata?: Record<string, any>;
}

/**
 * Options for file upload
 */
export interface UploadOptions {
  isPublic?: boolean;
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  metadata?: Record<string, any>;
}

/**
 * Options for generating presigned URLs
 */
export interface PresignedUrlOptions {
  expiresInSeconds?: number;
  maxSizeBytes?: number;
}

/**
 * Storage statistics for a user
 */
export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  mimeTypes: Record<string, { count: number; size: number }>;
}
