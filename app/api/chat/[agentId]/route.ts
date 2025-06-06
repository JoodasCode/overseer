import { NextRequest } from 'next/server';
import { OpenAI } from 'openai';
import { supabase } from '@/lib/supabase-client';
import { StreamingTextResponse, Message as AIMessage } from 'ai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/chat/[agentId]
 * Stream a chat response from an agent
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    // Get user ID from auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const agentId = params.agentId;
    
    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();
    
    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404 }
      );
    }

    // Parse request body
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400 }
      );
    }

    // Get agent memory for context
    const { data: memory } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    // Get recent chat history (last 10 messages)
    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Reverse to get chronological order
    const recentMessages = chatHistory ? [...chatHistory].reverse() : [];
    
    // Build system prompt with agent persona and memory
    const systemPrompt = `
You are ${agent.name}, ${agent.role}.

${agent.persona}

${memory?.weekly_goals ? `Your current goals: ${memory.weekly_goals}` : ''}
${memory?.preferences?.length > 0 ? `Your preferences: ${memory.preferences.join(', ')}` : ''}
${memory?.recent_learnings?.length > 0 ? `Things you've recently learned: ${memory.recent_learnings.join(', ')}` : ''}

Tools available to you: ${agent.tools?.join(', ') || 'None yet'}

Respond in character as ${agent.name}. Be helpful, concise, and engaging.
    `.trim();

    // Save the new user message to the database
    const latestUserMessage = messages[messages.length - 1];
    await supabase
      .from('chat_messages')
      .insert({
        agent_id: agentId,
        user_id: user.id,
        role: 'user',
        content: latestUserMessage.content,
      });

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      // Add recent chat history for context
      ...recentMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      // Add the current conversation
      ...messages.map((msg: AIMessage) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Create stream from OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    // Create a transformer to save the assistant's message
    const streamTransformer = new TransformStream({
      async transform(chunk, controller) {
        controller.enqueue(chunk);
      },
      async flush(controller) {
        // This will run when the stream is complete
        // We'll save the full assistant response here
        controller.terminate();
      }
    });

    // Process the stream and collect the full response
    let fullResponse = '';
    
    const forkedStream = response.toReadableStream().pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          fullResponse += text;
          controller.enqueue(chunk);
        },
        flush(controller) {
          // When stream is complete, save the assistant's message
          saveAssistantMessage(agentId, user.id, fullResponse);
        }
      })
    );

    // Return the streaming response
    return new StreamingTextResponse(forkedStream);
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500 }
    );
  }
}

/**
 * Save the assistant's message to the database
 */
async function saveAssistantMessage(agentId: string, userId: string, content: string) {
  try {
    await supabase
      .from('chat_messages')
      .insert({
        agent_id: agentId,
        user_id: userId,
        role: 'assistant',
        content,
      });
    
    // Update agent's last_active timestamp
    await supabase
      .from('agents')
      .update({ last_active: new Date().toISOString() })
      .eq('id', agentId);
  } catch (error) {
    console.error('Error saving assistant message:', error);
  }
}
