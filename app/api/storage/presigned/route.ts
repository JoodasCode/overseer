/**
 * Presigned URL API Route
 * 
 * Generates presigned URLs for direct file uploads to storage.
 * Following Airbnb Style Guide for code formatting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { StorageService } from '@/lib/storage/storage-service';
import { StorageProvider } from '@/lib/storage/types';
import { ErrorHandler } from '@/lib/error-handler';
import prisma from '@/lib/db/prisma';

// Initialize services
const errorHandler = new ErrorHandler();
const storageService = new StorageService(
  {
    provider: StorageProvider.S3,
    bucketName: process.env.S3_BUCKET_NAME,
    region: process.env.S3_REGION,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
  },
  errorHandler,
);

/**
 * POST /api/storage/presigned
 * Generate a presigned URL for direct file upload
 */
export async function POST(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const { fileName, contentType, isPublic, expiresInSeconds, maxSizeBytes, metadata } = body;

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required' },
        { status: 400 },
      );
    }

    // Check subscription limits for storage
    // This would integrate with the subscription-utils.ts to check storage limits
    // For now, we'll just check if the user is allowed to upload files
    const canUpload = await checkStorageLimit(user.id);
    if (!canUpload) {
      return NextResponse.json(
        { error: 'Storage limit exceeded' },
        { status: 403 },
      );
    }

    // Generate presigned URL
    const presignedData = await storageService.generatePresignedUploadUrl(
      fileName,
      user.id,
      {
        contentType,
        expiresInSeconds,
        maxSizeBytes,
      },
    );

    // Create a placeholder file record
    const fileRecord = await prisma.file.create({
      data: {
        id: presignedData.fileId,
        name: fileName,
        size: 0, // Will be updated after upload
        mimeType: contentType || 'application/octet-stream',
        path: presignedData.fields?.key || '',
        url: null, // Will be updated after upload
        provider: StorageProvider.S3,
        ownerId: user.id,
        isPublic: isPublic || false,
        metadata: metadata || {},
      },
    });

    return NextResponse.json({
      ...presignedData,
      file: {
        id: fileRecord.id,
        name: fileRecord.name,
      },
    });
  } catch (error) {
    await errorHandler.handle({
      error: error as Error,
      source: 'api/storage/presigned:POST',
      message: 'Failed to generate presigned URL',
    });
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 },
    );
  }
}

/**
 * Check if the user has exceeded their storage limit
 * 
 * @param userId - The ID of the user
 * @returns True if the user can upload more files, false otherwise
 */
async function checkStorageLimit(userId: string): Promise<boolean> {
  try {
    // Get the user's subscription details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        // Add subscription-related fields here
      },
    });

    if (!user) {
      return false;
    }

    // For now, we'll just return true
    // In a real implementation, this would check the user's subscription plan
    // and compare it to their current storage usage
    return true;
  } catch (error) {
    await errorHandler.handle({
      error: error as Error,
      source: 'checkStorageLimit',
      message: 'Failed to check storage limit',
      userId,
    });
    return false;
  }
}
