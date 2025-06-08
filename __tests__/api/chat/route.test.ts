import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/chat/[agentId]/route'
import { NextRequest } from 'next/server'
import { StreamingTextResponse } from 'ai'

// Individual mock functions using vi.hoisted
const mockGetUser = vi.hoisted(() => vi.fn())
const mockAgentFindUnique = vi.hoisted(() => vi.fn())
const mockAgentUpdate = vi.hoisted(() => vi.fn())
const mockAgentMemoryFindMany = vi.hoisted(() => vi.fn())
const mockChatMessageFindMany = vi.hoisted(() => vi.fn())
const mockChatMessageCreate = vi.hoisted(() => vi.fn())
const mockOpenAICreate = vi.hoisted(() => vi.fn())

// Mock ReadableStream for testing
class MockReadableStream {
  constructor(public data = '') {}
  
  getReader() {
    const data = this.data;
    let done = false;
    
    return {
      read: async () => {
        if (done) {
          return { done: true, value: undefined };
        }
        done = true;
        return { done: false, value: new TextEncoder().encode(data) };
      },
      releaseLock: () => {}
    };
  }
  
  pipeThrough() {
    return this;
  }
  
  toReadableStream() {
    return this;
  }
}

// Mock Supabase auth
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
    },
  },
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agent: {
      findUnique: mockAgentFindUnique,
      update: mockAgentUpdate,
    },
    agentMemory: {
      findMany: mockAgentMemoryFindMany,
    },
    chatMessage: {
      findMany: mockChatMessageFindMany,
      create: mockChatMessageCreate,
    },
  },
}))

// Mock OpenAI
vi.mock('openai', () => {
  return {
    OpenAI: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockOpenAICreate
        }
      }
    }))
  };
});

// Mock environment variables
vi.stubEnv('OPENAI_API_KEY', 'test-api-key');

describe('Chat API', () => {
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000'
  const mockAgentId = '550e8400-e29b-41d4-a716-446655440001'

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default successful auth
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })
    
    // Default agent exists
    mockAgentFindUnique.mockResolvedValue({
      id: mockAgentId,
      name: 'Test Agent',
      description: 'A test assistant',
      user_id: mockUserId,
    })
    
    // Default empty memory and chat history
    mockAgentMemoryFindMany.mockResolvedValue([])
    mockChatMessageFindMany.mockResolvedValue([])
    mockChatMessageCreate.mockResolvedValue({})
    mockAgentUpdate.mockResolvedValue({})
    
    // Mock OpenAI streaming response
    mockOpenAICreate.mockResolvedValue({
      toReadableStream: () => new MockReadableStream('Test response')
    });
  })

  it('should return 401 if not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const req = new NextRequest(`http://localhost:3000/api/chat/${mockAgentId}`, {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    })
    const res = await POST(req, { params: { agentId: mockAgentId } })
    expect(res.status).toBe(401)
  })

  it('should return 400 if agent ID format is invalid', async () => {
    const req = new NextRequest(`http://localhost:3000/api/chat/invalid-id`, {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    })
    const res = await POST(req, { params: { agentId: 'invalid-id' } })
    expect(res.status).toBe(400)
    
    const data = await res.json()
    expect(data.error).toBe('Invalid agent ID format')
  })

  it('should return 404 if agent not found', async () => {
    mockAgentFindUnique.mockResolvedValue(null)

    const req = new NextRequest(`http://localhost:3000/api/chat/${mockAgentId}`, {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    })
    const res = await POST(req, { params: { agentId: mockAgentId } })
    expect(res.status).toBe(404)
  })

  it('should return 400 if messages format is invalid', async () => {
    const req = new NextRequest(`http://localhost:3000/api/chat/${mockAgentId}`, {
      method: 'POST',
      body: JSON.stringify({
        // Missing messages field
      }),
    })
    const res = await POST(req, { params: { agentId: mockAgentId } })
    const data = await res.json()
    
    expect(res.status).toBe(400)
    expect(data.error).toBe('Invalid messages format')
  })

  it('should handle streaming chat response', async () => {
    const req = new NextRequest(`http://localhost:3000/api/chat/${mockAgentId}`, {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello, how are you?' }],
      }),
    })
    const res = await POST(req, { params: { agentId: mockAgentId } })
    
    expect(res).toBeInstanceOf(StreamingTextResponse)
    
    // Verify OpenAI was called
    expect(mockOpenAICreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4-turbo',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user', content: 'Hello, how are you?' })
        ]),
        stream: true
      })
    )
    
    // Verify message was saved
    expect(mockChatMessageCreate).toHaveBeenCalledWith({
      data: {
        agent_id: mockAgentId,
        user_id: mockUserId,
        role: 'user',
        content: 'Hello, how are you?',
        metadata: {}
      }
    })
  })

  it('should handle invalid JSON', async () => {
    const req = new NextRequest(`http://localhost:3000/api/chat/${mockAgentId}`, {
      method: 'POST',
      body: 'invalid json',
    })
    const res = await POST(req, { params: { agentId: mockAgentId } })
    const data = await res.json()
    
    expect(res.status).toBe(400)
    expect(data.error).toBe('Invalid JSON in request body')
  })

  it('should handle errors gracefully', async () => {
    mockOpenAICreate.mockRejectedValueOnce(new Error('API error'))

    const req = new NextRequest(`http://localhost:3000/api/chat/${mockAgentId}`, {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    })
    const res = await POST(req, { params: { agentId: mockAgentId } })
    const data = await res.json()
    
    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to process chat request')
  })
}) 