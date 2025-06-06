/**
 * OAuth Authorization Route
 * Handles the initial OAuth flow for plugin integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OAuth configuration for different tools
const OAUTH_CONFIG: Record<string, {
  authUrl: string;
  clientId: string;
  scopes: string[];
  redirectUri: string;
}> = {
  gmail: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: process.env.GMAIL_CLIENT_ID || '',
    scopes: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.readonly'
    ],
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/plugin-engine/oauth/callback`
  },
  notion: {
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    clientId: process.env.NOTION_CLIENT_ID || '',
    scopes: ['read_content', 'update_content', 'create_content', 'read_databases'],
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/plugin-engine/oauth/callback`
  },
  slack: {
    authUrl: 'https://slack.com/oauth/v2/authorize',
    clientId: process.env.SLACK_CLIENT_ID || '',
    scopes: [
      'chat:write',
      'channels:read',
      'channels:history',
      'files:write',
      'users:read'
    ],
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/plugin-engine/oauth/callback`
  }
};

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const tool = searchParams.get('tool');
    const state = searchParams.get('state');
    
    // Validate required parameters
    if (!tool) {
      return NextResponse.json(
        { error: 'Missing required parameter: tool' },
        { status: 400 }
      );
    }
    
    if (!state) {
      return NextResponse.json(
        { error: 'Missing required parameter: state' },
        { status: 400 }
      );
    }
    
    // Check if tool is supported
    const toolConfig = OAUTH_CONFIG[tool];
    if (!toolConfig) {
      return NextResponse.json(
        { error: `Unsupported tool: ${tool}` },
        { status: 400 }
      );
    }
    
    // Parse state parameter (format: userId:csrfToken)
    const [userId, csrfToken] = state.split(':');
    
    if (!userId || !csrfToken) {
      return NextResponse.json(
        { error: 'Invalid state parameter format' },
        { status: 400 }
      );
    }
    
    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Store CSRF token in Redis (would be implemented in a real system)
    // This is a security measure to prevent CSRF attacks
    
    // Build authorization URL
    const authUrl = new URL(toolConfig.authUrl);
    
    // Add query parameters
    authUrl.searchParams.append('client_id', toolConfig.clientId);
    authUrl.searchParams.append('redirect_uri', toolConfig.redirectUri);
    authUrl.searchParams.append('scope', toolConfig.scopes.join(' '));
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('response_type', 'code');
    
    // Add tool-specific parameters
    if (tool === 'gmail') {
      authUrl.searchParams.append('access_type', 'offline');
      authUrl.searchParams.append('prompt', 'consent');
    } else if (tool === 'notion') {
      authUrl.searchParams.append('owner', 'user');
    }
    
    // Redirect to authorization URL
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('OAuth authorization error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
