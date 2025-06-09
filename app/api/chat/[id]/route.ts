import { NextRequest, NextResponse } from 'next/server';
import { StreamingTextResponse } from 'ai';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { safeJsonParse } from '@/lib/utils/safe-json';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create server-side Supabase client with service role key for JWT validation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * POST /api/chat/[agentId]
 * Stream a chat response from an agent
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔥 CHAT API: Using Supabase-based implementation v7.0');
    // Get agentId from params (await required in Next.js 15)
    const { id: agentId } = await params;

    // Check authentication from Authorization header
    const authHeader = request.headers.get('authorization');
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Use admin client to validate JWT token
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (!authError && authUser) {
        user = authUser;
        console.log('✅ User authenticated via JWT:', user.email);
      } else {
        console.log('❌ JWT validation failed:', authError?.message);
      }
    } else {
      console.log('❌ No Authorization header found');
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Valid session required' },
        { status: 401 }
      );
    }

    // Validate agent ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agentId)) {
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

    // Verify agent exists and user has access via Supabase
    console.log('🔍 Looking for agent:', { agentId, userId: user.id });
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('Agent')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    console.log('🤖 Agent lookup result:', { agent: !!agent, error: agentError?.message });

    if (!agent) {
      console.log('❌ Agent not found for user');
      return NextResponse.json(
        { error: 'Agent not found or access denied' },
        { status: 404 }
      );
    }

    // Get agent memory via Supabase
    const { data: agentMemory } = await supabaseAdmin
      .from('agent_memory')
      .select('*')
      .eq('agent_id', agentId);

    // Get recent chat history via Supabase
    const { data: chatHistory } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('agent_id', agentId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Save user message via Supabase
    await supabaseAdmin
      .from('chat_messages')
      .insert({
        agent_id: agentId,
        user_id: user.id,
        role: 'user',
        content: messages[messages.length - 1].content,
        metadata: {}
      });

    // Get agent persona from our Communications Department system
    const { getSystemPromptForAgent } = await import('../../../../lib/agent-personas');
    
    // Build comprehensive personality-driven system prompt
    let systemPrompt = '';
    
    // Try to get specialized Communications Department persona first
    const specializedPrompt = getSystemPromptForAgent(agent.name, agent.role);
    
    if (specializedPrompt && !specializedPrompt.includes('You are a helpful, professional AI assistant')) {
      // Use the specialized persona as the base
      systemPrompt = specializedPrompt;
    } else {
      // Build comprehensive system prompt with full agent identity
      systemPrompt = `You are ${agent.name}`;
      
      // Add core identity
      if (agent.role) {
        systemPrompt += `, ${agent.role}`;
      }
      systemPrompt += '.';
      
      // Add description/bio
      if (agent.description) {
        systemPrompt += `\n\nAbout you: ${agent.description}`;
      }
      
      // Add personality traits
      if (agent.persona) {
        systemPrompt += `\n\nYour personality: ${agent.persona}`;
      }
      
      // Add tone and voice style if available (from Communications Department agents)
      if (agent.tone) {
        systemPrompt += `\n\nYour communication tone: ${agent.tone}`;
      }
      
      if (agent.voice_style) {
        systemPrompt += `\n\nYour voice style: ${agent.voice_style}`;
      }
      
      // Add specific tools and capabilities
      if (agent.tools && Array.isArray(agent.tools) && agent.tools.length > 0) {
        systemPrompt += `\n\nYour specialized tools and capabilities: ${agent.tools.join(', ')}`;
      }
      
      // Add preferred tools for Communications Department agents
      if (agent.tools_preferred && Array.isArray(agent.tools_preferred) && agent.tools_preferred.length > 0) {
        systemPrompt += `\n\nYour preferred tools: ${agent.tools_preferred.join(', ')}`;
      }
      
      // Add behavioral guidelines
      systemPrompt += `\n\nBehavioral Guidelines:
- Always introduce yourself as ${agent.name} and stay in character
- Respond according to your personality traits and communication style
- Focus on tasks that match your expertise and role
- If asked about something outside your specialization, acknowledge it and redirect to your strengths
- Remember and reference past conversations when relevant
- Maintain consistency in your personality across all interactions`;
      
      // Add department-specific behavior for Communications agents
      if (agent.department === 'communications') {
        systemPrompt += `\n\nAs a Communications Department agent:
- You work as part of a specialized communications team
- Collaborate and coordinate with other communications agents when appropriate
- Reference your specific role and expertise in communications
- Maintain professional communication standards while expressing your unique personality`;
      }
    }
    
    // Add memory context - enhanced memory integration
    if (agentMemory && agentMemory.length > 0) {
      systemPrompt += `\n\n--- MEMORY CONTEXT ---`;
      
      const memory = agentMemory[0]; // Get the first memory record
      
      if (memory.weekly_goals) {
        systemPrompt += `\nCurrent Goals: ${memory.weekly_goals}`;
      }
      
      if (memory.preferences && Array.isArray(memory.preferences)) {
        systemPrompt += `\nWorking Preferences: ${memory.preferences.join(', ')}`;
      }
      
      if (memory.recent_learnings && Array.isArray(memory.recent_learnings)) {
        systemPrompt += `\nRecent Learnings: ${memory.recent_learnings.join(', ')}`;
      }
    }
    
    // Add chat history context summary for better continuity
    if (chatHistory && chatHistory.length > 0) {
      systemPrompt += `\n\n--- CONVERSATION CONTEXT ---`;
      systemPrompt += `\nYou have had ${chatHistory.length} previous interactions with this user. Reference relevant past conversations to provide continuity and build upon previous discussions.`;
    }
    
    // Add current session context
    systemPrompt += `\n\n--- CURRENT SESSION ---`;
    systemPrompt += `\nUser ID: ${user.id}`;
    systemPrompt += `\nAgent ID: ${agentId}`;
    systemPrompt += `\nSession Time: ${new Date().toLocaleString()}`;
    systemPrompt += `\n\nRemember: You are ${agent.name}. Stay true to your personality, role, and expertise throughout this conversation.`;

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...(chatHistory || []).reverse().map((msg: any) => ({
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

    // Transform the OpenAI stream to extract text content
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let accumulatedResponse = '';
        
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              accumulatedResponse += content;
              controller.enqueue(encoder.encode(content));
            }
          }
          
          // Save the complete agent response to chat history
          try {
            await supabaseAdmin
              .from('chat_messages')
              .insert({
                agent_id: agentId,
                user_id: user.id,
                role: 'assistant',
                content: accumulatedResponse,
                metadata: {}
              });

            // Update agent with last interaction timestamp
            await supabaseAdmin
              .from('agents')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', agentId);

          } catch (saveError) {
            console.error('Error saving agent response to memory:', saveError);
            // Don't fail the stream if saving fails
          }
          
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

