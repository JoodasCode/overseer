/**
 * API Route: /api/plugin-engine/context-mappings/lookup
 * 
 * Handles lookup operations for context mappings
 * - GET: Lookup external ID by context key or context key by external ID
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
 * GET: Lookup external ID by context key or context key by external ID
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');
    const tool = searchParams.get('tool');
    const contextKey = searchParams.get('contextKey');
    const externalId = searchParams.get('externalId');
    
    // Validate required parameters
    if (!agentId || !tool) {
      return NextResponse.json(
        { error: 'Missing required parameters: agentId and tool' },
        { status: 400 }
      );
    }
    
    // Either contextKey or externalId must be provided
    if (!contextKey && !externalId) {
      return NextResponse.json(
        { error: 'Either contextKey or externalId must be provided' },
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
    
    // Perform lookup based on provided parameters
    if (contextKey) {
      // Look up external ID by context key
      const result = await contextMapper.getExternalId(agentId, tool, contextKey);
      
      if (result === null) {
        return NextResponse.json(
          { error: 'Mapping not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ externalId: result });
    } else {
      // Look up context key by external ID
      const result = await contextMapper.getContextKey(agentId, tool, externalId!);
      
      if (result === null) {
        return NextResponse.json(
          { error: 'Mapping not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ contextKey: result });
    }
  } catch (error) {
    console.error('Error looking up context mapping:', error);
    return NextResponse.json(
      { error: 'Failed to lookup context mapping' },
      { status: 500 }
    );
  }
}
