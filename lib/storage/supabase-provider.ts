/**
 * Supabase Storage Provider
 * 
 * Implementation of Supabase Storage provider for the Overseer platform.
 * Following Airbnb Style Guide for code formatting.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { StorageConfig, PresignedUrlOptions } from './types';
import { ErrorHandler } from '../error-handler';

export class SupabaseProvider {
  private supabase: SupabaseClient;
  private errorHandler: ErrorHandler;

  constructor(config: StorageConfig, errorHandler: ErrorHandler) {
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('Supabase URL and service role key are required');
    }

    this.errorHandler = errorHandler;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Upload a file to Supabase Storage
   * 
   * @param buffer - File buffer
   * @param bucket - Storage bucket name
   * @param key - Storage object key
   * @param mimeType - File MIME type
   * @param isPublic - Whether the file should be publicly accessible
   * @returns Promise resolving to the public URL
   */
  async uploadFile(
    buffer: Buffer,
    bucket: string,
    key: string,
    mimeType: string,
    isPublic: boolean = false,
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(key, buffer, {
          contentType: mimeType,
          upsert: true,
          cacheControl: '3600', // 1 hour cache
        });

      if (error) {
        throw new Error(`Supabase upload error: ${error.message}`);
      }

      // Get the public URL
      if (isPublic) {
        const { data: { publicUrl } } = this.supabase.storage
          .from(bucket)
          .getPublicUrl(key);
        return publicUrl;
      } else {
        // Return the path for private files - we'll generate signed URLs when needed
        return `${bucket}/${key}`;
      }
    } catch (error) {
      await this.errorHandler.handle({
        error: error as Error,
        source: 'SupabaseProvider.uploadFile',
        message: `Failed to upload file to Supabase Storage: ${key}`,
      });
      throw error;
    }
  }

  /**
   * Get a file from Supabase Storage
   * 
   * @param bucket - Storage bucket name
   * @param key - Storage object key
   * @returns Promise resolving to the file buffer
   */
  async getFile(bucket: string, key: string): Promise<Buffer> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(key);

      if (error) {
        throw new Error(`Supabase download error: ${error.message}`);
      }

      if (!data) {
        throw new Error('File data is empty');
      }

      // Convert blob to buffer
      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      await this.errorHandler.handle({
        error: error as Error,
        source: 'SupabaseProvider.getFile',
        message: `Failed to get file from Supabase Storage: ${key}`,
      });
      throw error;
    }
  }

  /**
   * Delete a file from Supabase Storage
   * 
   * @param bucket - Storage bucket name
   * @param key - Storage object key
   * @returns Promise resolving to true if successful
   */
  async deleteFile(bucket: string, key: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([key]);

      if (error) {
        throw new Error(`Supabase delete error: ${error.message}`);
      }

      return true;
    } catch (error) {
      await this.errorHandler.handle({
        error: error as Error,
        source: 'SupabaseProvider.deleteFile',
        message: `Failed to delete file from Supabase Storage: ${key}`,
      });
      return false;
    }
  }

  /**
   * Check if a file exists in Supabase Storage
   * 
   * @param bucket - Storage bucket name
   * @param key - Storage object key
   * @returns Promise resolving to true if the file exists
   */
  async fileExists(bucket: string, key: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(key.split('/').slice(0, -1).join('/'), {
          search: key.split('/').pop()
        });

      if (error) {
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a presigned URL for direct file upload
   * 
   * @param bucket - Storage bucket name
   * @param fileName - Original file name
   * @param userId - User ID
   * @param options - Presigned URL options
   * @returns Promise resolving to presigned URL data
   */
  async generatePresignedUploadUrl(
    bucket: string,
    fileName: string,
    userId: string,
    options: PresignedUrlOptions = {},
  ): Promise<{
    url: string;
    fileId: string;
    fields?: Record<string, string>;
    expiresAt: Date;
  }> {
    try {
      const fileId = uuidv4();
      const fileExtension = fileName.split('.').pop() || '';
      const key = `uploads/${userId}/${fileId}.${fileExtension}`;
      
      const expiresInSeconds = options.expiresInSeconds || 3600; // 1 hour default
      
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUploadUrl(key, {
          upsert: true,
        });

      if (error) {
        throw new Error(`Failed to create signed upload URL: ${error.message}`);
      }

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);

      return {
        url: data.signedUrl,
        fileId,
        fields: {
          key,
          bucket,
          token: data.token
        },
        expiresAt,
      };
    } catch (error) {
      await this.errorHandler.handle({
        error: error as Error,
        source: 'SupabaseProvider.generatePresignedUploadUrl',
        message: 'Failed to generate presigned URL',
        userId,
      });
      throw error;
    }
  }

  /**
   * Generate a presigned URL for direct file download
   * 
   * @param bucket - Storage bucket name
   * @param key - Storage object key
   * @param fileName - Original file name for Content-Disposition
   * @param options - Presigned URL options
   * @returns Promise resolving to presigned URL
   */
  async generatePresignedDownloadUrl(
    bucket: string,
    key: string,
    fileName: string,
    options: PresignedUrlOptions = {},
  ): Promise<string> {
    try {
      const expiresInSeconds = options.expiresInSeconds || 3600; // 1 hour default
      
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(key, expiresInSeconds, {
          download: fileName
        });

      if (error) {
        throw new Error(`Failed to create signed download URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      await this.errorHandler.handle({
        error: error as Error,
        source: 'SupabaseProvider.generatePresignedDownloadUrl',
        message: `Failed to generate presigned download URL: ${key}`,
      });
      throw error;
    }
  }

  /**
   * Create a storage bucket
   * 
   * @param bucketName - Name of the bucket to create
   * @param isPublic - Whether the bucket should be public
   * @returns Promise resolving to true if successful
   */
  async createBucket(bucketName: string, isPublic: boolean = false): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage.createBucket(bucketName, {
        public: isPublic,
        allowedMimeTypes: ['*/*'],
        fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
      });

      if (error && !error.message.includes('already exists')) {
        throw new Error(`Failed to create bucket: ${error.message}`);
      }

      return true;
    } catch (error) {
      await this.errorHandler.handle({
        error: error as Error,
        source: 'SupabaseProvider.createBucket',
        message: `Failed to create bucket: ${bucketName}`,
      });
      return false;
    }
  }

  /**
   * List files in a bucket
   * 
   * @param bucket - Storage bucket name
   * @param prefix - Optional prefix to filter files
   * @returns Promise resolving to list of files
   */
  async listFiles(bucket: string, prefix?: string): Promise<Array<{
    name: string;
    id: string;
    size?: number;
    created_at: string;
    last_accessed_at: string;
    metadata: Record<string, any>;
  }>> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(prefix || '');

      if (error) {
        throw new Error(`Failed to list files: ${error.message}`);
      }

      // Transform Supabase FileObject to our expected format
      return (data || []).map(file => ({
        name: file.name,
        id: file.id || file.name,
        size: file.metadata?.size,
        created_at: file.created_at,
        last_accessed_at: file.updated_at || file.created_at,
        metadata: file.metadata || {},
      }));
    } catch (error) {
      await this.errorHandler.handle({
        error: error as Error,
        source: 'SupabaseProvider.listFiles',
        message: `Failed to list files in bucket: ${bucket}`,
      });
      throw error;
    }
  }
} 