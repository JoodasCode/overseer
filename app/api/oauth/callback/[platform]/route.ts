import { NextRequest, NextResponse } from 'next/server';
import { oauthManager } from '@/lib/integrations/oauth-manager';
import { supabase } from '@/lib/supabase-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log(`🔗 OAuth callback for ${platform}:`, { code: !!code, state, error });

    // Handle OAuth error
    if (error) {
      console.error(`OAuth error for ${platform}:`, error);
      return NextResponse.redirect(
        new URL(`/integrations?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Validate code parameter
    if (!code) {
      console.error(`No authorization code provided for ${platform}`);
      return NextResponse.redirect(
        new URL(`/integrations?error=no_code`, request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await oauthManager.exchangeCodeForTokens(platform, code, state || undefined);
    
    if (!tokens) {
      console.error(`Failed to exchange code for tokens: ${platform}`);
      return NextResponse.redirect(
        new URL(`/integrations?error=token_exchange_failed`, request.url)
      );
    }

    // Test the connection
    const isConnectionValid = await oauthManager.testConnection(platform, tokens.accessToken);
    
    if (!isConnectionValid) {
      console.error(`Connection test failed for ${platform}`);
      return NextResponse.redirect(
        new URL(`/integrations?error=connection_test_failed`, request.url)
      );
    }

    // Get user from session (you'll need to implement this based on your auth system)
    const authHeader = request.headers.get('authorization');
    
    let userId: string | null = null;
    
    // Try to get user ID from session/cookies or state parameter
    if (state) {
      // You can encode user ID in state parameter for security
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = stateData.userId;
      } catch (e) {
        console.error('Failed to decode state parameter:', e);
      }
    }

    if (!userId) {
      console.error('No user ID found in OAuth callback');
      return NextResponse.redirect(
        new URL(`/integrations?error=no_user_id`, request.url)
      );
    }

    // Store tokens in database
    const { error: dbError } = await supabase
      .from('integrations')
      .upsert({
        user_id: userId,
        platform,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt?.toISOString(),
        scope: tokens.scope,
        is_active: true,
        connected_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error(`Failed to store integration tokens for ${platform}:`, dbError);
      return NextResponse.redirect(
        new URL(`/integrations?error=database_error`, request.url)
      );
    }

    console.log(`✅ Successfully connected ${platform} for user ${userId}`);

    // Redirect back to integrations page with success
    return NextResponse.redirect(
      new URL(`/integrations?connected=${platform}`, request.url)
    );

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/integrations?error=unexpected_error`, request.url)
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
} 