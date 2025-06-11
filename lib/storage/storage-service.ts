/**
 * Storage Service - Supabase Only
 * 
 * Handles file storage operations using Supabase Storage.
 */

import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import {
  StorageProvider,
  FileMetadata,
  UploadOptions,
  PresignedUrlOptions,
  StorageStats,
} from './types';
import { ErrorHandler } from '../error-handler';

// Create Supabase client for file operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  private errorHandler: ErrorHandler;

  constructor(errorHandler: ErrorHandler) {
    this.errorHandler = errorHandler;
  }

  /**
   * Upload a file to Supabase Storage
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
      
      // Choose bucket based on visibility
      const bucket = mergedOptions.isPublic ? 'public-files' : 'private-files';
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload to Supabase Storage: ${uploadError.message}`);
      }

      // Get public URL if public
      let url: string | undefined;
      if (mergedOptions.isPublic) {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        url = urlData.publicUrl;
      }

      // Create file metadata
      const metadata: FileMetadata = {
        id: fileId,
        name: fileName,
        size: file.length,
        mimeType,
        path: filePath,
        url,
        provider: StorageProvider.SUPABASE,
        ownerId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: mergedOptions.isPublic!,
        metadata: mergedOptions.metadata,
      };

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          id: metadata.id,
          name: metadata.name,
          size: metadata.size,
          mimeType: metadata.mimeType,
          path: metadata.path,
          url: metadata.url,
          provider: metadata.provider,
          ownerId: metadata.ownerId,
          isPublic: metadata.isPublic,
          metadata: metadata.metadata,
          createdAt: metadata.createdAt.toISOString(),
          updatedAt: metadata.updatedAt.toISOString(),
        });

      if (dbError) {
        // Try to clean up uploaded file if database insert fails
        await supabase.storage.from(bucket).remove([filePath]);
        throw new Error(`Failed to save file metadata: ${dbError.message}`);
      }

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
   * Get a file from Supabase Storage
   */
  async getFile(fileId: string, ownerId: string): Promise<{ buffer: Buffer; metadata: FileMetadata }> {
    try {
      // Get file metadata from database
      const { data: fileRecord, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error || !fileRecord) {
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
        createdAt: new Date(fileRecord.createdAt),
        updatedAt: new Date(fileRecord.updatedAt),
        isPublic: fileRecord.isPublic,
        metadata: fileRecord.metadata || {},
      };

      // Download file from Supabase Storage
      const bucket = metadata.isPublic ? 'public-files' : 'private-files';
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(metadata.path);

      if (downloadError || !fileData) {
        throw new Error(`Failed to download file: ${downloadError?.message}`);
      }

      // Convert blob to buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

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
   * Delete a file from Supabase Storage
   */
  async deleteFile(fileId: string, ownerId: string): Promise<boolean> {
    try {
      // Get file metadata from database
      const { data: fileRecord, error: getError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (getError || !fileRecord) {
        throw new Error(`File with ID ${fileId} not found`);
      }

      // Check access permissions
      if (fileRecord.ownerId !== ownerId) {
        throw new Error('Access denied');
      }

      // Delete file from Supabase Storage
      const bucket = fileRecord.isPublic ? 'public-files' : 'private-files';
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([fileRecord.path]);

      if (storageError) {
        console.warn(`Failed to delete file from storage: ${storageError.message}`);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete metadata from database
      const { error: deleteError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (deleteError) {
        throw new Error(`Failed to delete file metadata: ${deleteError.message}`);
      }

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
   * Generate a presigned URL for file upload
   */
  async generatePresignedUploadUrl(
    fileName: string,
    ownerId: string,
    options: PresignedUrlOptions = {},
  ): Promise<{ url: string; fileId: string; fields?: Record<string, string>; expiresAt: Date }> {
    try {
      const mergedOptions = { ...DEFAULT_PRESIGNED_URL_OPTIONS, ...options };
      const fileId = uuidv4();
      const safeName = this.sanitizeFileName(fileName);
      const filePath = `${ownerId}/${fileId}/${safeName}`;
      
      // For now, return a placeholder - Supabase doesn't have direct presigned uploads
      // Users would need to upload through the API
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + mergedOptions.expiresInSeconds!);

      return {
        url: `/api/storage/upload`, // Use our API endpoint
        fileId,
        fields: {
          filePath,
          fileName,
        },
        expiresAt,
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
   */
  async getStorageStats(ownerId: string): Promise<StorageStats> {
    try {
      // Get all files for the user from database
      const { data: files, error } = await supabase
        .from('files')
        .select('size, mimeType')
        .eq('ownerId', ownerId);

      if (error) {
        throw new Error(`Failed to get files: ${error.message}`);
      }

      // Calculate statistics
      const totalFiles = files.length;
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      // Group by MIME type
      const mimeTypes: Record<string, { count: number; size: number }> = {};
      files.forEach((file) => {
        const mimeType = file.mimeType;
        if (!mimeTypes[mimeType]) {
          mimeTypes[mimeType] = { count: 0, size: 0 };
        }
        mimeTypes[mimeType].count++;
        mimeTypes[mimeType].size += file.size;
      });

      return {
        totalFiles,
        totalSize,
        mimeTypes,
      };
    } catch (error) {
      this.errorHandler.handle({
        error: error as Error,
        source: 'StorageService.getStorageStats',
        message: `Failed to get storage stats for user ${ownerId}`,
        userId: ownerId,
      });
      throw error;
    }
  }

  /**
   * Sanitize file name for safe storage
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }
}
