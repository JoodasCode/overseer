/**
 * API route for bulk operations on error logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ErrorHandler } from '@/lib/plugin-engine';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize error handler
const errorHandler = ErrorHandler.getInstance();

/**
 * Bulk resolve errors
 * POST /api/plugin-engine/errors/bulk
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Validate the request
    if (!body.action || !body.errorIds || !Array.isArray(body.errorIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: action, errorIds (array)' },
        { status: 400 }
      );
    }
    
    // Get the user ID from the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Process based on action
    switch (body.action) {
      case 'resolve': {
        const count = await errorHandler.bulkResolveErrors(body.errorIds);
        return NextResponse.json({
          success: true,
          action: 'resolve',
          count,
          errorIds: body.errorIds
        });
      }
      
      default:
        return NextResponse.json(
          { error: `Unsupported action: ${body.action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in bulk operation:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to perform bulk operation: ${errorMessage}` },
      { status: 500 }
    );
  }
}
