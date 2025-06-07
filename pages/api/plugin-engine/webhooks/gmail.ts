/**
 * Gmail Webhook Handler
 * 
 * This API route handles incoming webhook notifications from Gmail via Google Pub/Sub.
 * It verifies the request, processes the notification, and triggers appropriate actions.
 * 
 * Gmail uses Google Pub/Sub for push notifications:
 * https://developers.google.com/gmail/api/guides/push
 */

import { NextApiRequest, NextApiResponse } from 'next';
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
    tool: 'gmail',
    action,
    errorCode: 'GMAIL_WEBHOOK_ERROR',
    errorMessage: errorMessage,
    agentId: 'system',
    userId: 'system',
    payload: { details: JSON.stringify(error) },
    timestamp: new Date().toISOString(),
    resolved: false
  }).catch(console.error);
};

/**
 * Verify Google Pub/Sub message
 * @param req - The incoming request
 * @returns boolean indicating if the request is valid
 */
const verifyPubSubMessage = (req: NextApiRequest): boolean => {
  try {
    // In production, you may want to verify using Google-provided JWT
    // For simplicity, we're checking basic request structure
    const message = req.body?.message;
    return !!message && !!message.data;
  } catch (error) {
    logError(error, 'verifyPubSubMessage');
    return false;
  }
};

/**
 * Process Gmail notification
 * @param data - The notification data
 * @param subscription - The subscription ID
 */
const processGmailNotification = async (data: string, subscription: string): Promise<void> => {
  try {
    // Decode base64 data
    const decodedData = Buffer.from(data, 'base64').toString('utf-8');
    const notificationData = JSON.parse(decodedData);
    
    // Extract user email from the historyId notification
    // Format: {emailAddress}:{historyId}
    const [userEmail, historyId] = notificationData.emailAddress ? 
      notificationData.emailAddress.split(':') : 
      [null, null];
    
    if (!userEmail || !historyId) {
      logError('Invalid Gmail notification format', 'processGmailNotification');
      return;
    }

    // Store the notification in the database
    await supabase
      .from('webhook_events')
      .insert({
        provider: 'gmail',
        user_id: userEmail,
        event_type: 'history_update',
        event_id: `gmail-${Date.now()}`,
        payload: {
          historyId,
          subscription,
          raw: notificationData
        },
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    
    // Get plugin engine instance
    const pluginEngine = PluginEngine.getInstance();
    const gmailAdapter = pluginEngine.getAdapter('gmail');
    
    // If adapter exists and is connected, process the notification
    if (gmailAdapter && await gmailAdapter.isConnected(userEmail)) {
      // Fetch the history changes since the last known historyId
      // This would typically be implemented in the GmailAdapter
      // For example:
      // const changes = await gmailAdapter.fetchHistoryChanges(userEmail, historyId);
      
      // Process the changes (new emails, modifications, etc.)
      // This could trigger notifications or other actions
    }
  } catch (error) {
    logError(error, 'processGmailNotification');
  }
};

/**
 * Main handler for Gmail webhook notifications
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
    // Verify the request is from Google Pub/Sub
    if (!verifyPubSubMessage(req)) {
      return res.status(401).json({ error: 'Invalid message format' });
    }

    const { message, subscription } = req.body;
    const { data } = message;

    // Process the notification asynchronously
    if (data) {
      // We don't await this to respond quickly to Google
      processGmailNotification(data, subscription)
        .catch(error => logError(error, 'processGmailNotification'));
    }

    // Respond quickly to Google Pub/Sub
    return res.status(200).json({ received: true });
  } catch (error) {
    logError(error, 'handler');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
