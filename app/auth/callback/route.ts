import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  console.log('🔑 Auth callback:', { code: !!code, error, errorDescription });

  // Handle errors (expired links, invalid tokens, etc.)
  if (error) {
    console.log('❌ Auth callback error:', { error, errorDescription });
    // Redirect back to home with error parameter so we can show a helpful message
    return NextResponse.redirect(new URL(`/?auth_error=${error}&message=${encodeURIComponent(errorDescription || 'Authentication failed')}`, requestUrl.origin));
  }

  if (code) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.log('❌ Session exchange error:', exchangeError);
        return NextResponse.redirect(new URL(`/?auth_error=session_error&message=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin));
      }

      console.log('✅ Auth callback successful:', { user: data.user?.email });
      
      // Redirect to dashboard after successful authentication
      return NextResponse.redirect(new URL('/', requestUrl.origin));
    } catch (error) {
      console.log('❌ Auth callback exception:', error);
      return NextResponse.redirect(new URL('/?auth_error=unknown&message=Authentication failed', requestUrl.origin));
    }
  }

  // No code and no error - redirect to home
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 