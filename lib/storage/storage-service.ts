/**
 * Storage Service
 * 
 * Handles file storage operations for the Overseer platform.
 * Following Airbnb Style Guide for code formatting.
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  StorageConfig,
  StorageProvider,
  FileMetadata,
  UploadOptions,
  PresignedUrlOptions,
  StorageStats,
} from './types';
import { S3Provider } from './s3-provider';
import { ErrorHandler } from '../error-handler';
import prisma from '../db/prisma';

// Default options
const DEFAULT_UPLOAD_OPTIONS: UploadOptions = {
  isPublic: false,
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['*/*'],
};

const DEFAULT_PRESIGNED_URL_OPTIONS: PresignedUrlOptions = {
  expiresInSeconds: 3600, // 1 hour
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
};

export class StorageService {
  private config: StorageConfig;
  private s3Provider?: S3Provider;
  private errorHandler: ErrorHandler;

  constructor(config: StorageConfig, errorHandler: ErrorHandler) {
    this.config = config;
    this.errorHandler = errorHandler;

    // Initialize the appropriate client based on the provider
    if (config.provider === StorageProvider.S3) {
      this.s3Provider = new S3Provider(config, errorHandler);
    } else if (config.provider === StorageProvider.LOCAL) {
      // Ensure the local storage directory exists
      if (config.localPath) {
        fs.mkdirSync(config.localPath, { recursive: true });
      } else {
        throw new Error('Local storage path not specified');
      }
    }
  }

  /**
   * Upload a file to storage
   * 
   * @param file - The file buffer to upload
   * @param fileName - The name of the file
   * @param mimeType - The MIME type of the file
   * @param ownerId - The ID of the file owner
   * @param options - Upload options
   * @returns The metadata of the uploaded file
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    mimeType: string,
    ownerId: string,
    options: UploadOptions = {},
  ): Promise<FileMetadata> {
    try {
      // Merge with default options
      const mergedOptions = { ...DEFAULT_UPLOAD_OPTIONS, ...options };
      
      // Validate file size
      if (file.length > mergedOptions.maxSizeBytes!) {
        throw new Error(`File size exceeds the maximum allowed size of ${mergedOptions.maxSizeBytes} bytes`);
      }

      // Validate MIME type if specific types are allowed
      if (
        mergedOptions.allowedMimeTypes!.length > 0 && 
        mergedOptions.allowedMimeTypes![0] !== '*/*' && 
        !mergedOptions.allowedMimeTypes!.includes(mimeType)
      ) {
        throw new Error(`File type ${mimeType} is not allowed`);
      }

      // Generate a unique ID for the file
      const fileId = uuidv4();
      
      // Create a safe file path
      const safeName = this.sanitizeFileName(fileName);
      const filePath = `${ownerId}/${fileId}/${safeName}`;
      
      // Upload the file based on the provider
      let url: string | undefined;
      
      if (this.config.provider === StorageProvider.LOCAL) {
        await this.uploadToLocalStorage(file, filePath);
      } else if (this.config.provider === StorageProvider.S3) {
        url = await this.uploadToS3(file, filePath, mimeType, mergedOptions.isPublic);
      }

      // Create file metadata
      const metadata: FileMetadata = {
        id: fileId,
        name: fileName,
        size: file.length,
        mimeType,
        path: filePath,
        url,
        provider: this.config.provider,
        ownerId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: mergedOptions.isPublic!,
        metadata: mergedOptions.metadata,
      };

      // Save metadata to database
      await prisma.file.create({
        data: {
          id: metadata.id,
          name: metadata.name,
          size: metadata.size,
          mimeType: metadata.mimeType,
          path: metadata.path,
          url: metadata.url,
          provider: metadata.provider,
          ownerId: metadata.ownerId,
          isPublic: metadata.isPublic,
          metadata: metadata.metadata as any,
        },
      });

      return metadata;
    } catch (error) {
      this.errorHandler.handle({
        error: error as Error,
        source: 'StorageService.uploadFile',
        message: `Failed to upload file ${fileName}`,
        userId: ownerId,
      });
      throw error;
    }
  }

  /**
   * Get a file from storage
   * 
   * @param fileId - The ID of the file to get
   * @param ownerId - The ID of the file owner (for access control)
   * @returns The file buffer and metadata
   */
  async getFile(fileId: string, ownerId: string): Promise<{ buffer: Buffer; metadata: FileMetadata }> {
    try {
      // Get file metadata from database
      const fileRecord = await prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!fileRecord) {
        throw new Error(`File with ID ${fileId} not found`);
      }

      // Check access permissions
      if (fileRecord.ownerId !== ownerId && !fileRecord.isPublic) {
        throw new Error('Access denied');
      }

      // Convert database record to FileMetadata
      const metadata: FileMetadata = {
        id: fileRecord.id,
        name: fileRecord.name,
        size: fileRecord.size,
        mimeType: fileRecord.mimeType,
        path: fileRecord.path,
        url: fileRecord.url || undefined,
        provider: fileRecord.provider as StorageProvider,
        ownerId: fileRecord.ownerId,
        createdAt: fileRecord.createdAt,
        updatedAt: fileRecord.updatedAt,
        isPublic: fileRecord.isPublic,
        metadata: fileRecord.metadata as Record<string, any> || {},
      };

      // Get the file based on the provider
      let buffer: Buffer;
      
      if (metadata.provider === StorageProvider.LOCAL) {
        buffer = await this.getFromLocalStorage(metadata.path);
      } else if (metadata.provider === StorageProvider.S3) {
        buffer = await this.getFromS3(metadata.path);
      } else {
        throw new Error(`Unsupported storage provider: ${metadata.provider}`);
      }

      return { buffer, metadata };
    } catch (error) {
      this.errorHandler.handle({
        error: error as Error,
        source: 'StorageService.getFile',
        message: `Failed to get file with ID ${fileId}`,
        userId: ownerId,
      });
      throw error;
    }
  }

  /**
   * Delete a file from storage
   * 
   * @param fileId - The ID of the file to delete
   * @param ownerId - The ID of the file owner (for access control)
   * @returns True if the file was deleted successfully
   */
  async deleteFile(fileId: string, ownerId: string): Promise<boolean> {
    try {
      // Get file metadata from database
      const fileRecord = await prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!fileRecord) {
        throw new Error(`File with ID ${fileId} not found`);
      }

      // Check access permissions
      if (fileRecord.ownerId !== ownerId) {
        throw new Error('Access denied');
      }

      // Delete the file based on the provider
      if (fileRecord.provider === StorageProvider.LOCAL) {
        await this.deleteFromLocalStorage(fileRecord.path);
      } else if (fileRecord.provider === StorageProvider.S3) {
        await this.deleteFromS3(fileRecord.path);
      }

      // Delete metadata from database
      await prisma.file.delete({
        where: { id: fileId },
      });

      return true;
    } catch (error) {
      this.errorHandler.handle({
        error: error as Error,
        source: 'StorageService.deleteFile',
        message: `Failed to delete file with ID ${fileId}`,
        userId: ownerId,
      });
      throw error;
    }
  }

  /**
   * Generate a presigned URL for direct file upload
   * 
   * @param fileName - The name of the file to upload
   * @param ownerId - The ID of the file owner
   * @param options - Presigned URL options
   * @returns The presigned URL and file ID
   */
  async generatePresignedUploadUrl(
    fileName: string,
    ownerId: string,
    options: PresignedUrlOptions = {},
  ): Promise<{ url: string; fileId: string; fields?: Record<string, string>; expiresAt: Date }> {
    try {
      // Only supported for S3 provider
      if (this.config.provider !== StorageProvider.S3) {
        throw new Error('Presigned URLs are only supported for S3 storage');
      }

      if (!this.s3Provider) {
        throw new Error('S3 provider not initialized');
      }

      // Merge with default options
      const mergedOptions = { ...DEFAULT_PRESIGNED_URL_OPTIONS, ...options };
      
      // Generate presigned URL using the S3 provider
      return this.s3Provider.generatePresignedUploadUrl(fileName, ownerId, mergedOptions);
    } catch (error) {
      this.errorHandler.handle({
        error: error as Error,
        source: 'StorageService.generatePresignedUploadUrl',
        message: `Failed to generate presigned URL for file ${fileName}`,
        userId: ownerId,
      });
      throw error;
    }
  }

  /**
   * Get storage statistics for a user
   * 
   * @param ownerId - The ID of the user
   * @returns Storage statistics
   */
  async getStorageStats(ownerId: string): Promise<StorageStats> {
    try {
      // Get all files for the user
      const files = await prisma.file.findMany({
        where: { ownerId },
      });

      // Calculate statistics
      const totalFiles = files.length;
      const totalSize = files.reduce((sum: number, file) => sum + file.size, 0);
      
      // Calculate usage by provider
      const usageByProvider = files.reduce((acc: Record<string, number>, file) => {
        const provider = file.provider as StorageProvider;
        acc[provider] = (acc[provider] || 0) + file.size;
        return acc;
      }, {} as Record<string, number>);
      
      // Calculate usage by MIME type
      const usageByMimeType = files.reduce((acc: Record<string, number>, file) => {
        acc[file.mimeType] = (acc[file.mimeType] || 0) + file.size;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalFiles,
        totalSize,
        usageByProvider,
        usageByMimeType,
      };
    } catch (error) {
      this.errorHandler.handle({
        error: error as Error,
        source: 'StorageService.getStorageStats',
        message: 'Failed to get storage statistics',
        userId: ownerId,
      });
      throw error;
    }
  }

  // Private helper methods

  /**
   * Upload a file to local storage
   * 
   * @param file - The file buffer to upload
   * @param filePath - The path to save the file to
   */
  private async uploadToLocalStorage(file: Buffer, filePath: string): Promise<void> {
    const fullPath = path.join(this.config.localPath!, filePath);
    const directory = path.dirname(fullPath);
    
    // Create directory if it doesn't exist
    fs.mkdirSync(directory, { recursive: true });
    
    // Write file
    await fs.promises.writeFile(fullPath, file);
  }

  /**
   * Get a file from local storage
   * 
   * @param filePath - The path of the file to get
   * @returns The file buffer
   */
  private async getFromLocalStorage(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.config.localPath!, filePath);
    return fs.promises.readFile(fullPath);
  }

  /**
   * Delete a file from local storage
   * 
   * @param filePath - The path of the file to delete
   */
  private async deleteFromLocalStorage(filePath: string): Promise<void> {
    const fullPath = path.join(this.config.localPath!, filePath);
    await fs.promises.unlink(fullPath);
  }

  /**
   * Upload a file to S3
   * 
   * @param file - The file buffer to upload
   * @param filePath - The path to save the file to
   * @param mimeType - The MIME type of the file
   * @param isPublic - Whether the file should be publicly accessible
   * @returns The URL of the uploaded file
   */
  private async uploadToS3(
    file: Buffer,
    filePath: string,
    mimeType: string,
    isPublic: boolean = false,
  ): Promise<string> {
    if (!this.s3Provider) {
      throw new Error('S3 provider not initialized');
    }
    
    return this.s3Provider.uploadFile(file, filePath, mimeType);
  }

  /**
   * Get a file from S3
   * 
   * @param filePath - The path of the file to get
   * @returns The file buffer
   */
  private async getFromS3(filePath: string): Promise<Buffer> {
    if (!this.s3Provider) {
      throw new Error('S3 provider not initialized');
    }
    
    return this.s3Provider.getFile(filePath);
  }

  /**
   * Delete a file from S3
   * 
   * @param filePath - The path of the file to delete
   */
  private async deleteFromS3(filePath: string): Promise<void> {
    if (!this.s3Provider) {
      throw new Error('S3 provider not initialized');
    }
    
    const success = await this.s3Provider.deleteFile(filePath);
    if (!success) {
      throw new Error(`Failed to delete file from S3: ${filePath}`);
    }
  }

  /**
   * Sanitize a file name to prevent path traversal attacks
   * 
   * @param fileName - The file name to sanitize
   * @returns The sanitized file name
   */
  private sanitizeFileName(fileName: string): string {
    // Remove path traversal characters and normalize
    return fileName
      .replace(/\.\.\//g, '')
      .replace(/\\/g, '')
      .replace(/\//g, '')
      .replace(/[^\w.-]/g, '_');
  }
}
