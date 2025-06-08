import { NextRequest, NextResponse } from 'next/server';
import { StreamingTextResponse } from 'ai';
import { OpenAI } from 'openai';
import { supabase } from '@/lib/supabase-client';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/chat/[agentId]
 * Stream a chat response from an agent
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate agent ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(params.agentId)) {
      return NextResponse.json(
        { error: 'Invalid agent ID format' },
        { status: 400 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { messages } = body;

    // Validate messages format
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Verify agent exists and user has access
    const agent = await prisma.agent.findUnique({
      where: { 
        id: params.agentId,
        user_id: user.id
      }
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get agent memory
    const agentMemory = await prisma.agentMemory.findMany({
      where: {
        agent_id: params.agentId
      }
    });

    // Get recent chat history
    const chatHistory = await prisma.chatMessage.findMany({
      where: {
        agent_id: params.agentId,
        user_id: user.id
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10
    });

    // Save user message
    await prisma.chatMessage.create({
      data: {
        agent_id: params.agentId,
        user_id: user.id,
        role: 'user',
        content: messages[messages.length - 1].content,
        metadata: {}
      }
    });

    // Build system prompt with agent memory
    let systemPrompt = `You are ${agent.name}. ${agent.description || ''}`;
    
    // Add memory context
    if (agentMemory.length > 0) {
      agentMemory.forEach(memory => {
        try {
          const value = memory.type === 'json' ? JSON.parse(memory.value) : memory.value;
          if (memory.key === 'weekly_goals') {
            systemPrompt += `\n\nYour current goals: ${Array.isArray(value) ? value.join(', ') : value}`;
          } else {
            systemPrompt += `\n\n${memory.key}: ${Array.isArray(value) ? value.join(', ') : value}`;
          }
        } catch (e) {
          // Handle invalid JSON gracefully
          if (memory.key === 'weekly_goals') {
            systemPrompt += `\n\nYour current goals: ${memory.value}`;
          } else {
            systemPrompt += `\n\n${memory.key}: ${memory.value}`;
          }
        }
      });
    }

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.reverse().map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      ...messages
    ];

    // Create OpenAI streaming response
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: openaiMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000
    });

    // Update agent with last interaction
    await prisma.agent.update({
      where: { id: params.agentId },
      data: {
        updated_at: new Date()
      }
    });

    return new StreamingTextResponse(response.toReadableStream());
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
