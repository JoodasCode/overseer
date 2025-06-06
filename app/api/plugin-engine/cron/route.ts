/**
 * Cron job API route for processing scheduled tasks
 * This endpoint should be called by a cron job service like Vercel Cron
 */

import { NextRequest, NextResponse } from 'next/server';
import { PluginEngine } from '@/lib/plugin-engine';
import { Scheduler } from '@/lib/plugin-engine';

// Initialize plugin engine and scheduler
const pluginEngine = PluginEngine.getInstance();
const scheduler = Scheduler.getInstance();

/**
 * Process scheduled tasks
 * POST /api/plugin-engine/cron
 * 
 * This endpoint should be secured with a secret key
 * to prevent unauthorized access
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the request body
    const body = await request.json();
    const { job } = body;
    
    // Process different job types
    switch (job) {
      case 'process_scheduled_tasks':
        // Process tasks that are scheduled for execution
        const processedTasks = await pluginEngine.processScheduledTasks();
        return NextResponse.json({
          success: true,
          message: `Processed ${processedTasks.length} scheduled tasks`,
          processedTasks
        });
      
      case 'process_due_tasks':
        // Process tasks that are due for execution
        const processedCount = await scheduler.processDueTasks();
        return NextResponse.json({
          success: true,
          message: `Processed ${processedCount} due tasks`,
          processedCount
        });
      
      case 'cleanup_completed_tasks':
        // Clean up tasks that have been completed for more than 7 days
        const cleanedUpTasks = await scheduler.cleanupCompletedTasks(7);
        return NextResponse.json({
          success: true,
          message: `Cleaned up ${cleanedUpTasks} completed tasks`,
          cleanedUpTasks
        });
      
      default:
        return NextResponse.json(
          { error: `Unknown job type: ${job}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing cron job:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to process cron job: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 * GET /api/plugin-engine/cron
 */
export async function GET() {
  try {
    // Get some stats
    const adapters = pluginEngine.listAdapters();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      adapters: adapters.length,
      message: 'Cron job endpoint is ready'
    });
  } catch (error) {
    console.error('Error in health check:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Health check failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
