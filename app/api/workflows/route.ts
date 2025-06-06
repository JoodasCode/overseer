import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

/**
 * GET /api/workflows
 * Retrieve all workflows for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Get user ID from auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    
    // Build query
    let query = supabase
      .from('workflows')
      .select('*')
      .eq('user_id', user.id);
    
    // Apply filters if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Execute query
    const { data: workflows, error } = await query
      .order('updated_at', { ascending: false });
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ workflows });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows
 * Create a new workflow
 */
export async function POST(req: NextRequest) {
  try {
    // Get user ID from auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { name, description, nodes, status } = body;
    
    // Validate required fields
    if (!name || !nodes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate nodes structure (basic validation)
    if (!Array.isArray(nodes) && typeof nodes !== 'object') {
      return NextResponse.json(
        { error: 'Invalid nodes structure' },
        { status: 400 }
      );
    }
    
    // Insert new workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .insert({
        name,
        description: description || '',
        nodes,
        status: status || 'draft',
        user_id: user.id,
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
