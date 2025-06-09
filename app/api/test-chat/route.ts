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

export async function POST(request: NextRequest) {
  console.log('🧪 Test Chat Auth Endpoint');
  
  // Check authentication from Authorization header
  const authHeader = request.headers.get('authorization');
  console.log('Auth header:', authHeader?.substring(0, 20) + '...');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ 
      error: 'No authorization header',
      debug: { authHeader: !!authHeader }
    }, { status: 401 });
  }
  
  const token = authHeader.substring(7);
  console.log('Token length:', token.length);
  
  // Use admin client to validate JWT token
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  
  if (authError || !user) {
    return NextResponse.json({ 
      error: 'JWT validation failed',
      debug: { 
        authError: authError?.message,
        hasUser: !!user 
      }
    }, { status: 401 });
  }
  
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email
    },
    message: 'Authentication successful! Chat API should work.'
  });
} 