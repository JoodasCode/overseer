/**
 * Storage API Route
 * 
 * Handles file uploads and listing files.
 * Following Airbnb Style Guide for code formatting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getStorageService } from '@/lib/storage';
import { ErrorHandler } from '@/lib/error-handler';
import prisma from '@/lib/db/prisma';

// Initialize services
const errorHandler = new ErrorHandler();
const storageService = getStorageService();

/**
 * GET /api/storage
 * List files for the authenticated user
 */
export async function GET(req: NextRequest) {
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

    // Parse query parameters
    const url = new URL(req.url);
    const mimeType = url.searchParams.get('mimeType');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Query files
    const files = await prisma.file.findMany({
      where: {
        ownerId: user.id,
        ...(mimeType ? { mimeType } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.file.count({
      where: {
        ownerId: user.id,
        ...(mimeType ? { mimeType } : {}),
      },
    });

    return NextResponse.json({
      files,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + files.length < totalCount,
      },
    });
  } catch (error) {
    await errorHandler.handle({
      error: error as Error,
      source: 'api/storage:GET',
      message: 'Failed to list files',
    });
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/storage
 * Upload a file
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

    // Check if the request is multipart form data
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data' },
        { status: 400 },
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 },
      );
    }

    // Get file metadata
    const fileName = file.name;
    const mimeType = file.type;
    const isPublic = formData.get('isPublic') === 'true';
    const metadataStr = formData.get('metadata') as string;
    const metadata = metadataStr ? JSON.parse(metadataStr) : {};

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file
    const fileMetadata = await storageService.uploadFile(
      buffer,
      fileName,
      mimeType,
      user.id,
      { isPublic, metadata },
    );

    return NextResponse.json(fileMetadata, { status: 201 });
  } catch (error) {
    await errorHandler.handle({
      error: error as Error,
      source: 'api/storage:POST',
      message: 'Failed to upload file',
    });
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 },
    );
  }
}
