/**
 * Slack Webhook Handler
 * 
 * This API route handles incoming webhook events from Slack.
 * It verifies the request signature, processes events, and stores relevant data.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
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
    tool: 'slack',
    action,
    errorCode: 'SLACK_WEBHOOK_ERROR',
    errorMessage: errorMessage,
    agentId: 'system',
    userId: 'system',
    payload: { details: JSON.stringify(error) },
    timestamp: new Date().toISOString(),
    resolved: false
  }).catch(console.error);
};

/**
 * Verify Slack request signature
 * @param req - The incoming request
 * @returns boolean indicating if the request is valid
 */
const verifySlackSignature = (req: NextApiRequest): boolean => {
  try {
    const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
    if (!slackSigningSecret) {
      logError('Slack signing secret not configured', 'verifySlackSignature');
      return false;
    }

    const slackSignature = req.headers['x-slack-signature'] as string;
    const timestamp = req.headers['x-slack-request-timestamp'] as string;
    
    // Prevent replay attacks
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - parseInt(timestamp, 10)) > 300) {
      return false;
    }

    const rawBody = JSON.stringify(req.body);
    const baseString = `v0:${timestamp}:${rawBody}`;
    const hmac = crypto.createHmac('sha256', slackSigningSecret);
    const calculatedSignature = `v0=${hmac.update(baseString).digest('hex')}`;
    
    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(slackSignature)
    );
  } catch (error) {
    logError(error, 'verifySlackSignature');
    return false;
  }
};

/**
 * Process Slack event and store in database
 * @param event - The Slack event data
 * @param teamId - The Slack team ID
 */
const processSlackEvent = async (event: any, teamId: string): Promise<void> => {
  try {
    // Store the event in the database for processing
    await supabase
      .from('webhook_events')
      .insert({
        provider: 'slack',
        team_id: teamId,
        event_type: event.type,
        event_id: event.event_id || `slack-${Date.now()}`,
        payload: event,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    
    // Get plugin engine instance
    const pluginEngine = PluginEngine.getInstance();
    const slackAdapter = pluginEngine.getAdapter('slack');
    
    // If adapter exists and is connected, process the event
    if (slackAdapter && await slackAdapter.isConnected(teamId)) {
      // Handle different event types
      switch (event.type) {
        case 'message':
          // Process message event
          // This could trigger notifications or other actions
          break;
        case 'channel_created':
          // Process channel creation
          break;
        // Add more event handlers as needed
        default:
          // Store unknown events for future processing
          break;
      }
    }
  } catch (error) {
    logError(error, 'processSlackEvent');
  }
};

/**
 * Main handler for Slack webhook events
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handle URL verification challenge from Slack
    if (req.body.type === 'url_verification') {
      return res.status(200).json({ challenge: req.body.challenge });
    }

    // Verify the request is from Slack
    if (!verifySlackSignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { team_id: teamId, event } = req.body;

    // Process the event asynchronously
    if (event) {
      // We don't await this to respond quickly to Slack
      processSlackEvent(event, teamId)
        .catch(error => logError(error, 'processSlackEvent'));
    }

    // Respond quickly to Slack
    return res.status(200).json({ received: true });
  } catch (error) {
    logError(error, 'handler');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
