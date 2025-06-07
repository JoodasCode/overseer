/**
 * Presigned URL API Route
 * 
 * Generates presigned URLs for direct file uploads to storage.
 * Following Airbnb Style Guide for code formatting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { ErrorHandler } from '@/lib/error-handler';
import { checkUsageLimit } from '@/lib/billing/subscription-utils';
import { ResourceType } from '@/lib/billing/types';
import { getStorageService } from '@/lib/storage';

const errorHandler = new ErrorHandler();

/**
 * POST /api/storage/presigned
 * Generate a presigned URL for direct file upload
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { fileName, mimeType, isPublic, maxSizeBytes } = body;

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required' },
        { status: 400 },
      );
    }

    // Check subscription limits for storage
    const canUpload = await checkUsageLimit(user.id, ResourceType.Storage);
    if (!canUpload) {
      return NextResponse.json(
        { error: 'Storage limit exceeded' },
        { status: 403 },
      );
    }

    // Get the storage service instance
    const storageService = getStorageService();

    // Generate a presigned URL for direct upload to S3
    const presignedUrl = await storageService.generatePresignedUploadUrl(
      fileName,
      session.user.id,
      {
        contentType: mimeType,
        maxSizeBytes: maxSizeBytes,
        expiresInSeconds: 3600, // 1 hour
      }
    );

    // Create a placeholder file record in the database
    // We'll update this when the upload is confirmed
    await prisma.file.create({
      data: {
        id: presignedUrl.fileId,
        name: fileName,
        size: 0, // Will be updated after upload
        mimeType,
        path: presignedUrl.fields?.key || `${session.user.id}/${presignedUrl.fileId}/${fileName}`,
        provider: 'S3',
        ownerId: session.user.id,
        isPublic: isPublic || false,
        metadata: {},
      },
    });

    // Return the presigned URL and file ID
    return NextResponse.json({
      presignedUrl,
      file: {
        id: presignedUrl.fileId,
        name: fileName,
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
