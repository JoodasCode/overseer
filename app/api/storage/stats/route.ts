/**
 * Storage Statistics API Route
 * 
 * Provides statistics about file storage usage.
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
 * GET /api/storage/stats
 * Get storage statistics for the authenticated user
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

    // Get storage statistics
    const stats = await storageService.getStorageStats(user.id);

    // Get subscription limits
    const storageLimit = await getStorageLimit(user.id);

    return NextResponse.json({
      ...stats,
      limit: storageLimit,
      usagePercentage: storageLimit > 0 ? (stats.totalSize / storageLimit) * 100 : 0,
    });
  } catch (error) {
    await errorHandler.handle({
      error: error as Error,
      source: 'api/storage/stats:GET',
      message: 'Failed to get storage statistics',
    });
    return NextResponse.json(
      { error: 'Failed to get storage statistics' },
      { status: 500 },
    );
  }
}

/**
 * Get the storage limit for a user based on their subscription plan
 * 
 * @param userId - The ID of the user
 * @returns The storage limit in bytes
 */
async function getStorageLimit(userId: string): Promise<number> {
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
      return 0;
    }

    // For now, we'll return a default limit based on a free plan
    // In a real implementation, this would check the user's subscription plan
    // and return the appropriate limit
    
    // Default limits (in bytes):
    // Free: 100 MB
    // Pro: 1 GB
    // Teams: 5 GB per user
    // Enterprise: 20 GB per user
    
    return 100 * 1024 * 1024; // 100 MB for free plan
  } catch (error) {
    await errorHandler.handle({
      error: error as Error,
      source: 'getStorageLimit',
      message: 'Failed to get storage limit',
      userId,
    });
    return 0;
  }
}
