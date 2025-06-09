/**
 * Enhanced Agent Chat with Integrations
 * Allows agents to use third-party integrations during conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { universalIntegrationsCore } from '@/lib/integrations/universal-integrations-core';

// Initialize clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * POST /api/agents/[id]/chat-with-integrations
 * 
 * Enhanced chat that allows agents to use integrations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    
    // Authenticate user via JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get the agent
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('Agent')
      .select('*')
      .eq('id', agentId)
      .eq('userId', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message, messages = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user's connected integrations
    const integrationStatuses = await universalIntegrationsCore.getIntegrationStatus(user.id);
    const connectedTools = integrationStatuses
      .filter(s => s.status === 'connected')
      .map(s => s.tool);

    // Build system prompt with integration capabilities
    const systemPrompt = `You are ${agent.name}, ${agent.specialization || 'an AI assistant'}.

${agent.description || ''}

AVAILABLE INTEGRATIONS:
${connectedTools.length > 0 
  ? connectedTools.map(tool => `- ${tool}: You can send messages, fetch data, and perform actions`).join('\n')
  : '- No integrations connected. Suggest user to connect tools for enhanced capabilities.'
}

INTEGRATION USAGE:
When you need to use an integration, respond with a special command in this format:
[INTEGRATION: tool_name action_name {"param1": "value1", "param2": "value2"}]

Available actions:
- send: Send data or messages through the tool
- fetch: Retrieve data from the tool
- connect: Connect to the tool (if not connected)

Examples:
- [INTEGRATION: gmail send {"to": "user@example.com", "subject": "Meeting", "body": "Let's schedule a meeting"}]
- [INTEGRATION: slack send {"channel": "#general", "text": "Hello team!"}]
- [INTEGRATION: notion create {"title": "Meeting Notes", "content": "Notes from today's meeting"}]

If no integrations are needed, respond normally.`;

    // Prepare messages for OpenAI
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
      { role: 'user', content: message }
    ];

    // Get OpenAI response
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0]?.message?.content || '';

    // Check if the response contains integration commands
    const integrationPattern = /\[INTEGRATION:\s*(\w+)\s+(\w+)\s+({.*?})\]/g;
    let processedMessage = assistantMessage;
    const integrationResults: any[] = [];

    let match;
    while ((match = integrationPattern.exec(assistantMessage)) !== null) {
      const [fullMatch, tool, action, paramsJson] = match;
      
      try {
        const params = JSON.parse(paramsJson);
        
        // Execute the integration
        const integrationResult = await universalIntegrationsCore.executeIntegration({
          tool,
          action,
          params,
          agentId,
          userId: user.id
        });

        integrationResults.push({
          tool,
          action,
          params,
          result: integrationResult
        });

        // Replace the command with result info
        const resultText = integrationResult.success 
          ? `✅ Successfully executed ${action} on ${tool}`
          : `❌ Failed to execute ${action} on ${tool}: ${integrationResult.error}`;
        
        processedMessage = processedMessage.replace(fullMatch, resultText);

      } catch (error) {
        console.error('Integration execution error:', error);
        const errorText = `❌ Error executing ${action} on ${tool}: Invalid parameters`;
        processedMessage = processedMessage.replace(fullMatch, errorText);
        
        integrationResults.push({
          tool,
          action,
          params: paramsJson,
          result: { success: false, error: 'Invalid parameters' }
        });
      }
    }

    // Save chat messages to database (optional)
    try {
      await supabaseAdmin
        .from('chat_messages')
        .insert([
          {
            agentId,
            userId: user.id,
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
          },
          {
            agentId,
            userId: user.id,
            role: 'assistant',
            content: processedMessage,
            metadata: integrationResults.length > 0 ? { integrations: integrationResults } : null,
            timestamp: new Date().toISOString()
          }
        ]);
    } catch (dbError) {
      console.warn('Failed to save chat messages:', dbError);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: processedMessage,
        integrations: integrationResults,
        connectedTools,
        agent: {
          id: agent.id,
          name: agent.name,
          specialization: agent.specialization
        }
      }
    });

  } catch (error) {
    console.error('Enhanced chat error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 