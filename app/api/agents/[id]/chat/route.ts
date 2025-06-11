import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'
import { AGENT_PERSONAS, AgentPersona } from '@/lib/agent-personas'

// Mock mode or real OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params
    const body = await request.json()
    const { message, messages = [] } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get agent persona from our agent-personas.ts
    const agentName = getAgentNameById(agentId)
    const persona = AGENT_PERSONAS[agentName] || AGENT_PERSONAS.alex

    // Check if we should use real OpenAI or mock responses
    const useRealOpenAI = !config.MOCK_MODE && OPENAI_API_KEY
    
    if (!useRealOpenAI) {
      console.log(`🎭 Mock chat for agent ${agentName}: ${message}`)
      
      const mockResponse = generatePersonalityResponse(persona, message)
      
      return NextResponse.json({
        success: true,
        response: mockResponse,
        agent: { id: agentId, name: agentName },
        mode: 'mock'
      })
    }

    // Real OpenAI API call
    const systemPrompt = buildSystemPrompt(persona, agentName)
    
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-5), // Keep last 5 messages for context
      { role: 'user', content: message }
    ]

    console.log(`🤖 Real OpenAI chat for agent ${agentName}: ${message}`)

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
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const assistantMessage = data.choices[0]?.message?.content || 'Sorry, I had trouble processing that.'

    return NextResponse.json({
      success: true,
      response: assistantMessage,
      agent: { id: agentId, name: agentName },
      usage: data.usage,
      mode: 'openai'
    })

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getAgentNameById(agentId: string): string {
  // Map agent IDs to names
  const agentMap: { [key: string]: string } = {
    '1': 'alex',
    '2': 'dana', 
    '3': 'jamie',
    '4': 'riley',
    '5': 'toby'
  }
  return agentMap[agentId] || 'alex'
}

function buildSystemPrompt(persona: AgentPersona, agentName: string): string {
  return persona.systemPrompt
}

function generatePersonalityResponse(persona: AgentPersona, userMessage: string): string {
  const responses: { [key: string]: string[] } = {
    alex: [
      `Let me think strategically about "${userMessage}". Here's my systematic approach and key considerations...`,
      `I've analyzed "${userMessage}" and here's the strategic framework I recommend...`,
      `From a coordination perspective on "${userMessage}", here are the critical pathways...`
    ],
    dana: [
      `Ooh! "${userMessage}" sparks so many creative possibilities! ✨ Let me paint you some innovative ideas...`,
      `This is exciting! 🎨 For "${userMessage}", I'm envisioning some really unique visual approaches...`,
      `Creative brain activated! 🚀 "${userMessage}" could be transformed in these amazing ways...`
    ],
    riley: [
      `I've processed the data on "${userMessage}". Here are the key metrics and analytical insights...`,
      `Based on my analysis of "${userMessage}", the evidence points to these measurable outcomes...`,
      `The data patterns for "${userMessage}" reveal these statistically significant trends...`
    ],
    jamie: [
      `Thanks for bringing up "${userMessage}". Let me help coordinate the best collaborative approach...`,
      `I want to make sure everyone's aligned on "${userMessage}". Here's how we can work together...`,
      `Team coordination mode: For "${userMessage}", here's how we can optimize our collective efforts...`
    ],
    toby: [
      `Got it! "${userMessage}" - I'm mobilizing rapid response protocols right now...`,
      `Action stations! For "${userMessage}", here's my immediate coordination strategy...`,
      `Quick response initiated! "${userMessage}" requires these immediate tactical steps...`
    ]
  }

  const agentResponses = responses[persona.name.toLowerCase()] || responses.alex
  return agentResponses[Math.floor(Math.random() * agentResponses.length)]
} 