/**
 * OAuth callback handler for plugin integrations
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
 * OAuth callback handler
 * GET /api/plugin-engine/oauth/callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');
    const tool = searchParams.get('tool');
    
    // Handle OAuth errors
    if (error) {
      console.error(`OAuth error for ${tool}:`, error);
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=${error}&tool=${tool}`, request.url)
      );
    }
    
    // Validate required parameters
    if (!code || !state || !tool) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=missing_params', request.url)
      );
    }
    
    // Verify state to prevent CSRF
    // State should contain the user ID and a random string, separated by a colon
    const [userId, csrf] = state.split(':');
    
    if (!userId || !csrf) {
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=invalid_state&tool=${tool}`, request.url)
      );
    }
    
    // Get the user session to verify the user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || session.user.id !== userId) {
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=unauthorized&tool=${tool}`, request.url)
      );
    }
    
    // Exchange the code for tokens
    // This would be different for each tool
    let integration;
    
    switch (tool) {
      case 'gmail':
        integration = await exchangeGmailCode(code, userId);
        break;
      case 'notion':
        integration = await exchangeNotionCode(code, userId);
        break;
      case 'slack':
        integration = await exchangeSlackCode(code, userId);
        break;
      default:
        return NextResponse.redirect(
          new URL(`/dashboard/integrations?error=unsupported_tool&tool=${tool}`, request.url)
        );
    }
    
    // Store the integration
    await integrationManager.storeIntegration(integration);
    
    // Redirect to the integrations page
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?success=true&tool=${tool}`, request.url)
    );
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const tool = request.nextUrl.searchParams.get('tool') || 'unknown';
    
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${encodeURIComponent(errorMessage)}&tool=${tool}`, request.url)
    );
  }
}

/**
 * Exchange Gmail OAuth code for tokens
 */
async function exchangeGmailCode(code: string, userId: string) {
  // In a real implementation, this would call the Google OAuth token endpoint
  // For now, we'll return a simulated integration
  
  return {
    userId,
    toolName: 'gmail',
    accessToken: 'simulated_gmail_token',
    refreshToken: 'simulated_refresh_token',
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
    status: 'active' as const,
    scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly']
  };
}

/**
 * Exchange Notion OAuth code for tokens
 */
async function exchangeNotionCode(code: string, userId: string) {
  // In a real implementation, this would call the Notion OAuth token endpoint
  // For now, we'll return a simulated integration
  
  return {
    userId,
    toolName: 'notion',
    accessToken: 'simulated_notion_token',
    refreshToken: 'simulated_refresh_token',
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), // 7 days from now
    status: 'active' as const,
    scopes: ['read_content', 'update_content', 'insert_content']
  };
}

/**
 * Exchange Slack OAuth code for tokens
 */
async function exchangeSlackCode(code: string, userId: string) {
  // In a real implementation, this would call the Slack OAuth token endpoint
  // For now, we'll return a simulated integration
  
  return {
    userId,
    toolName: 'slack',
    accessToken: 'simulated_slack_token',
    refreshToken: 'simulated_slack_refresh_token',
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(), // 30 days from now
    status: 'active' as const,
    scopes: ['chat:write', 'channels:read', 'channels:history', 'files:write', 'users:read']
  };
}
