import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, PATCH, POST } from '@/app/api/agents/[id]/memory/route';

// Mock Supabase client
vi.mock('@/lib/supabase-client', () => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();
  const mockSingle = vi.fn().mockReturnThis();
  
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: { id: 'test-user-id' }
          }
        })
      },
      from: vi.fn().mockImplementation(() => ({
        select: mockSelect,
        eq: mockEq,
        update: mockUpdate,
        insert: mockInsert,
        order: mockOrder,
        limit: mockLimit,
        single: mockSingle
      }))
    }
  };
});

describe('Agent Memory API', () => {
  let mockRequest: NextRequest;
  const mockParams = { id: 'test-agent-id' };
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create mock request
    mockRequest = new NextRequest('http://localhost:3000/api/agents/test-agent-id/memory');
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('GET /api/agents/[id]/memory', () => {
    it('should return agent memory and recent memory logs', async () => {
      // Mock Supabase responses
      const mockMemory = {
        id: 'memory-id',
        agent_id: 'test-agent-id',
        weekly_goals: 'Test goals',
        preferences: ['Test preference'],
        recent_learnings: ['Test learning']
      };
      
      const mockMemoryLogs = [
        {
          id: 'log-1',
          agent_id: 'test-agent-id',
          type: 'learning',
          content: 'Test learning',
          created_at: new Date().toISOString()
        }
      ];
      
      // Mock agent verification
      const mockAgent = {
        id: 'test-agent-id',
        name: 'Test Agent',
        user_id: 'test-user-id'
      };
      
      const { supabase } = await import('@/lib/supabase-client');
      
      // Setup mock implementation for different tables
      supabase.from = vi.fn().mockImplementation((table) => {
        if (table === 'agents') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({
                    data: mockAgent,
                    error: null
                  })
                })
              })
            })
          };
        } else if (table === 'agent_memory') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: mockMemory,
                  error: null
                })
              })
            })
          };
        } else if (table === 'memory_logs') {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => Promise.resolve({
                    data: mockMemoryLogs,
                    error: null
                  })
                })
              })
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis()
        };
      });
      
      // Call the API handler
      const response = await GET(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('memory');
      expect(responseData).toHaveProperty('memory_logs');
      expect(responseData.memory).toEqual(mockMemory);
      expect(responseData.memory_logs).toEqual(mockMemoryLogs);
    });
    
    it('should return 404 if agent is not found', async () => {
      const { supabase } = await import('@/lib/supabase-client');
      
      // Mock agent not found
      supabase.from().select().eq().eq().single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Agent not found' }
      });
      
      // Call the API handler
      const response = await GET(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Agent not found' });
    });
  });
  
  describe('PATCH /api/agents/[id]/memory', () => {
    it('should update agent memory fields', async () => {
      // Mock request body
      const requestBody = {
        weekly_goals: 'Updated goals',
        preferences: ['Updated preference']
      };
      
      // Mock JSON parsing
      mockRequest.json = vi.fn().mockResolvedValue(requestBody);
      
      // Mock Supabase responses
      const mockUpdatedMemory = {
        id: 'memory-id',
        agent_id: 'test-agent-id',
        weekly_goals: 'Updated goals',
        preferences: ['Updated preference'],
        recent_learnings: ['Test learning']
      };
      
      // Mock agent verification
      const mockAgent = {
        id: 'test-agent-id',
        name: 'Test Agent',
        user_id: 'test-user-id'
      };
      
      const { supabase } = await import('@/lib/supabase-client');
      
      // Setup mock implementation for different tables
      supabase.from = vi.fn().mockImplementation((table) => {
        if (table === 'agents') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({
                    data: mockAgent,
                    error: null
                  })
                })
              })
            })
          };
        } else if (table === 'agent_memory') {
          return {
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: () => Promise.resolve({
                    data: mockUpdatedMemory,
                    error: null
                  })
                })
              })
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis()
        };
      });
      
      // Call the API handler
      const response = await PATCH(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('memory');
      expect(responseData.memory).toEqual(mockUpdatedMemory);
    });
  });
  
  describe('POST /api/agents/[id]/memory', () => {
    it('should add a new memory log entry', async () => {
      // Mock request body
      const requestBody = {
        type: 'learning',
        content: 'New learning'
      };
      
      // Mock JSON parsing
      mockRequest.json = vi.fn().mockResolvedValue(requestBody);
      
      // Mock Supabase responses
      const mockMemoryLog = {
        id: 'new-log-id',
        agent_id: 'test-agent-id',
        type: 'learning',
        content: 'New learning',
        created_at: new Date().toISOString()
      };
      
      // Mock agent verification
      const mockAgent = {
        id: 'test-agent-id',
        name: 'Test Agent',
        user_id: 'test-user-id'
      };
      
      // Mock memory for updating recent learnings
      const mockMemory = {
        id: 'memory-id',
        agent_id: 'test-agent-id',
        weekly_goals: 'Test goals',
        preferences: ['Test preference'],
        recent_learnings: ['Existing learning']
      };
      
      const { supabase } = await import('@/lib/supabase-client');
      
      // Setup mock implementation for different tables
      supabase.from = vi.fn().mockImplementation((table) => {
        if (table === 'agents') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({
                    data: mockAgent,
                    error: null
                  })
                })
              })
            })
          };
        } else if (table === 'memory_logs') {
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: mockMemoryLog,
                  error: null
                })
              })
            })
          };
        } else if (table === 'agent_memory') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: mockMemory,
                  error: null
                })
              })
            }),
            update: () => ({
              eq: () => Promise.resolve({
                error: null
              })
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis()
        };
      });
      
      // Call the API handler
      const response = await POST(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(201);
      expect(responseData).toHaveProperty('memory_log');
      expect(responseData.memory_log).toEqual(mockMemoryLog);
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Mock request with missing fields
      const requestBody = {
        // Missing type
        content: 'New learning'
      };
      
      // Mock JSON parsing
      mockRequest.json = vi.fn().mockResolvedValue(requestBody);
      
      // Mock agent verification
      const mockAgent = {
        id: 'test-agent-id',
        name: 'Test Agent',
        user_id: 'test-user-id'
      };
      
      const { supabase } = await import('@/lib/supabase-client');
      
      // Setup mock for agent verification
      supabase.from().select().eq().eq().single = vi.fn().mockResolvedValue({
        data: mockAgent,
        error: null
      });
      
      // Call the API handler
      const response = await POST(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'Missing required fields' });
    });
  });
});
