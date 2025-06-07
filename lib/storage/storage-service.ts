/**
 * Storage Service
 * 
 * This service provides a unified interface for file storage operations
 * across different storage providers (local filesystem, S3, etc.)
 * 
 * Following Airbnb Style Guide for code formatting.
 */

import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { 
  StorageProvider, 
  StorageConfig, 
  FileMetadata, 
  UploadOptions,
  PresignedUrlOptions,
  StorageStats,
} from './types';
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
  private s3Client: any; // Will be initialized if using S3
  private errorHandler: ErrorHandler;

  constructor(config: StorageConfig, errorHandler: ErrorHandler) {
    this.config = config;
    this.errorHandler = errorHandler;

    // Initialize the appropriate client based on the provider
    if (config.provider === StorageProvider.S3) {
      // We'll implement S3 client initialization later
      // this.s3Client = new S3Client({ ... });
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
      const fileId = randomUUID();
      
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
  ): Promise<{ url: string; fileId: string; fields?: Record<string, string> }> {
    try {
      // Only supported for S3 provider
      if (this.config.provider !== StorageProvider.S3) {
        throw new Error('Presigned URLs are only supported for S3 storage');
      }

      // Merge with default options
      const mergedOptions = { ...DEFAULT_PRESIGNED_URL_OPTIONS, ...options };
      
      // Generate a unique ID for the file
      const fileId = randomUUID();
      
      // Create a safe file path
      const safeName = this.sanitizeFileName(fileName);
      const filePath = `${ownerId}/${fileId}/${safeName}`;

      // We'll implement S3 presigned URL generation later
      // For now, return a placeholder
      return {
        url: 'https://example.com/presigned-url',
        fileId,
        fields: {
          key: filePath,
          'Content-Type': mergedOptions.contentType || 'application/octet-stream',
        },
      };
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
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      // Calculate usage by provider
      const usageByProvider = files.reduce((acc, file) => {
        const provider = file.provider as StorageProvider;
        acc[provider] = (acc[provider] || 0) + file.size;
        return acc;
      }, {} as Record<StorageProvider, number>);
      
      // Calculate usage by MIME type
      const usageByMimeType = files.reduce((acc, file) => {
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
    // We'll implement S3 upload later
    // For now, return a placeholder URL
    return `https://${this.config.bucketName}.s3.amazonaws.com/${filePath}`;
  }

  /**
   * Get a file from S3
   * 
   * @param filePath - The path of the file to get
   * @returns The file buffer
   */
  private async getFromS3(filePath: string): Promise<Buffer> {
    // We'll implement S3 download later
    // For now, return an empty buffer
    return Buffer.from([]);
  }

  /**
   * Delete a file from S3
   * 
   * @param filePath - The path of the file to delete
   */
  private async deleteFromS3(filePath: string): Promise<void> {
    // We'll implement S3 deletion later
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
