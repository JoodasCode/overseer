/**
 * Webhook Token Refresh Mechanism
 * 
 * This API handles refreshing OAuth tokens for webhook subscriptions
 * and renewing subscriptions that are about to expire.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { PluginEngine } from '../../../../lib/plugin-engine/plugin-engine';
import { ErrorHandler } from '../../../../lib/plugin-engine/error-handler';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize error handler
const errorHandler = ErrorHandler.getInstance();

// Define error logging helper
const logError = (error: unknown, action: string) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  errorHandler.logError({
    tool: 'webhook_refresh',
    action,
    errorCode: 'WEBHOOK_REFRESH_ERROR',
    errorMessage: errorMessage,
    agentId: 'system',
    userId: 'system',
    payload: { details: JSON.stringify(error) },
    timestamp: new Date().toISOString(),
    resolved: false
  }).catch(console.error);
};

/**
 * Refresh Gmail webhook subscription
 * @param subscription - The subscription to refresh
 */
async function refreshGmailSubscription(subscription: any) {
  try {
    // Get the user's refresh token from the database
    const { data: oauthData, error: oauthError } = await supabase
      .from('oauth_tokens')
      .select('refresh_token')
      .eq('provider', 'gmail')
      .eq('user_id', subscription.user_id)
      .single();
    
    if (oauthError || !oauthData?.refresh_token) {
      throw new Error(`No refresh token found for user ${subscription.user_id}`);
    }
    
    // Refresh the access token
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: oauthData.refresh_token,
        grant_type: 'refresh_token',
      }
    );
    
    const newAccessToken = tokenResponse.data.access_token;
    
    // Update the token in the database
    await supabase
      .from('oauth_tokens')
      .update({
        access_token: newAccessToken,
        updated_at: new Date().toISOString(),
      })
      .eq('provider', 'gmail')
      .eq('user_id', subscription.user_id);
    
    // Renew the Gmail watch
    const watchResponse = await axios.post(
      'https://www.googleapis.com/gmail/v1/users/me/watch',
      {
        topicName: `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/topics/gmail-notifications`,
        labelIds: ['INBOX'],
      },
      {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
        },
      }
    );
    
    // Update the subscription with new expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await supabase
      .from('webhook_subscriptions')
      .update({
        subscription_id: watchResponse.data.historyId,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
      })
      .eq('id', subscription.id);
    
    return {
      success: true,
      message: `Gmail subscription renewed until ${expiresAt.toISOString()}`,
    };
  } catch (error) {
    logError(error, 'refreshGmailSubscription');
    
    // Update subscription status to error
    await supabase
      .from('webhook_subscriptions')
      .update({
        status: 'error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);
    
    throw error;
  }
}

/**
 * Refresh Asana webhook subscription
 * @param subscription - The subscription to refresh
 */
async function refreshAsanaSubscription(subscription: any) {
  try {
    // Get the user's refresh token from the database
    const { data: oauthData, error: oauthError } = await supabase
      .from('oauth_tokens')
      .select('refresh_token')
      .eq('provider', 'asana')
      .eq('user_id', subscription.user_id)
      .single();
    
    if (oauthError || !oauthData?.refresh_token) {
      throw new Error(`No refresh token found for user ${subscription.user_id}`);
    }
    
    // Refresh the access token
    const tokenResponse = await axios.post(
      'https://app.asana.com/-/oauth_token',
      {
        client_id: process.env.ASANA_CLIENT_ID,
        client_secret: process.env.ASANA_CLIENT_SECRET,
        refresh_token: oauthData.refresh_token,
        grant_type: 'refresh_token',
      }
    );
    
    const newAccessToken = tokenResponse.data.access_token;
    const newRefreshToken = tokenResponse.data.refresh_token;
    
    // Update the tokens in the database
    await supabase
      .from('oauth_tokens')
      .update({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        updated_at: new Date().toISOString(),
      })
      .eq('provider', 'asana')
      .eq('user_id', subscription.user_id);
    
    // For Asana, we need to delete and recreate the webhook
    // Delete the old webhook
    await axios.delete(`https://app.asana.com/api/1.0/webhooks/${subscription.subscription_id}`, {
      headers: {
        Authorization: `Bearer ${newAccessToken}`,
      },
    });
    
    // Create a new webhook
    const webhookResponse = await axios.post(
      'https://app.asana.com/api/1.0/webhooks',
      {
        resource: subscription.resource_id,
        target: subscription.endpoint,
      },
      {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    // Update the subscription
    await supabase
      .from('webhook_subscriptions')
      .update({
        subscription_id: webhookResponse.data.data.gid,
        updated_at: new Date().toISOString(),
        status: 'active',
      })
      .eq('id', subscription.id);
    
    return {
      success: true,
      message: 'Asana subscription renewed successfully',
    };
  } catch (error) {
    logError(error, 'refreshAsanaSubscription');
    
    // Update subscription status to error
    await supabase
      .from('webhook_subscriptions')
      .update({
        status: 'error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);
    
    throw error;
  }
}

/**
 * Refresh Slack webhook subscription
 * @param subscription - The subscription to refresh
 */
async function refreshSlackSubscription(subscription: any) {
  try {
    // Get the user's refresh token from the database
    const { data: oauthData, error: oauthError } = await supabase
      .from('oauth_tokens')
      .select('refresh_token')
      .eq('provider', 'slack')
      .eq('team_id', subscription.team_id)
      .single();
    
    if (oauthError || !oauthData?.refresh_token) {
      throw new Error(`No refresh token found for team ${subscription.team_id}`);
    }
    
    // Refresh the access token
    const tokenResponse = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        refresh_token: oauthData.refresh_token,
        grant_type: 'refresh_token',
      }
    );
    
    const newAccessToken = tokenResponse.data.access_token;
    const newRefreshToken = tokenResponse.data.refresh_token;
    
    // Update the tokens in the database
    await supabase
      .from('oauth_tokens')
      .update({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        updated_at: new Date().toISOString(),
      })
      .eq('provider', 'slack')
      .eq('team_id', subscription.team_id);
    
    // For Slack, the Events API subscription doesn't need to be refreshed
    // Just update the subscription status
    await supabase
      .from('webhook_subscriptions')
      .update({
        updated_at: new Date().toISOString(),
        status: 'active',
      })
      .eq('id', subscription.id);
    
    return {
      success: true,
      message: 'Slack tokens refreshed successfully',
    };
  } catch (error) {
    logError(error, 'refreshSlackSubscription');
    
    // Update subscription status to error
    await supabase
      .from('webhook_subscriptions')
      .update({
        status: 'error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);
    
    throw error;
  }
}

/**
 * Check and refresh expiring subscriptions
 */
async function checkAndRefreshSubscriptions() {
  try {
    // Get subscriptions that will expire in the next 24 hours or are in error state
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const { data: subscriptions, error } = await supabase
      .from('webhook_subscriptions')
      .select('*')
      .or(`expires_at.lte.${tomorrow.toISOString()},status.eq.error`);
    
    if (error) throw error;
    
    if (!subscriptions || subscriptions.length === 0) {
      return { message: 'No subscriptions to refresh' };
    }
    
    // Process each subscription
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        switch (subscription.provider) {
          case 'gmail':
            return refreshGmailSubscription(subscription);
          case 'asana':
            return refreshAsanaSubscription(subscription);
          case 'slack':
            return refreshSlackSubscription(subscription);
          default:
            return { success: false, message: `Unsupported provider: ${subscription.provider}` };
        }
      })
    );
    
    return {
      message: `Processed ${results.length} subscriptions`,
      results: results.map((result, index) => ({
        subscription: subscriptions[index].id,
        provider: subscriptions[index].provider,
        status: result.status,
        result: result.status === 'fulfilled' ? result.value : { error: 'Failed to refresh' },
      })),
    };
  } catch (error) {
    logError(error, 'checkAndRefreshSubscriptions');
    throw error;
  }
}

/**
 * Main handler for webhook token refresh
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Check for API key or other authorization
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.WEBHOOK_REFRESH_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Process the request
    const result = await checkAndRefreshSubscriptions();
    
    return res.status(200).json(result);
  } catch (error) {
    logError(error, 'handler');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
