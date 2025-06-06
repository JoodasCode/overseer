import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, PATCH, DELETE } from '@/app/api/agents/[id]/route';

// Mock Supabase client
vi.mock('@/lib/supabase-client', () => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
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
        delete: mockDelete,
        single: mockSingle
      }))
    }
  };
});

describe('Agent ID API', () => {
  let mockRequest: NextRequest;
  const mockParams = { id: 'test-agent-id' };
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create mock request
    mockRequest = new NextRequest('http://localhost:3000/api/agents/test-agent-id');
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('GET /api/agents/[id]', () => {
    it('should return agent with memory for authenticated user', async () => {
      // Mock Supabase response
      const mockAgent = {
        id: 'test-agent-id',
        name: 'Test Agent',
        role: 'Assistant',
        user_id: 'test-user-id'
      };
      
      const mockMemory = {
        id: 'memory-id',
        agent_id: 'test-agent-id',
        weekly_goals: 'Test goals',
        preferences: ['Test preference'],
        recent_learnings: ['Test learning']
      };
      
      const { supabase } = await import('@/lib/supabase-client');
      
      // Mock agent query
      supabase.from().select().eq().eq().single = vi.fn().mockResolvedValue({
        data: mockAgent,
        error: null
      });
      
      // Mock memory query
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
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis()
        };
      });
      
      // Call the API handler
      const response = await GET(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('agent');
      expect(responseData.agent).toEqual(expect.objectContaining({
        id: 'test-agent-id',
        name: 'Test Agent'
      }));
      expect(responseData.agent).toHaveProperty('memory');
      expect(responseData.agent.memory).toEqual(mockMemory);
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
  
  describe('PATCH /api/agents/[id]', () => {
    it('should update agent details', async () => {
      // Mock request body
      const requestBody = {
        name: 'Updated Agent Name',
        persona: 'Updated persona'
      };
      
      // Mock JSON parsing
      mockRequest.json = vi.fn().mockResolvedValue(requestBody);
      
      // Mock Supabase response
      const mockUpdatedAgent = {
        id: 'test-agent-id',
        name: 'Updated Agent Name',
        persona: 'Updated persona',
        user_id: 'test-user-id'
      };
      
      const { supabase } = await import('@/lib/supabase-client');
      
      // Mock agent update
      supabase.from().update().eq().eq().select().single = vi.fn().mockResolvedValue({
        data: mockUpdatedAgent,
        error: null
      });
      
      // Call the API handler
      const response = await PATCH(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('agent');
      expect(responseData.agent).toEqual(mockUpdatedAgent);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('agents');
      expect(supabase.from().update).toHaveBeenCalledWith({
        name: 'Updated Agent Name',
        persona: 'Updated persona'
      });
    });
    
    it('should return 404 if agent is not found during update', async () => {
      // Mock request body
      const requestBody = {
        name: 'Updated Agent Name'
      };
      
      // Mock JSON parsing
      mockRequest.json = vi.fn().mockResolvedValue(requestBody);
      
      const { supabase } = await import('@/lib/supabase-client');
      
      // Mock agent not found
      supabase.from().update().eq().eq().select().single = vi.fn().mockResolvedValue({
        data: null,
        error: null
      });
      
      // Call the API handler
      const response = await PATCH(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Agent not found' });
    });
  });
  
  describe('DELETE /api/agents/[id]', () => {
    it('should delete agent and return success message', async () => {
      const { supabase } = await import('@/lib/supabase-client');
      
      // Mock successful delete
      supabase.from().delete().eq().eq = vi.fn().mockResolvedValue({
        error: null
      });
      
      // Call the API handler
      const response = await DELETE(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      expect(responseData).toEqual({ message: 'Agent deleted successfully' });
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('agents');
      expect(supabase.from().delete).toHaveBeenCalled();
      expect(supabase.from().delete().eq).toHaveBeenCalledWith('id', 'test-agent-id');
      expect(supabase.from().delete().eq().eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    });
    
    it('should return 500 if delete operation fails', async () => {
      const { supabase } = await import('@/lib/supabase-client');
      
      // Mock delete error
      supabase.from().delete().eq().eq = vi.fn().mockResolvedValue({
        error: { message: 'Database error' }
      });
      
      // Call the API handler
      const response = await DELETE(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Database error' });
    });
  });
});
