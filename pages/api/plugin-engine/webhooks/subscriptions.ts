/**
 * Webhook Subscription Management API
 * 
 * This API handles creating, updating, and deleting webhook subscriptions
 * for integrated services like Slack, Gmail, and Asana.
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
    tool: 'webhook_subscriptions',
    action,
    errorCode: 'WEBHOOK_SUBSCRIPTION_ERROR',
    errorMessage: errorMessage,
    agentId: 'system',
    userId: 'system',
    payload: { details: JSON.stringify(error) },
    timestamp: new Date().toISOString(),
    resolved: false
  }).catch(console.error);
};

/**
 * Create a Slack webhook subscription
 * @param teamId - Slack team ID
 * @param token - Slack access token
 */
async function createSlackSubscription(teamId: string, token: string) {
  try {
    // Slack uses Events API for webhooks
    // We need to register our app with the Events API and configure event subscriptions
    // This is typically done in the Slack API dashboard
    
    // For this implementation, we'll store the subscription info in our database
    const { data, error } = await supabase
      .from('webhook_subscriptions')
      .insert({
        provider: 'slack',
        team_id: teamId,
        subscription_id: `slack-${teamId}`,
        endpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/plugin-engine/webhooks/slack`,
        events: ['message', 'channel_created', 'team_join'],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    logError(error, 'createSlackSubscription');
    throw error;
  }
}

/**
 * Create a Gmail webhook subscription
 * @param userId - User's email address
 * @param token - Gmail access token
 */
async function createGmailSubscription(userId: string, token: string) {
  try {
    // Gmail uses Google Pub/Sub for push notifications
    // We need to create a topic, subscription, and watch for changes
    
    // Create a watch request to Gmail API
    const response = await axios.post(
      'https://www.googleapis.com/gmail/v1/users/me/watch',
      {
        topicName: `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/topics/gmail-notifications`,
        labelIds: ['INBOX'],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    // Store the subscription info
    const { data, error } = await supabase
      .from('webhook_subscriptions')
      .insert({
        provider: 'gmail',
        user_id: userId,
        subscription_id: response.data.historyId,
        endpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/plugin-engine/webhooks/gmail`,
        events: ['messageReceived', 'messageChanged'],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    logError(error, 'createGmailSubscription');
    throw error;
  }
}

/**
 * Create an Asana webhook subscription
 * @param workspaceId - Asana workspace ID
 * @param resourceId - Asana resource ID (project or task)
 * @param token - Asana access token
 */
async function createAsanaSubscription(workspaceId: string, resourceId: string, token: string) {
  try {
    // Create a webhook in Asana
    const response = await axios.post(
      'https://app.asana.com/api/1.0/webhooks',
      {
        resource: resourceId,
        target: `${process.env.NEXT_PUBLIC_APP_URL}/api/plugin-engine/webhooks/asana`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    // Store the subscription info
    const { data, error } = await supabase
      .from('webhook_subscriptions')
      .insert({
        provider: 'asana',
        team_id: workspaceId,
        resource_id: resourceId,
        subscription_id: response.data.data.gid,
        endpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/plugin-engine/webhooks/asana`,
        events: ['added', 'changed', 'removed'],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    logError(error, 'createAsanaSubscription');
    throw error;
  }
}

/**
 * Delete a webhook subscription
 * @param provider - Service provider (slack, gmail, asana)
 * @param subscriptionId - Subscription ID
 */
async function deleteSubscription(provider: string, subscriptionId: string) {
  try {
    // Get the subscription details
    const { data: subscription, error: fetchError } = await supabase
      .from('webhook_subscriptions')
      .select('*')
      .eq('provider', provider)
      .eq('subscription_id', subscriptionId)
      .single();
    
    if (fetchError || !subscription) {
      throw new Error(`Subscription not found: ${provider}/${subscriptionId}`);
    }
    
    // Delete the subscription from the provider
    switch (provider) {
      case 'asana':
        // Delete Asana webhook
        await axios.delete(`https://app.asana.com/api/1.0/webhooks/${subscriptionId}`, {
          headers: {
            Authorization: `Bearer ${subscription.token}`,
          },
        });
        break;
        
      case 'gmail':
        // Stop Gmail watch
        await axios.post(
          'https://www.googleapis.com/gmail/v1/users/me/stop',
          {},
          {
            headers: {
              Authorization: `Bearer ${subscription.token}`,
            },
          }
        );
        break;
        
      case 'slack':
        // Slack doesn't have an API to delete webhooks
        // They are managed through the Slack API dashboard
        break;
    }
    
    // Delete from our database
    const { error: deleteError } = await supabase
      .from('webhook_subscriptions')
      .delete()
      .eq('provider', provider)
      .eq('subscription_id', subscriptionId);
    
    if (deleteError) throw deleteError;
    
    return { success: true, message: 'Subscription deleted' };
  } catch (error) {
    logError(error, 'deleteSubscription');
    throw error;
  }
}

/**
 * Main handler for webhook subscription management
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get the current user from the request
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        // List subscriptions
        const { data: subscriptions, error: listError } = await supabase
          .from('webhook_subscriptions')
          .select('*')
          .eq('user_id', userId);
        
        if (listError) {
          throw listError;
        }
        
        return res.status(200).json({ subscriptions });
        
      case 'POST':
        // Create subscription
        const { provider, teamId, resourceId, token } = req.body;
        
        if (!provider || !token) {
          return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        let subscription;
        
        switch (provider) {
          case 'slack':
            if (!teamId) {
              return res.status(400).json({ error: 'Missing teamId parameter' });
            }
            subscription = await createSlackSubscription(teamId, token);
            break;
            
          case 'gmail':
            subscription = await createGmailSubscription(userId, token);
            break;
            
          case 'asana':
            if (!teamId || !resourceId) {
              return res.status(400).json({ error: 'Missing teamId or resourceId parameter' });
            }
            subscription = await createAsanaSubscription(teamId, resourceId, token);
            break;
            
          default:
            return res.status(400).json({ error: 'Unsupported provider' });
        }
        
        return res.status(201).json({ subscription });
        
      case 'DELETE':
        // Delete subscription
        const { provider: deleteProvider, subscriptionId } = req.query;
        
        if (!deleteProvider || !subscriptionId) {
          return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        const result = await deleteSubscription(
          deleteProvider as string,
          subscriptionId as string
        );
        
        return res.status(200).json(result);
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    logError(error, 'handler');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
