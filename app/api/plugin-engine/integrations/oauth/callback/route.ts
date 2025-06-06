/**
 * OAuth callback handler for integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { IntegrationManager } from '@/lib/plugin-engine';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize integration manager
const integrationManager = IntegrationManager.getInstance();

/**
 * Handle OAuth callback
 * GET /api/plugin-engine/integrations/oauth/callback
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Check for errors from OAuth provider
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(new URL('/dashboard/integrations?error=' + encodeURIComponent(error), request.url));
    }
    
    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(new URL('/dashboard/integrations?error=invalid_callback', request.url));
    }
    
    // Parse state parameter (contains toolName and CSRF token)
    let parsedState;
    try {
      parsedState = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (e) {
      return NextResponse.redirect(new URL('/dashboard/integrations?error=invalid_state', request.url));
    }
    
    const { toolName, csrf } = parsedState;
    
    if (!toolName) {
      return NextResponse.redirect(new URL('/dashboard/integrations?error=missing_tool', request.url));
    }
    
    // Get the user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.redirect(new URL('/login?redirect=/dashboard/integrations', request.url));
    }
    
    const userId = session.user.id;
    
    // Verify CSRF token (should be stored in the user's session)
    const { data: storedCsrf } = await supabase
      .from('oauth_states')
      .select('csrf_token')
      .eq('user_id', userId)
      .eq('tool_name', toolName)
      .single();
      
    if (!storedCsrf || storedCsrf.csrf_token !== csrf) {
      return NextResponse.redirect(new URL('/dashboard/integrations?error=csrf_mismatch', request.url));
    }
    
    // Exchange code for tokens (this would be different for each provider)
    let tokenResponse;
    
    switch (toolName) {
      case 'gmail':
      case 'google':
        tokenResponse = await exchangeGoogleCode(code);
        break;
      case 'notion':
        tokenResponse = await exchangeNotionCode(code);
        break;
      case 'slack':
        tokenResponse = await exchangeSlackCode(code);
        break;
      case 'asana':
        tokenResponse = await exchangeAsanaCode(code);
        break;
      default:
        return NextResponse.redirect(new URL(`/dashboard/integrations?error=unsupported_tool&tool=${toolName}`, request.url));
    }
    
    if (!tokenResponse.success) {
      return NextResponse.redirect(new URL(`/dashboard/integrations?error=${tokenResponse.error}`, request.url));
    }
    
    // Store the integration
    await integrationManager.storeIntegration({
      userId,
      toolName,
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      expiresAt: tokenResponse.expiresAt,
      status: 'active',
      scopes: tokenResponse.scopes || [],
      metadata: tokenResponse.metadata || {}
    });
    
    // Clean up the stored CSRF token
    await supabase
      .from('oauth_states')
      .delete()
      .eq('user_id', userId)
      .eq('tool_name', toolName);
    
    // Redirect to success page
    return NextResponse.redirect(new URL(`/dashboard/integrations?success=true&tool=${toolName}`, request.url));
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(new URL('/dashboard/integrations?error=' + encodeURIComponent(errorMessage), request.url));
  }
}

/**
 * Exchange Google OAuth code for tokens
 */
async function exchangeGoogleCode(code: string) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri) {
      return { success: false, error: 'missing_google_credentials' };
    }
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Google OAuth error:', data);
      return { success: false, error: 'google_token_exchange_failed' };
    }
    
    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scopes: data.scope.split(' '),
      metadata: {
        tokenType: data.token_type,
        idToken: data.id_token,
      },
    };
  } catch (error) {
    console.error('Error exchanging Google code:', error);
    return { success: false, error: 'google_exchange_error' };
  }
}

/**
 * Exchange Notion OAuth code for tokens
 */
async function exchangeNotionCode(code: string) {
  try {
    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectUri = process.env.NOTION_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri) {
      return { success: false, error: 'missing_notion_credentials' };
    }
    
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Notion OAuth error:', data);
      return { success: false, error: 'notion_token_exchange_failed' };
    }
    
    // Notion tokens don't expire, but we'll set a long expiration for consistency
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: null, // Notion doesn't use refresh tokens
      expiresAt: oneYearFromNow.toISOString(),
      scopes: [],
      metadata: {
        workspaceId: data.workspace_id,
        workspaceName: data.workspace_name,
        workspaceIcon: data.workspace_icon,
        botId: data.bot_id,
      },
    };
  } catch (error) {
    console.error('Error exchanging Notion code:', error);
    return { success: false, error: 'notion_exchange_error' };
  }
}

/**
 * Exchange Slack OAuth code for tokens
 */
async function exchangeSlackCode(code: string) {
  try {
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const redirectUri = process.env.SLACK_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri) {
      return { success: false, error: 'missing_slack_credentials' };
    }
    
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      console.error('Slack OAuth error:', data);
      return { success: false, error: 'slack_token_exchange_failed' };
    }
    
    // Slack tokens don't have an explicit expiration, but we'll set a long expiration for consistency
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt: oneYearFromNow.toISOString(),
      scopes: data.scope.split(','),
      metadata: {
        teamId: data.team.id,
        teamName: data.team.name,
        authedUserId: data.authed_user.id,
        botUserId: data.bot_user_id,
      },
    };
  } catch (error) {
    console.error('Error exchanging Slack code:', error);
    return { success: false, error: 'slack_exchange_error' };
  }
}

/**
 * Exchange Asana OAuth code for tokens
 */
async function exchangeAsanaCode(code: string) {
  try {
    const clientId = process.env.ASANA_CLIENT_ID;
    const clientSecret = process.env.ASANA_CLIENT_SECRET;
    const redirectUri = process.env.ASANA_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri) {
      return { success: false, error: 'missing_asana_credentials' };
    }
    
    const response = await fetch('https://app.asana.com/-/oauth_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Asana OAuth error:', data);
      return { success: false, error: 'asana_token_exchange_failed' };
    }
    
    // Calculate expiration time
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
    
    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt,
      scopes: ['default'], // Asana doesn't return scopes in the token response
      metadata: {
        tokenType: data.token_type,
        expiresIn: data.expires_in,
      },
    };
  } catch (error) {
    console.error('Error exchanging Asana code:', error);
    return { success: false, error: 'asana_exchange_error' };
  }
}
