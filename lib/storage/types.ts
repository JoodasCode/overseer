/**
 * File Storage Types
 * 
 * This file defines the types used by the file storage system.
 */

export enum StorageProvider {
  LOCAL = 'local',
  S3 = 's3',
  // Add more providers as needed
}

export interface StorageConfig {
  provider: StorageProvider;
  bucketName?: string;
  region?: string;
  endpoint?: string;
  accessKey?: string;
  secretKey?: string;
  localPath?: string;
}

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

export interface UploadOptions {
  isPublic?: boolean;
  metadata?: Record<string, any>;
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
}

export interface PresignedUrlOptions {
  expiresInSeconds?: number;
  contentType?: string;
  maxSizeBytes?: number;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  usageByProvider: Record<StorageProvider, number>;
  usageByMimeType: Record<string, number>;
}
