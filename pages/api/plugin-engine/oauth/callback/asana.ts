/**
 * Asana OAuth callback handler
 * 
 * This API route handles the OAuth callback from Asana after a user authorizes the application.
 * It exchanges the authorization code for access tokens and stores them in the database.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Asana OAuth configuration
const ASANA_CLIENT_ID = process.env.ASANA_CLIENT_ID || '';
const ASANA_CLIENT_SECRET = process.env.ASANA_CLIENT_SECRET || '';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/plugin-engine/oauth/callback/asana`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract authorization code and state from query parameters
  const { code, state, error } = req.query;
  
  // Handle OAuth errors
  if (error) {
    console.error('Asana OAuth error:', error);
    return res.redirect(`/settings/integrations?error=${encodeURIComponent(error as string)}`);
  }
  
  // Validate state to prevent CSRF attacks
  if (!state) {
    return res.redirect('/settings/integrations?error=invalid_state');
  }
  
  try {
    // Parse state to get user ID
    const { userId } = JSON.parse(Buffer.from(state as string, 'base64').toString());
    
    if (!userId) {
      throw new Error('Invalid state: missing user ID');
    }
    
    // Exchange authorization code for access token
    const tokenResponse = await axios.post('https://app.asana.com/-/oauth_token', {
      grant_type: 'authorization_code',
      client_id: ASANA_CLIENT_ID,
      client_secret: ASANA_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Extract tokens from response
    const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } = tokenResponse.data;
    
    // Calculate token expiration date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
    
    // Get user information from Asana
    const userResponse = await axios.get('https://app.asana.com/api/1.0/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const asanaUserId = userResponse.data.data.gid;
    const asanaUserName = userResponse.data.data.name;
    const asanaUserEmail = userResponse.data.data.email;
    
    // Store integration in database
    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert({
        userId,
        toolName: 'asana',
        accessToken,
        refreshToken,
        status: 'active',
        scopes: ['default'],
        metadata: {
          asanaUserId,
          asanaUserName,
          asanaUserEmail,
          expiresAt: expiresAt.toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    
    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }
    
    // Redirect back to the integrations page with success message
    return res.redirect('/settings/integrations?success=true&provider=asana');
  } catch (error) {
    console.error('Error in Asana OAuth callback:', error);
    return res.redirect(`/settings/integrations?error=${encodeURIComponent((error as Error).message)}`);
  }
}
