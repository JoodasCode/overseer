import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Agents endpoint called');
    
    // Get all agents from database
    const { data: agents, error } = await supabaseAdmin
      .from('Agent')
      .select('id, name, user_id, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching agents:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('📊 Found agents:', agents?.length || 0);

    return NextResponse.json({
      success: true,
      totalAgents: agents?.length || 0,
      agents: agents || [],
      message: 'All agents in database'
    });
  } catch (error) {
    console.error('❌ Debug agents error:', error);
    return NextResponse.json({
      error: 'Failed to fetch agents',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 