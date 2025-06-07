import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { StreamingTextResponse } from 'ai';

// Create mock functions using vi.hoisted to ensure they're defined before mocks are hoisted
const mockGetUser = vi.hoisted(() => vi.fn());
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockOpenAICreate = vi.hoisted(() => vi.fn());

// Mock ReadableStream and TransformStream for testing streaming responses
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

// Setup mocks before importing any modules
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser
    }
  }
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agent: {
      findUnique: mockFindUnique,
      update: mockUpdate
    },
    agentMemory: {
      findMany: mockFindMany
    },
    chatMessage: {
      findMany: mockFindMany,
      create: mockCreate
    }
  }
}));

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

// Import the route after mocking
import { POST } from '@/app/api/chat/[agentId]/route';

describe('Chat API Routes', () => {
  const mockAgentId = '123e4567-e89b-12d3-a456-426614174000';
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
    
    // Mock agent data
    const mockAgent = {
      id: mockAgentId,
      name: 'Test Agent',
      description: 'A test assistant',
      tools: { 'web-search': true },
      metadata: { persona: 'Helpful assistant' },
      user_id: 'test-user-id'
    };
    
    // Mock agent memory
    const mockMemory = [
      {
        key: 'weekly_goals',
        value: 'Help with testing',
        type: 'string'
      },
      {
        key: 'preferences',
        value: JSON.stringify(['Clear explanations', 'Code examples']),
        type: 'json'
      },
      {
        key: 'recent_learnings',
        value: JSON.stringify(['Testing is important']),
        type: 'json'
      }
    ];
    
    // Mock chat history
    const mockChatHistory = [
      {
        agent_id: mockAgentId,
        user_id: 'test-user-id',
        role: 'user',
        content: 'Hello',
        created_at: new Date(Date.now() - 60000).toISOString()
      },
      {
        agent_id: mockAgentId,
        user_id: 'test-user-id',
        role: 'assistant',
        content: 'Hi there! How can I help you today?',
        created_at: new Date(Date.now() - 30000).toISOString()
      }
    ];
    
    // Setup default mocks
    mockFindUnique.mockResolvedValue(mockAgent);
    mockFindMany
      .mockResolvedValueOnce(mockMemory)      // First call for agent memory
      .mockResolvedValueOnce(mockChatHistory); // Second call for chat history
    mockCreate.mockResolvedValue({});
    mockUpdate.mockResolvedValue({});
    
    // Mock OpenAI streaming response
    mockOpenAICreate.mockResolvedValue({
      toReadableStream: () => new MockReadableStream('This is a test response')
    });
    
    // Create mock request with messages
    mockRequest = new NextRequest(
      `http://localhost:3000/api/chat/${mockAgentId}`,
      {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'How are you?' }
          ]
        })
      }
    );
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('POST /api/chat/[agentId]', () => {
    it('should return a streaming response for valid request', async () => {
      // Call the API handler
      const response = await POST(mockRequest, { params: { agentId: mockAgentId } });
      
      // Verify response is a streaming response
      expect(response).toBeInstanceOf(StreamingTextResponse);
      
      // Verify Prisma calls
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          id: mockAgentId,
          user_id: 'test-user-id'
        }
      });
      
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          agent_id: mockAgentId
        }
      });
      
      // Verify message was saved
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          agent_id: mockAgentId,
          user_id: 'test-user-id',
          role: 'user',
          content: 'How are you?',
          metadata: {}
        }
      });
      
      // Verify OpenAI was called with correct parameters
      expect(mockOpenAICreate).toHaveBeenCalledWith({
        model: 'gpt-4-turbo',
        messages: expect.arrayContaining([
          { role: 'system', content: expect.stringContaining('Test Agent') },
          { role: 'user', content: 'How are you?' }
        ]),
        temperature: 0.7,
        max_tokens: 1000,
        stream: true
      });
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated user
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });
      
      // Call the API handler
      const response = await POST(mockRequest, { params: { agentId: mockAgentId } });
      const responseData = await response.json();
      
      // Verify response
      expect(response.status).toBe(401);
      expect(responseData).toEqual({ error: 'Unauthorized' });
    });
    
    it('should return 400 if agent ID format is invalid', async () => {
      // Call the API handler with invalid agent ID
      const response = await POST(mockRequest, { params: { agentId: 'invalid-id' } });
      const responseData = await response.json();
      
      // Verify response
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'Invalid agent ID format' });
    });
    
    it('should return 404 if agent is not found', async () => {
      // Mock agent not found
      mockFindUnique.mockResolvedValueOnce(null);
      
      // Call the API handler
      const response = await POST(mockRequest, { params: { agentId: mockAgentId } });
      const responseData = await response.json();
      
      // Verify response
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Agent not found' });
    });
    
    it('should return 400 if messages format is invalid', async () => {
      // Create mock request with invalid messages
      mockRequest = new NextRequest(
        `http://localhost:3000/api/chat/${mockAgentId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            // Missing messages array
          })
        }
      );
      
      // Call the API handler
      const response = await POST(mockRequest, { params: { agentId: mockAgentId } });
      const responseData = await response.json();
      
      // Verify response
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'Invalid messages format' });
    });
    
    it('should handle errors gracefully', async () => {
      // Mock OpenAI error
      mockOpenAICreate.mockRejectedValueOnce(new Error('API error'));
      
      // Call the API handler
      const response = await POST(mockRequest, { params: { agentId: mockAgentId } });
      const responseData = await response.json();
      
      // Verify response
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Failed to process chat request' });
    });
    
    it('should process agent memory correctly', async () => {
      // Mock agent memory with some missing values
      mockFindMany
        .mockResolvedValueOnce([
          {
            key: 'weekly_goals',
            value: 'Help with testing',
            type: 'string'
          }
          // Missing preferences and recent_learnings
        ])
        .mockResolvedValueOnce([]); // Empty chat history
      
      // Call the API handler
      await POST(mockRequest, { params: { agentId: mockAgentId } });
      
      // Verify OpenAI was called with correct parameters
      expect(mockOpenAICreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            {
              role: 'system',
              content: expect.stringContaining('Your current goals: Help with testing')
            }
          ])
        })
      );
    });
    
    it('should handle invalid JSON in agent memory', async () => {
      // Mock agent memory with invalid JSON
      mockFindMany
        .mockResolvedValueOnce([
          {
            key: 'preferences',
            value: '{invalid-json}', // Invalid JSON
            type: 'json'
          }
        ])
        .mockResolvedValueOnce([]); // Empty chat history
      
      // Call the API handler - should not throw error
      const response = await POST(mockRequest, { params: { agentId: mockAgentId } });
      
      // Verify it's a streaming response (didn't error out)
      expect(response).toBeInstanceOf(StreamingTextResponse);
    });
  });
});
