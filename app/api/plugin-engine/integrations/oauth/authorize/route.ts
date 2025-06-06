/**
 * API route for initiating OAuth flows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Initiate OAuth flow
 * GET /api/plugin-engine/integrations/oauth/authorize
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const toolName = searchParams.get('toolName');
    
    // Validate the request
    if (!toolName) {
      return NextResponse.json(
        { error: 'Missing required parameter: toolName' },
        { status: 400 }
      );
    }
    
    // Get the user ID from the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Generate CSRF token
    const csrfToken = crypto.randomBytes(32).toString('hex');
    
    // Store CSRF token in database
    await supabase
      .from('oauth_states')
      .upsert({
        user_id: userId,
        tool_name: toolName,
        csrf_token: csrfToken,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes expiry
      }, {
        onConflict: 'user_id,tool_name'
      });
    
    // Create state parameter (base64 encoded JSON)
    const state = Buffer.from(JSON.stringify({
      toolName,
      csrf: csrfToken
    })).toString('base64');
    
    // Get OAuth URL based on tool
    let authUrl;
    
    switch (toolName) {
      case 'gmail':
      case 'google':
        authUrl = getGoogleAuthUrl(state);
        break;
      case 'notion':
        authUrl = getNotionAuthUrl(state);
        break;
      case 'slack':
        authUrl = getSlackAuthUrl(state);
        break;
      case 'asana':
        authUrl = getAsanaAuthUrl(state);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported tool: ${toolName}` },
          { status: 400 }
        );
    }
    
    if (!authUrl) {
      return NextResponse.json(
        { error: 'Failed to generate authorization URL' },
        { status: 500 }
      );
    }
    
    // Return the authorization URL
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error initiating OAuth flow:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to initiate OAuth flow: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Get Google OAuth URL
 */
function getGoogleAuthUrl(state: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/drive.readonly'
  ];
  
  if (!clientId || !redirectUri) {
    console.error('Missing Google OAuth credentials');
    return null;
  }
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent', // Force to show consent screen to get refresh token
    state
  });
  
  return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
}

/**
 * Get Notion OAuth URL
 */
function getNotionAuthUrl(state: string) {
  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = process.env.NOTION_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    console.error('Missing Notion OAuth credentials');
    return null;
  }
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state
  });
  
  return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
}

/**
 * Get Slack OAuth URL
 */
function getSlackAuthUrl(state: string) {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;
  const scopes = [
    'chat:write',
    'channels:read',
    'channels:history',
    'users:read',
    'team:read'
  ];
  
  if (!clientId || !redirectUri) {
    console.error('Missing Slack OAuth credentials');
    return null;
  }
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(','),
    state
  });
  
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

/**
 * Get Asana OAuth URL
 */
function getAsanaAuthUrl(state: string) {
  const clientId = process.env.ASANA_CLIENT_ID;
  const redirectUri = process.env.ASANA_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    console.error('Missing Asana OAuth credentials');
    return null;
  }
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state
  });
  
  return `https://app.asana.com/-/oauth_authorize?${params.toString()}`;
}
