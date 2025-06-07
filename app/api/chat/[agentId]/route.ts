import { NextRequest } from 'next/server';
import { OpenAI } from 'openai';
import { supabase } from '@/lib/supabase-client';
import { prisma } from '@/lib/prisma';
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
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agentId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid agent ID format' }),
        { status: 400 }
      );
    }
    
    // Verify agent belongs to user
    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
        user_id: user.id
      }
    });
    
    // Get agent memory
    const agentMemory = await prisma.agentMemory.findMany({
      where: {
        agent_id: agentId
      }
    });
    
    if (!agent) {
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

    // Get recent chat history (last 10 messages)
    const chatHistory = await prisma.chatMessage.findMany({
      where: {
        agent_id: agentId
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10
    });
    
    // Reverse to get chronological order
    const recentMessages = chatHistory ? [...chatHistory].reverse() : [];
    
    // Process agent memory for context
    const weeklyGoals = agentMemory.find((m) => m.key === 'weekly_goals')?.value || '';
    const preferences = agentMemory.find((m) => m.key === 'preferences')?.value || '[]';
    const recentLearnings = agentMemory.find((m) => m.key === 'recent_learnings')?.value || '[]';
    
    // Parse JSON values
    let parsedPreferences = [];
    let parsedLearnings = [];
    
    try {
      parsedPreferences = JSON.parse(preferences);
    } catch (e) {
      console.error('Failed to parse preferences:', e);
    }
    
    try {
      parsedLearnings = JSON.parse(recentLearnings);
    } catch (e) {
      console.error('Failed to parse recent learnings:', e);
    }
    
    // Build system prompt with agent persona and memory
    const systemPrompt = `
You are ${agent.name}, ${agent.description || ''}.

${typeof agent.metadata === 'object' && agent.metadata !== null ? (agent.metadata as any).persona || '' : ''}

${weeklyGoals ? `Your current goals: ${weeklyGoals}` : ''}
${parsedPreferences.length > 0 ? `Your preferences: ${parsedPreferences.join(', ')}` : ''}
${parsedLearnings.length > 0 ? `Things you've recently learned: ${parsedLearnings.join(', ')}` : ''}

Tools available to you: ${agent.tools ? Object.keys(agent.tools).join(', ') : 'None yet'}

Respond in character as ${agent.name}. Be helpful, concise, and engaging.
    `.trim();

    // Save the new user message to the database
    const latestUserMessage = messages[messages.length - 1];
    await prisma.chatMessage.create({
      data: {
        agent_id: agentId,
        user_id: user.id,
        role: 'user',
        content: latestUserMessage.content,
        metadata: {}
      }
    });

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      // Add recent chat history for context
      ...recentMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
      // Add the current conversation
      ...messages.map((msg: AIMessage) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
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
    // Save the assistant message
    await prisma.chatMessage.create({
      data: {
        agent_id: agentId,
        user_id: userId,
        role: 'assistant',
        content,
        metadata: {}
      }
    });
    
    // Update agent's updated_at timestamp (which serves as last_active)
    await prisma.agent.update({
      where: {
        id: agentId
      },
      data: {
        updated_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error saving assistant message:', error);
  }
}
