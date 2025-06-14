import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Create mock functions using vi.hoisted to ensure they're defined before mocks are hoisted
const mockGetUser = vi.hoisted(() => vi.fn());
const mockCount = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockAgentCreate = vi.hoisted(() => vi.fn());
const mockMemoryCreate = vi.hoisted(() => vi.fn());

// Mock Supabase client
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
    },
  },
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agent: {
      count: mockCount,
      findMany: mockFindMany,
      create: mockAgentCreate,
    },
    agentMemory: {
      create: mockMemoryCreate,
    },
  },
}));

// Import the route after mocking
import { GET, POST } from '@/app/api/agents/route';

describe('Agents API', () => {
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create mock request
    mockRequest = new NextRequest('http://localhost:3000/api/agents');
    
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('GET /api/agents', () => {
    it('should return all agents for authenticated user', async () => {
      // Mock Prisma responses
      const mockAgents = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Agent',
          description: 'Test description',
          avatar_url: 'https://example.com/avatar.png',
          tools: {},
          preferences: {},
          metadata: {},
          user_id: 'test-user-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      mockCount.mockResolvedValue(1);
      mockFindMany.mockResolvedValue(mockAgents);
      
      // Call the API handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('agents');
      expect(responseData.agents).toEqual(mockAgents);
      expect(responseData).toHaveProperty('pagination');
      
      // Verify Prisma calls
      expect(mockCount).toHaveBeenCalledWith({
        where: {
          user_id: 'test-user-id'
        }
      });
      
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          user_id: 'test-user-id'
        },
        orderBy: {
          created_at: 'desc'
        },
        skip: 0,
        take: 50,
        include: {
          agentMemory: false
        }
      });
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated user
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null
      });
      
      // Call the API handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(401);
      expect(responseData).toHaveProperty('error', 'Unauthorized');
    });
    
    it('should return 500 if database operation fails', async () => {
      // Mock Prisma error
      mockCount.mockRejectedValue(new Error('Database error'));
      
      // Call the API handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);
      expect(responseData).toHaveProperty('error', 'Failed to fetch agents');
      expect(responseData).toHaveProperty('details', 'Database error');
    });
  });
  
  describe('POST /api/agents', () => {
    it('should create a new agent with initial memory', async () => {
      // Mock request body
      const requestBody = {
        name: 'New Agent',
        description: 'Test description',
        avatar_url: 'https://example.com/avatar.png',
        tools: { 'web-search': true, 'calculator': true },
        preferences: { 'response_style': 'concise' },
        metadata: { 'persona': 'helpful assistant' }
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/agents',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Mock agent creation response
      const mockAgent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...requestBody,
        user_id: 'test-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Mock memory creation response
      const mockMemory = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        agent_id: mockAgent.id,
        key: 'system_prompt',
        value: 'I am a helpful AI assistant.',
        type: 'string',
        metadata: {
          importance: 10,
          category: 'system',
          goals: ['Learn about my user and be helpful']
        }
      };
      
      mockAgentCreate.mockResolvedValue(mockAgent);
      mockMemoryCreate.mockResolvedValue(mockMemory);
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(201);
      expect(responseData).toHaveProperty('agent');
      expect(responseData.agent).toEqual(mockAgent);
      
      // Verify Prisma calls
      expect(mockAgentCreate).toHaveBeenCalledWith({
        data: {
          user_id: 'test-user-id',
          name: requestBody.name,
          description: requestBody.description,
          avatar_url: requestBody.avatar_url,
          tools: requestBody.tools,
          preferences: requestBody.preferences,
          metadata: requestBody.metadata,
        },
      });
      
      expect(mockMemoryCreate).toHaveBeenCalledWith({
        data: {
          agent_id: mockAgent.id,
          key: 'system_prompt',
          value: 'I am a helpful AI assistant.',
          type: 'string',
          metadata: expect.objectContaining({
            importance: 10,
            category: 'system'
          }),
        },
      });
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Mock request with missing fields
      const requestBody = {
        // Missing name
        description: 'Test description'
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/agents',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'Agent name is required' });
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Mock request body
      const requestBody = {
        name: 'New Agent',
        description: 'Test description'
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/agents',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Mock unauthenticated user
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(401);
      expect(responseData).toHaveProperty('error', 'Unauthorized');
    });
    
    it('should return 500 if database operation fails', async () => {
      // Mock request body
      const requestBody = {
        name: 'New Agent',
        description: 'Test description'
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/agents',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Mock Prisma error
      mockAgentCreate.mockRejectedValue(new Error('Database error'));
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);
      expect(responseData).toHaveProperty('error', 'Failed to create agent');
      expect(responseData).toHaveProperty('details', 'Database error');
    });
  });
});
