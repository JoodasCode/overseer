import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/agents/route';

// Mock Supabase client
vi.mock('@/lib/supabase-client', () => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  
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
        order: mockOrder,
        insert: mockInsert
      }))
    }
  };
});

describe('Agents API', () => {
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create mock request
    mockRequest = new NextRequest('http://localhost:3000/api/agents');
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('GET /api/agents', () => {
    it('should return all agents for authenticated user', async () => {
      // Mock Supabase response
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Test Agent',
          role: 'Assistant',
          user_id: 'test-user-id'
        }
      ];
      
      const { supabase } = await import('@/lib/supabase-client');
      supabase.from('agents').select('*').eq('user_id', 'test-user-id').order('created_at', { ascending: false }) = vi.fn().mockResolvedValue({
        data: mockAgents,
        error: null
      });
      
      // Call the API handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      expect(responseData).toEqual({ agents: mockAgents });
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('agents');
      expect(supabase.from('agents').select).toHaveBeenCalledWith('*');
      expect(supabase.from('agents').select('*').eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(supabase.from('agents').select('*').eq('user_id', 'test-user-id').order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated user
      const { supabase } = await import('@/lib/supabase-client');
      supabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null }
      });
      
      // Call the API handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(401);
      expect(responseData).toEqual({ error: 'Unauthorized' });
    });
    
    it('should return 500 if Supabase returns an error', async () => {
      // Mock Supabase error
      const { supabase } = await import('@/lib/supabase-client');
      supabase.from('agents').select('*').eq('user_id', 'test-user-id').order('created_at', { ascending: false }) = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });
      
      // Call the API handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Database error' });
    });
  });
  
  describe('POST /api/agents', () => {
    it('should create a new agent with initial memory', async () => {
      // Mock request body
      const requestBody = {
        name: 'New Agent',
        role: 'Assistant',
        persona: 'Friendly AI assistant',
        avatar: 'https://example.com/avatar.png',
        tools: ['web-search', 'calculator']
      };
      
      // Mock JSON parsing
      mockRequest.json = vi.fn().mockResolvedValue(requestBody);
      
      // Mock Supabase responses
      const mockAgent = {
        id: 'new-agent-id',
        ...requestBody,
        user_id: 'test-user-id',
        created_at: new Date().toISOString()
      };
      
      const { supabase } = await import('@/lib/supabase-client');
      
      // Mock agent creation
      supabase.from('agents').insert(expect.any(Object)).select('*') = vi.fn().mockResolvedValue({
        data: mockAgent,
        error: null
      });
      
      // Mock memory creation
      const mockMemory = {
        id: 'memory-id',
        agent_id: 'new-agent-id',
        weekly_goals: '',
        preferences: [],
        recent_learnings: []
      };
      
      // Second call for memory creation
      supabase.from = vi.fn().mockImplementation((table) => {
        if (table === 'agents') {
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: mockAgent,
                  error: null
                })
              })
            })
          };
        } else if (table === 'agent_memory') {
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: mockMemory,
                  error: null
                })
              })
            })
          };
        }
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis()
        };
      });
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(201);
      expect(responseData).toHaveProperty('agent');
      expect(responseData.agent).toEqual(expect.objectContaining({
        id: 'new-agent-id',
        name: 'New Agent'
      }));
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Mock request with missing fields
      const requestBody = {
        // Missing name and role
        persona: 'Friendly AI assistant'
      };
      
      // Mock JSON parsing
      mockRequest.json = vi.fn().mockResolvedValue(requestBody);
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'Missing required fields' });
    });
  });
});
