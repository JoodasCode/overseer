import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../lib/prisma';

/**
 * API endpoint to test database connections
 * Tests both Prisma and direct Supabase connections
 */
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    prisma: { success: false, error: null, data: null },
    supabase: { success: false, error: null, data: null },
  };

  // Test Prisma connection
  try {
    // Try a simple query to test connection
    const dbVersion = await prisma.$queryRaw`SELECT version();`;
    results.prisma.success = true;
    results.prisma.data = { version: dbVersion };
    
    // Try to query some tables to verify schema
    try {
      const agentCount = await prisma.agent.count();
      results.prisma.data.agentCount = agentCount;
    } catch (error: any) {
      results.prisma.data.agentError = error.message;
    }
    
    try {
      const userCount = await prisma.user.count();
      results.prisma.data.userCount = userCount;
    } catch (error: any) {
      results.prisma.data.userError = error.message;
    }
    
  } catch (error: any) {
    results.prisma.success = false;
    results.prisma.error = {
      message: error.message,
      code: error.code,
    };
  }

  // Test Supabase connection
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test auth
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      throw authError;
    }
    
    // Try to query a table
    const { data, error } = await supabase
      .from('User')
      .select('count');
      
    if (error && error.code !== '42P01') { // Ignore table not found error
      throw error;
    }
    
    results.supabase.success = true;
    results.supabase.data = {
      auth: authData,
      query: data || 'Table not found (expected if schema not applied)',
    };
    
  } catch (error: any) {
    results.supabase.success = false;
    results.supabase.error = {
      message: error.message,
      code: error.code,
    };
  }

  // Return results
  return NextResponse.json({
    success: results.prisma.success || results.supabase.success,
    message: 'Database connection test completed',
    results,
  });
}
