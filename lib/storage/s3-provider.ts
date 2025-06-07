/**
 * S3 Storage Provider
 * 
 * Implementation of AWS S3 storage provider for the Overseer platform.
 * Following Airbnb Style Guide for code formatting.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { StorageConfig, PresignedUrlOptions } from './types';
import { ErrorHandler } from '../error-handler';

export class S3Provider {
  private s3Client: S3Client;
  private bucketName: string;
  private errorHandler: ErrorHandler;

  constructor(config: StorageConfig, errorHandler: ErrorHandler) {
    if (!config.bucketName || !config.region) {
      throw new Error('S3 bucket name and region are required');
    }

    this.bucketName = config.bucketName;
    this.errorHandler = errorHandler;

    this.s3Client = new S3Client({
      region: config.region || 'us-east-1',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId || '',
        secretAccessKey: config.secretAccessKey || '',
      },
    });
  }

  /**
   * Upload a file to S3
   * 
   * @param buffer - File buffer
   * @param key - S3 object key
   * @param mimeType - File MIME type
   * @returns Promise resolving to the S3 URL
   */
  async uploadFile(
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      });

      await this.s3Client.send(command);
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      await this.errorHandler.handle({
        error: error as Error,
        source: 'S3Provider.uploadFile',
        message: `Failed to upload file to S3: ${key}`,
      });
      throw error;
    }
  }

  /**
   * Get a file from S3
   * 
   * @param key - S3 object key
   * @returns Promise resolving to the file buffer
   */
  async getFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('File body is empty');
      }

      // Convert the readable stream to a buffer
      return Buffer.concat(
        await new Promise<Buffer[]>((resolve, reject) => {
          const chunks: Buffer[] = [];
          const stream = response.Body as any;
          
          stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.on('end', () => resolve(chunks));
          stream.on('error', reject);
        }),
      );
    } catch (error) {
      await this.errorHandler.handle({
        error: error as Error,
        source: 'S3Provider.getFile',
        message: `Failed to get file from S3: ${key}`,
      });
      throw error;
    }
  }

  /**
   * Delete a file from S3
   * 
   * @param key - S3 object key
   * @returns Promise resolving to true if successful
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      await this.errorHandler.handle({
        error: error as Error,
        source: 'S3Provider.deleteFile',
        message: `Failed to delete file from S3: ${key}`,
      });
      return false;
    }
  }

  /**
   * Check if a file exists in S3
   * 
   * @param key - S3 object key
   * @returns Promise resolving to true if the file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a presigned URL for direct file upload
   * 
   * @param fileName - Original file name
   * @param userId - User ID
   * @param options - Presigned URL options
   * @returns Promise resolving to presigned URL data
   */
  async generatePresignedUploadUrl(
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
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: options.contentType || 'application/octet-stream',
      });

      const expiresInSeconds = options.expiresInSeconds || 3600; // 1 hour default
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);

      return {
        url,
        fileId,
        fields: {
          key,
          bucket: this.bucketName,
        },
        expiresAt,
      };
    } catch (error) {
      await this.errorHandler.handle({
        error: error as Error,
        source: 'S3Provider.generatePresignedUploadUrl',
        message: 'Failed to generate presigned URL',
        userId,
      });
      throw error;
    }
  }

  /**
   * Generate a presigned URL for direct file download
   * 
   * @param key - S3 object key
   * @param fileName - Original file name for Content-Disposition
   * @param options - Presigned URL options
   * @returns Promise resolving to presigned URL
   */
  async generatePresignedDownloadUrl(
    key: string,
    fileName: string,
    options: PresignedUrlOptions = {},
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
      });

      const expiresInSeconds = options.expiresInSeconds || 3600; // 1 hour default
      return getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });
    } catch (error) {
      await this.errorHandler.handle({
        error: error as Error,
        source: 'S3Provider.generatePresignedDownloadUrl',
        message: `Failed to generate presigned download URL: ${key}`,
      });
      throw error;
    }
  }
}
