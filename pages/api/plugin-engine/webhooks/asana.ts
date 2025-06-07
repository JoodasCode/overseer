/**
 * Asana Webhook Handler
 * 
 * This API route handles incoming webhook events from Asana.
 * It verifies the request signature, processes events, and stores relevant data.
 * 
 * Asana webhooks documentation:
 * https://developers.asana.com/docs/webhooks
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
    tool: 'asana',
    action,
    errorCode: 'ASANA_WEBHOOK_ERROR',
    errorMessage: errorMessage,
    agentId: 'system',
    userId: 'system',
    payload: { details: JSON.stringify(error) },
    timestamp: new Date().toISOString(),
    resolved: false
  }).catch(console.error);
};

/**
 * Verify Asana webhook signature
 * @param req - The incoming request
 * @returns boolean indicating if the request is valid
 */
const verifyAsanaSignature = (req: NextApiRequest): boolean => {
  try {
    const asanaSecret = process.env.ASANA_WEBHOOK_SECRET;
    if (!asanaSecret) {
      logError('Asana webhook secret not configured', 'verifyAsanaSignature');
      return false;
    }

    const signature = req.headers['x-hook-signature'] as string;
    if (!signature) {
      return false;
    }

    const rawBody = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', asanaSecret);
    const calculatedSignature = hmac.update(rawBody).digest('hex');
    
    return signature === calculatedSignature;
  } catch (error) {
    logError(error, 'verifyAsanaSignature');
    return false;
  }
};

/**
 * Process Asana event and store in database
 * @param event - The Asana event data
 * @param workspaceId - The Asana workspace ID
 */
const processAsanaEvent = async (event: any, workspaceId: string): Promise<void> => {
  try {
    // Store the event in the database for processing
    await supabase
      .from('webhook_events')
      .insert({
        provider: 'asana',
        team_id: workspaceId,
        event_type: event.action,
        event_id: `asana-${Date.now()}`,
        payload: event,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    
    // Get plugin engine instance
    const pluginEngine = PluginEngine.getInstance();
    const asanaAdapter = pluginEngine.getAdapter('asana');
    
    // If adapter exists and is connected, process the event
    if (asanaAdapter && await asanaAdapter.isConnected(workspaceId)) {
      // Handle different event types
      switch (event.action) {
        case 'added':
        case 'changed':
        case 'removed':
          // Process task changes
          // This could trigger notifications or other actions
          break;
        default:
          // Store unknown events for future processing
          break;
      }
    }
  } catch (error) {
    logError(error, 'processAsanaEvent');
  }
};

/**
 * Main handler for Asana webhook events
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
    // Handle Asana webhook handshake challenge
    if (req.headers['x-hook-secret']) {
      const hookSecret = req.headers['x-hook-secret'] as string;
      
      // Store the webhook secret for future verification
      // In a production environment, you would store this securely
      process.env.ASANA_WEBHOOK_SECRET = hookSecret;
      
      // Respond to the handshake with the same secret
      res.setHeader('X-Hook-Secret', hookSecret);
      return res.status(200).end();
    }

    // Verify the request is from Asana
    if (!verifyAsanaSignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const events = req.body.events || [];
    const workspaceId = req.body.events?.[0]?.resource?.workspace?.gid || '';

    // Process each event asynchronously
    if (events.length > 0 && workspaceId) {
      // We don't await this to respond quickly to Asana
      Promise.all(events.map((event: any) => 
        processAsanaEvent(event, workspaceId)
          .catch(error => logError(error, 'processAsanaEvent'))
      ));
    }

    // Respond quickly to Asana
    return res.status(200).json({ received: true });
  } catch (error) {
    logError(error, 'handler');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
