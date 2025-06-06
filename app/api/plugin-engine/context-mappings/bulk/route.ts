/**
 * API Route: /api/plugin-engine/context-mappings/bulk
 * 
 * Handles bulk operations for context mappings
 * - POST: Bulk create or update context mappings
 * - DELETE: Bulk delete context mappings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ContextMapper } from '@/lib/plugin-engine';

// Initialize Supabase client for auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get the context mapper instance
const contextMapper = ContextMapper.getInstance();

/**
 * POST: Bulk create or update context mappings
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { mappings } = body;
    
    // Validate request
    if (!Array.isArray(mappings) || mappings.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: mappings must be a non-empty array' },
        { status: 400 }
      );
    }
    
    // Verify user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Add userId to all mappings
    const userId = session.user.id;
    const preparedMappings = mappings.map(mapping => ({
      ...mapping,
      userId
    }));
    
    // Perform bulk upsert
    const count = await contextMapper.bulkUpsertMappings(preparedMappings);
    
    return NextResponse.json({ 
      success: true, 
      count,
      message: `Successfully processed ${count} mappings`
    });
  } catch (error) {
    console.error('Error in bulk context mapping operation:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk context mappings' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Bulk delete context mappings
 */
export async function DELETE(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { ids } = body;
    
    // Validate request
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids must be a non-empty array' },
        { status: 400 }
      );
    }
    
    // Verify user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Delete each mapping
    const results = await Promise.all(
      ids.map(id => contextMapper.deleteMapping(id))
    );
    
    // Count successful deletions
    const successCount = results.filter(success => success).length;
    
    return NextResponse.json({ 
      success: true, 
      count: successCount,
      message: `Successfully deleted ${successCount} of ${ids.length} mappings`
    });
  } catch (error) {
    console.error('Error in bulk context mapping deletion:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk context mapping deletion' },
      { status: 500 }
    );
  }
}
