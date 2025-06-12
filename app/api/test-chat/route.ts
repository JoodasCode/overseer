import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { AGENT_PERSONAS, AgentPersona } from '@/lib/agent-personas';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, agentId, userId } = body;

    if (!message || !agentId || !userId) {
      return NextResponse.json(
        { error: 'Message, agentId, and userId are required' },
        { status: 400 }
      );
    }

    console.log('🧪 TEST CHAT API: Testing chat functionality');
    console.log('📝 Message:', message);
    console.log('🤖 Agent ID:', agentId);
    console.log('👤 User ID:', userId);

    // Get agent directly using service role (bypassing auth for testing)
    const { data: agent, error: agentError } = await supabase
      .from('portal_agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userId)
      .single();

    if (agentError || !agent) {
      console.log('❌ Agent not found:', agentError);
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    console.log('✅ Agent found:', { name: agent.name, role: agent.role });

    // Save user message to database
    const { data: userMessageRecord, error: saveUserError } = await supabase
      .from('portal_agent_logs')
      .insert({
        user_id: userId,
        agent_id: agentId,
        role: 'user',
        content: message,
        metadata: { timestamp: new Date().toISOString(), test: true }
      })
      .select()
      .single();

    if (saveUserError) {
      console.error('❌ Error saving user message:', saveUserError);
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    console.log('✅ User message saved');

    // Get agent persona for response generation
    const agentName = agent.name.toLowerCase();
    const persona = AGENT_PERSONAS[agentName] || AGENT_PERSONAS.alex;

    let assistantMessage = '';

    // Check if we should use real OpenAI or mock responses
    const useRealOpenAI = !config.MOCK_MODE && OPENAI_API_KEY;
    
    if (!useRealOpenAI) {
      console.log(`🎭 Mock chat for agent ${agentName}`);
      assistantMessage = generatePersonalityResponse(persona, message);
    } else {
      // Real OpenAI API call
      console.log(`🤖 Real OpenAI chat for agent ${agentName}`);
      
      const systemPrompt = buildSystemPrompt(persona, agent);
      
      const chatMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: chatMessages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      assistantMessage = data.choices[0]?.message?.content || 'Sorry, I had trouble processing that.';
    }

    // Save assistant response to database
    const { data: assistantMessageRecord, error: saveAssistantError } = await supabase
      .from('portal_agent_logs')
      .insert({
        user_id: userId,
        agent_id: agentId,
        role: 'assistant',
        content: assistantMessage,
        metadata: { 
          timestamp: new Date().toISOString(),
          mode: useRealOpenAI ? 'openai' : 'mock',
          agent_name: agent.name,
          test: true
        }
      })
      .select()
      .single();

    if (saveAssistantError) {
      console.error('❌ Error saving assistant message:', saveAssistantError);
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      );
    }

    console.log('✅ Assistant message saved');

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      agent: { 
        id: agentId, 
        name: agent.name,
        role: agent.role 
      },
      mode: useRealOpenAI ? 'openai' : 'mock',
      test: true
    });

  } catch (error) {
    console.error('❌ Test Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(persona: AgentPersona, agent: any): string {
  return `You are ${agent.name}, ${agent.description || 'an AI assistant'}.

Personality: ${persona.personality}
Communication Style: ${persona.communicationStyle}
Expertise: ${persona.expertise.join(', ')}

${persona.systemPrompt}

Always respond in character and be helpful while maintaining your unique personality.`;
}

function generatePersonalityResponse(persona: AgentPersona, userMessage: string): string {
  const responses = [
    `${persona.greeting} I understand you're asking about "${userMessage}". ${persona.catchphrase}`,
    `That's an interesting question about "${userMessage}". ${persona.personality} Let me help you with that!`,
    `${persona.catchphrase} Regarding "${userMessage}", here's what I think...`,
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
} 