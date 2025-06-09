import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/health
 * Simple health check endpoint
 */
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Server is running successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 