import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Create mock functions using vi.hoisted to ensure they're defined before mocks are hoisted
const mockGetUser = vi.hoisted(() => vi.fn());
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockFindFirst = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockMemoryLogFindMany = vi.hoisted(() => vi.fn());
const mockMemoryLogCreate = vi.hoisted(() => vi.fn());

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
      findUnique: mockFindUnique,
    },
    agentMemory: {
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      findUnique: mockFindUnique,
      update: mockUpdate,
      create: mockCreate,
    },
    memoryLog: {
      findMany: mockMemoryLogFindMany,
      create: mockMemoryLogCreate,
    },
  },
}));

// Import the route after mocking
import { GET, PATCH, POST } from '@/app/api/agents/[id]/memory/route';

describe('Agent Memory API', () => {
  let mockRequest: NextRequest;
  const mockParams = { id: '123e4567-e89b-12d3-a456-426614174000' };
  
  // Define mock data that can be used across tests
  const mockAgent = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Agent',
    description: 'Test description',
    user_id: 'test-user-id',
  };
  
  const mockMemory = [
    {
      id: 'memory-id-1',
      agent_id: '123e4567-e89b-12d3-a456-426614174000',
      key: 'weekly_goals',
      value: 'Test goals',
      type: 'string',
      metadata: {}
    },
    {
      id: 'memory-id-2',
      agent_id: '123e4567-e89b-12d3-a456-426614174000',
      key: 'preferences',
      value: JSON.stringify(['Test preference']),
      type: 'json',
      metadata: {}
    },
    {
      id: 'memory-id-3',
      agent_id: '123e4567-e89b-12d3-a456-426614174000',
      key: 'recent_learnings',
      value: JSON.stringify(['Test learning']),
      type: 'json',
      metadata: {}
    }
  ];
  
  const mockLogs = [
    {
      id: 'log-1',
      agent_id: '123e4567-e89b-12d3-a456-426614174000',
      operation: 'learning',
      key: 'recent_learnings',
      new_value: 'Test learning',
      old_value: null,
      metadata: {},
      created_at: new Date().toISOString()
    }
  ];
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create mock request
    mockRequest = new NextRequest(`http://localhost:3000/api/agents/${mockParams.id}/memory`);
    
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('GET /api/agents/[id]/memory', () => {
    it('should return agent memory and recent memory logs', async () => {
      // Mock Prisma responses
      mockFindUnique.mockResolvedValue(mockAgent);
      mockFindMany.mockResolvedValue(mockMemory);
      mockMemoryLogFindMany.mockResolvedValue(mockLogs);
      
      // Call the API handler
      const response = await GET(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('memory');
      expect(responseData).toHaveProperty('logs');
      expect(responseData.memory).toEqual(mockMemory);
      expect(responseData.logs).toEqual(mockLogs);
      
      // Verify Prisma calls
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          id: mockParams.id,
          user_id: 'test-user-id'
        }
      });
      
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          agent_id: mockParams.id
        }
      });
      
      expect(mockMemoryLogFindMany).toHaveBeenCalledWith({
        where: {
          agent_id: mockParams.id
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 20
      });
    });
    
    it('should return 404 if agent is not found', async () => {
      // Mock agent not found
      mockFindUnique.mockResolvedValue(null);
      
      // Call the API handler
      const response = await GET(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Agent not found or you do not have permission to access it' });
      
      // Verify Prisma calls
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          id: mockParams.id,
          user_id: 'test-user-id'
        }
      });
    });
  });
  
  describe('PATCH /api/agents/[id]/memory', () => {
    it('should update agent memory', async () => {
      // Mock request body
      const requestBody = {
        key: 'weekly_goals',
        value: 'Updated goals',
        type: 'string',
        metadata: {}
      };
      
      // Set request body
      mockRequest = new NextRequest(
        `http://localhost:3000/api/agents/${mockParams.id}/memory`,
        {
          method: 'PATCH',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Mock agent and memory responses
      mockFindUnique.mockImplementation((args) => {
        if (args?.where?.agent_id_key) {
          return Promise.resolve({
            id: 'memory-id-1',
            agent_id: mockParams.id,
            key: 'weekly_goals',
            value: 'Test goals',
            type: 'string',
            metadata: {}
          });
        }
        return Promise.resolve(mockAgent);
      });
      
      const mockUpdatedMemory = {
        id: 'memory-id-1',
        agent_id: mockParams.id,
        key: 'weekly_goals',
        value: 'Updated goals',
        type: 'string',
        metadata: {}
      };
      
      mockUpdate.mockResolvedValue(mockUpdatedMemory);
      
      // Call the API handler
      const response = await PATCH(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('memory');
      expect(responseData.memory).toEqual(mockUpdatedMemory);
      
      // Verify Prisma calls
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          id: mockParams.id,
          user_id: 'test-user-id'
        }
      });
      
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          agent_id_key: {
            agent_id: mockParams.id,
            key: requestBody.key
          }
        }
      });
      
      expect(mockUpdate).toHaveBeenCalledWith({
        where: {
          agent_id_key: {
            agent_id: mockParams.id,
            key: requestBody.key
          }
        },
        data: {
          value: requestBody.value,
          type: requestBody.type,
          metadata: requestBody.metadata
        }
      });
    });
  });
  
  describe('POST /api/agents/[id]/memory', () => {
    it('should add a new memory log entry', async () => {
      // Mock request body
      const requestBody = {
        operation: 'learning',
        key: 'recent_learnings',
        new_value: 'New learning',
        created_at: new Date().toISOString()
      };
      
      // Set request body
      mockRequest = new NextRequest(
        `http://localhost:3000/api/agents/${mockParams.id}/memory`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Mock memory log creation response
      const mockMemoryLog = {
        id: 'log-id',
        agent_id: mockParams.id,
        operation: 'learning',
        key: 'recent_learnings',
        new_value: 'New learning',
        old_value: null,
        metadata: {},
        created_at: new Date().toISOString()
      };
      
      // Mock existing memory for recent learnings
      const mockExistingMemory = {
        id: 'memory-id-3',
        agent_id: mockParams.id,
        key: 'recent_learnings',
        value: JSON.stringify(['Existing learning']),
        type: 'json',
        metadata: {}
      };
      
      // Mock updated memory
      const mockUpdatedMemory = {
        id: 'memory-id-3',
        agent_id: mockParams.id,
        key: 'recent_learnings',
        value: JSON.stringify(['New learning', 'Existing learning']),
        type: 'json',
        metadata: {}
      };
      
      // Mock Prisma responses
      mockFindUnique.mockResolvedValue(mockAgent);
      mockMemoryLogCreate.mockResolvedValue(mockMemoryLog);
      mockFindFirst.mockResolvedValue(mockExistingMemory);
      mockUpdate.mockResolvedValue(mockUpdatedMemory);
      
      // Call the API handler
      const response = await POST(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(201);
      expect(responseData).toHaveProperty('log');
      expect(responseData.log).toEqual(mockMemoryLog);
      
      // Verify Prisma calls
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          id: mockParams.id,
          user_id: 'test-user-id'
        }
      });
      
      expect(mockMemoryLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          agent_id: mockParams.id,
          operation: requestBody.operation,
          key: requestBody.key,
          new_value: requestBody.new_value,
          metadata: {}
        })
      });
      
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          agent_id: mockParams.id,
          key: 'recent_learnings'
        }
      });
      
      expect(mockUpdate).toHaveBeenCalledWith({
        where: {
          id: mockExistingMemory.id
        },
        data: {
          value: expect.any(String)
        }
      });
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Mock request with missing fields
      const invalidRequestBody = {
        // Missing operation
        key: 'recent_learnings',
        new_value: 'New learning'
      };
      
      // Set request body
      mockRequest = new NextRequest(
        `http://localhost:3000/api/agents/${mockParams.id}/memory`,
        {
          method: 'POST',
          body: JSON.stringify(invalidRequestBody)
        }
      );
      
      // Mock Prisma responses
      mockFindUnique.mockResolvedValue(mockAgent);
      
      // Call the API handler
      const response = await POST(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'Missing required fields: operation, key, new_value' });
    });
  });
});
