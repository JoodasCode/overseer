import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { config } from '@/lib/config'
import { SupabaseKnowledgeRetriever } from '@/lib/knowledge-base/supabase-knowledge-retriever'

// Agent personas for consistent responses
const AGENT_PERSONAS = {
  alex: {
    name: 'alex',
    systemPrompt: 'You are Alex Rodriguez, a Strategic Coordinator. You are analytical, systematic, and focused on optimization.',
    traits: ['strategic', 'analytical', 'structured']
  },
  dana: {
    name: 'dana', 
    systemPrompt: 'You are Dana Chen, a Creative Director. You are enthusiastic, creative, and visually oriented.',
    traits: ['creative', 'enthusiastic', 'visual']
  },
  riley: {
    name: 'riley',
    systemPrompt: 'You are Riley Park, a Senior Data Analyst. You are detail-oriented, logical, and metrics-focused.',
    traits: ['analytical', 'logical', 'data-driven']
  },
  jamie: {
    name: 'jamie',
    systemPrompt: 'You are Jamie Torres, a Communications Manager. You are collaborative, diplomatic, and people-focused.',
    traits: ['collaborative', 'diplomatic', 'people-focused']
  },
  toby: {
    name: 'toby',
    systemPrompt: 'You are Toby Kim, an Operations Specialist. You are action-oriented, responsive, and execution-focused.',
    traits: ['action-oriented', 'responsive', 'execution-focused']
  }
} as const

type AgentPersona = typeof AGENT_PERSONAS[keyof typeof AGENT_PERSONAS]

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// 🎯 UPDATED CHAT API - TOKEN BASED SYSTEM
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const agentId = (await params).id
    const { message } = await request.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // 🔐 STEP 1: AUTHENTICATE USER
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('🔍 DEBUG: Chat API authentication:', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      authError: authError?.message
    })

    if (!user) {
      console.log('❌ Chat API: Authentication failed:', authError?.message || 'Auth session missing!')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('🔐 Chat API: Authenticated user:', {
      userId: user.id,
      email: user.email,
      agentId
    })

    // 🎯 STEP 2: GET AGENT (NO OWNERSHIP CHECK - ALL AGENTS ACCESSIBLE)
    const { data: agent, error: agentError } = await supabase
      .from('portal_agents')
      .select('*')
      .eq('id', agentId)
      .eq('status', 'active')
      .single()

    if (agentError || !agent) {
      console.log('❌ Chat API: Agent not found or not active:', agentError?.message)
      return NextResponse.json(
        { error: 'Agent not found or not available' },
        { status: 404 }
      )
    }

    console.log('✅ Chat API: Agent accessible to all users:', { agentName: agent.name, agentRole: agent.role })

    // 🎯 STEP 3: TOKEN QUOTA CHECK
    const { data: tokenUsage } = await supabase
      .from('user_tokens')
      .select('tokens_used, token_quota')
      .eq('user_id', user.id)
      .single()

    // Initialize tokens if user doesn't have a record
    if (!tokenUsage) {
      await supabase
        .from('user_tokens')
        .insert({
          user_id: user.id,
          tokens_used: 0,
          token_quota: 500 // Default free tier
        })
    }

    const currentUsage = tokenUsage?.tokens_used || 0
    const quota = tokenUsage?.token_quota || 500
    const tokensRemaining = quota - currentUsage

    // Check if user has enough tokens
    if (tokensRemaining <= 0) {
      console.log('❌ Chat API: Token quota exceeded:', { currentUsage, quota })
      return NextResponse.json(
        { 
          error: 'Token quota exceeded',
          tokensUsed: currentUsage,
          tokenQuota: quota,
          tokensRemaining: 0,
          upgradeRequired: true
        },
        { status: 402 } // Payment Required
      )
    }

    // 🎯 STEP 4: GET CONVERSATION HISTORY
    const { data: messages } = await supabase
      .from('portal_agent_logs')
      .select('role, content')
      .eq('user_id', user.id)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: true })
      .limit(20) // Last 20 messages for context

    // 💾 STEP 5: SAVE USER MESSAGE FIRST
    const conversationId = crypto.randomUUID()
    
    const { error: saveUserError } = await supabase
      .from('portal_agent_logs')
      .insert({
        user_id: user.id,
        agent_id: agentId,
        role: 'user',
        content: message,
        tokens_consumed: 1,
        conversation_id: conversationId,
        metadata: { timestamp: new Date().toISOString() }
      })

    if (saveUserError) {
      console.error('❌ Error saving user message:', saveUserError)
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    // 🤖 STEP 6: GENERATE AI RESPONSE
    const agentName = agent.name.toLowerCase().split(' ')[0]
    const persona = AGENT_PERSONAS[agentName as keyof typeof AGENT_PERSONAS] || AGENT_PERSONAS.alex

    let assistantMessage = ''
    let openaiTokensUsed = 0

    const useRealOpenAI = !config.MOCK_MODE && process.env.OPENAI_API_KEY

    if (!useRealOpenAI) {
      console.log(`🎭 Mock chat for agent ${agentName}: ${message}`)
      assistantMessage = generatePersonalityResponse(persona, message)
    } else {
      console.log(`🤖 Real OpenAI chat for agent ${agentName}: ${message}`)
      
      // 📚 GET KNOWLEDGE BASE CONTEXT
      const knowledgeContext = await SupabaseKnowledgeRetriever.getKnowledgeContext(message, user.id, 1000)
      
      // Build system prompt with knowledge
      let systemPrompt = `You are ${agent.name}, ${agent.description}. Role: ${agent.role}. ${agent.persona || 'Be helpful and professional.'}`
      
      if (knowledgeContext) {
        systemPrompt += `\n\nYou have access to the user's knowledge base. Use this information to provide more accurate and personalized responses:\n\n${knowledgeContext}`
        console.log('📚 Knowledge context added to agent prompt')
      }
      
      const chatMessages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...(messages as Array<{role: string, content: string}>)
          .filter((msg: {role: string, content: string}) => msg.content && typeof msg.content === 'string' && msg.content.trim().length > 0)
          .map((msg: {role: string, content: string}) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })),
        {
          role: 'user' as const,
          content: message
        }
      ]

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: chatMessages,
            temperature: 0.7,
            max_tokens: 1000,
          }),
        })

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`)
        }

        const data = await response.json()
        assistantMessage = data.choices[0]?.message?.content || 'Sorry, I had trouble processing that.'
        openaiTokensUsed = data.usage?.total_tokens || 0
        
      } catch (error) {
        console.error('❌ OpenAI API Error:', error)
        assistantMessage = generatePersonalityResponse(persona, message)
      }
    }

    // 🎯 STEP 7: CONSUME TOKENS BEFORE SAVING RESPONSE
    // Try to use the function, fall back to direct update if not available
    const tokenResult = await supabase.rpc('consume_tokens', {
      p_user_id: user.id,
      p_agent_id: agentId,
      p_tokens: 1,
      p_conversation_id: conversationId,
      p_message_content: message,
      p_openai_tokens: openaiTokensUsed
    })

    if (tokenResult.error) {
      console.log('📝 Function not available, using direct token update:', tokenResult.error.message)
      
      // Fallback to direct token update
      const { error: updateError } = await supabase
        .from('user_tokens')
        .update({ 
          tokens_used: currentUsage + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('❌ Error updating tokens:', updateError)
      }

      // Also log the usage in usage_logs table
      await supabase
        .from('usage_logs')
        .insert({
          user_id: user.id,
          agent_id: agentId,
          tokens_consumed: 1,
          conversation_id: conversationId,
          openai_tokens_used: openaiTokensUsed,
          message_count: 1
        })
    }

    // 💾 STEP 8: SAVE ASSISTANT RESPONSE
    const { error: saveAssistantError } = await supabase
      .from('portal_agent_logs')
      .insert({
        user_id: user.id,
        agent_id: agentId,
        role: 'assistant',
        content: assistantMessage,
        tokens_consumed: 1,
        openai_tokens: openaiTokensUsed,
        conversation_id: conversationId,
        metadata: { 
          timestamp: new Date().toISOString(),
          mode: useRealOpenAI ? 'openai' : 'mock',
          agent_name: agent.name
        }
      })

    if (saveAssistantError) {
      console.error('❌ Error saving assistant message:', saveAssistantError)
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      )
    }

    console.log('✅ Chat API: Token consumed and messages saved successfully')

    // 🎯 STEP 9: RETURN SUCCESS WITH TOKEN INFO
    return NextResponse.json({
      success: true,
      message: assistantMessage,
      agent: { 
        id: agentId, 
        name: agent.name,
        role: agent.role 
      },
      usage: {
        tokensRemaining: tokensRemaining - 1,
        tokensUsed: currentUsage + 1,
        tokenQuota: quota,
        lowTokenWarning: tokensRemaining - 1 <= 50 // Cursor-style warning
      },
      mode: useRealOpenAI ? 'openai' : 'mock'
    })

  } catch (error) {
    console.error('❌ Chat API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function generatePersonalityResponse(persona: AgentPersona, userMessage: string): string {
  const responses: { [key: string]: string[] } = {
    alex: [
      `Let me analyze "${userMessage}" strategically. Here's my systematic approach and key considerations...`,
      `I've processed "${userMessage}" and here's the strategic framework I recommend...`,
      `From a coordination perspective on "${userMessage}", here are the critical pathways...`
    ],
    dana: [
      `This is exciting! 🎨 For "${userMessage}", I'm envisioning some really creative possibilities...`,
      `Creative brain activated! ✨ "${userMessage}" sparks so many innovative ideas...`,
      `Ooh! "${userMessage}" could be transformed in these amazing visual ways...`
    ],
    riley: [
      `I've analyzed the data on "${userMessage}". Here are the key metrics and insights...`,
      `Based on my analysis of "${userMessage}", the evidence points to these conclusions...`,
      `The data patterns for "${userMessage}" reveal these statistically significant trends...`
    ],
    jamie: [
      `Thanks for bringing up "${userMessage}". Let me help coordinate the best approach...`,
      `Great question about "${userMessage}". Here's how we can work together on this...`,
      `For "${userMessage}", I recommend we align everyone with this collaborative strategy...`
    ],
    toby: [
      `Action stations! For "${userMessage}", here's my immediate response plan...`,
      `Got it! "${userMessage}" - mobilizing rapid response protocols right now...`,
      `Quick response initiated! "${userMessage}" requires these tactical steps...`
    ]
  }

  const agentResponses = responses[persona.name] || responses.alex
  return agentResponses[Math.floor(Math.random() * agentResponses.length)]
} 