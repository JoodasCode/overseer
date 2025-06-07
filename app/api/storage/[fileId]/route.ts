/**
 * File API Route
 * 
 * Handles operations on individual files: get, update, delete.
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
    provider: StorageProvider.LOCAL,
    localPath: process.env.LOCAL_STORAGE_PATH || './storage',
  },
  errorHandler,
);

interface RouteParams {
  params: {
    fileId: string;
  };
}

/**
 * GET /api/storage/[fileId]
 * Get a specific file
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { fileId } = params;

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

    // Check if the file exists and belongs to the user
    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check access permissions
    if (fileRecord.ownerId !== user.id && !fileRecord.isPublic) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the file
    const { buffer, metadata } = await storageService.getFile(fileId, user.id);

    // Check if the request wants metadata only
    const url = new URL(req.url);
    const metadataOnly = url.searchParams.get('metadataOnly') === 'true';

    if (metadataOnly) {
      return NextResponse.json(metadata);
    }

    // Return the file as a stream
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': metadata.mimeType,
        'Content-Disposition': `inline; filename="${metadata.name}"`,
        'Content-Length': metadata.size.toString(),
      },
    });
  } catch (error) {
    await errorHandler.handle({
      error: error as Error,
      source: 'api/storage/[fileId]:GET',
      message: 'Failed to get file',
    });
    return NextResponse.json(
      { error: 'Failed to get file' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/storage/[fileId]
 * Update file metadata
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { fileId } = params;

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

    // Check if the file exists and belongs to the user
    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check ownership
    if (fileRecord.ownerId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { name, isPublic, metadata } = body;

    // Update file metadata
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        ...(name ? { name } : {}),
        ...(isPublic !== undefined ? { isPublic } : {}),
        ...(metadata ? { metadata } : {}),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    await errorHandler.handle({
      error: error as Error,
      source: 'api/storage/[fileId]:PATCH',
      message: 'Failed to update file',
    });
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/storage/[fileId]
 * Delete a file
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { fileId } = params;

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

    // Delete the file
    const success = await storageService.deleteFile(fileId, user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    await errorHandler.handle({
      error: error as Error,
      source: 'api/storage/[fileId]:DELETE',
      message: 'Failed to delete file',
    });
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 },
    );
  }
}
