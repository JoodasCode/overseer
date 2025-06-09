import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

/**
 * GET /api/debug
 * Debug endpoint to check authentication and agent status
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication from Authorization header
    const authHeader = request.headers.get('authorization');
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && authUser) {
        user = authUser;
      }
    }
    
    // Fallback to cookie-based auth if no Authorization header
    if (!user) {
      const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser();
      if (!cookieError && cookieUser) {
        user = cookieUser;
      }
    }
    
    if (!user) {
      return NextResponse.json({
        status: 'error',
        message: 'User not authenticated',
        debug: {
          hasAuthHeader: !!authHeader,
          authHeaderValid: false,
          cookieAuthValid: false
        }
      });
    }

    // Get user's agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .limit(5);

    return NextResponse.json({
      status: 'success',
      message: 'Authentication successful',
      debug: {
        user: {
          id: user.id,
          email: user.email,
          authenticated: true
        },
        agents: {
          count: agents?.length || 0,
          list: agents || [],
          error: agentsError?.message || null
        },
        chatApiUrl: '/api/chat/[agentId]',
        instructions: agents?.length 
          ? `To chat with an agent, POST to /api/chat/${agents[0].id} with Bearer token` 
          : 'Create an agent first, then use /api/chat/[agentId]'
      }
    });
  } catch (error) {
    console.error('Debug API Error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 