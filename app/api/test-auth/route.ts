import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 API Test: Creating Supabase client...');
    
    // Test 1: Basic client creation
    const clientTest = {
      created: !!supabase,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'missing',
      keyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
    };
    
    // Test 2: Try to get session
    let sessionTest;
    try {
      console.log('🔍 API Test: Attempting to get session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      sessionTest = {
        success: !error,
        hasSession: !!session,
        error: error?.message || null,
        sessionUser: session?.user?.email || null
      };
    } catch (error: any) {
      sessionTest = {
        success: false,
        error: error.message,
        hasSession: false,
        sessionUser: null
      };
    }
    
    // Test 3: Try to access a public table (if any exist)
    let dbTest;
    try {
      console.log('🔍 API Test: Attempting database query...');
      const { data, error } = await supabase
        .from('portal_agents')
        .select('count')
        .limit(1);
        
      dbTest = {
        success: !error,
        error: error?.message || null,
        hasData: !!data,
        dataLength: data?.length || 0
      };
    } catch (error: any) {
      dbTest = {
        success: false,
        error: error.message,
        hasData: false,
        dataLength: 0
      };
    }
    
    // Test 4: Environment validation
    const envTest = {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlFormat: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') ? 'valid' : 'invalid',
      keyFormat: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('eyJ') ? 'valid' : 'invalid'
    };
    
    return NextResponse.json({
      status: 'completed',
      timestamp: new Date().toISOString(),
      tests: {
        client: clientTest,
        session: sessionTest,
        database: dbTest,
        environment: envTest
      }
    });
    
  } catch (error: any) {
    console.error('❌ API Test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 });
  }
} 