/**
 * Trello OAuth callback handler
 * 
 * This API route handles the OAuth callback from Trello after a user authorizes the application.
 * It exchanges the authorization code for access tokens and stores them in the database.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Trello OAuth configuration
const TRELLO_API_KEY = process.env.TRELLO_API_KEY || '';
const TRELLO_API_SECRET = process.env.TRELLO_API_SECRET || '';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/plugin-engine/oauth/callback/trello`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract authorization code and state from query parameters
  const { code, state, error } = req.query;
  
  // Handle OAuth errors
  if (error) {
    console.error('Trello OAuth error:', error);
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
    const tokenResponse = await axios.post('https://trello.com/1/OAuthGetAccessToken', null, {
      params: {
        oauth_consumer_key: TRELLO_API_KEY,
        oauth_token: code,
        oauth_verifier: req.query.oauth_verifier,
      },
    });
    
    // Extract tokens from response
    const { oauth_token: accessToken, oauth_token_secret: tokenSecret } = tokenResponse.data;
    
    // Get user information from Trello
    const userResponse = await axios.get('https://api.trello.com/1/members/me', {
      params: {
        key: TRELLO_API_KEY,
        token: accessToken,
      },
    });
    
    const trelloUserId = userResponse.data.id;
    const trelloUsername = userResponse.data.username;
    
    // Store integration in database
    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert({
        userId,
        toolName: 'trello',
        accessToken,
        refreshToken: tokenSecret, // Trello doesn't use refresh tokens, but we store the token secret here
        status: 'active',
        scopes: ['read', 'write'],
        metadata: {
          apiKey: TRELLO_API_KEY,
          trelloUserId,
          trelloUsername,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    
    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }
    
    // Redirect back to the integrations page with success message
    return res.redirect('/settings/integrations?success=true&provider=trello');
  } catch (error) {
    console.error('Error in Trello OAuth callback:', error);
    return res.redirect(`/settings/integrations?error=${encodeURIComponent((error as Error).message)}`);
  }
}
