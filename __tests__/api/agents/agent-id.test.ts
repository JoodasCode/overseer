import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, PATCH, DELETE } from '@/app/api/agents/[id]/route';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase-client';

// Mock Supabase client
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agent: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  },
}));

describe('Agent ID API', () => {
  let mockRequest: NextRequest;
  const mockParams = { id: '123e4567-e89b-12d3-a456-426614174000' };
  
  // Define mock data that can be used across tests
  const mockAgent = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Agent',
    description: 'Test description',
    avatar_url: 'https://example.com/avatar.png',
    user_id: 'test-user-id',
    tools: { test: true },
    preferences: { theme: 'dark' },
    metadata: { version: '1.0' },
    recent_learnings: ['Test learning']
  };
  
  const mockMemories = [
    {
      id: 'memory-1',
      content: 'Test memory content',
      agent_id: '123e4567-e89b-12d3-a456-426614174000',
      created_at: new Date().toISOString()
    }
  ];
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create mock request
    mockRequest = new NextRequest('https://example.com/api/agents/123e4567-e89b-12d3-a456-426614174000');
    
    // Default Supabase auth mock
    supabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('GET /api/agents/[id]', () => {
    it('should return agent with memory for authenticated user', async () => {
      // Mock Prisma agent query with memory included
      prisma.agent.findUnique = vi.fn().mockResolvedValue({
        ...mockAgent,
        agentMemory: mockMemories
      });
      
      // Call the API handler
      const response = await GET(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('agent');
      expect(responseData.agent).toEqual(expect.objectContaining(mockAgent));
      expect(responseData.agent).toHaveProperty('agentMemory');
      expect(responseData.agent.agentMemory).toEqual(mockMemories);
    });
    
    it('should return 404 if agent is not found', async () => {
      // Mock agent not found
      prisma.agent.findUnique = vi.fn().mockResolvedValue(null);
      
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
      // Mock request body - only use fields defined in AgentUpdateRequest interface
      const requestBody = {
        name: 'Updated Agent Name',
        description: 'Updated description'
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'https://example.com/api/agents/123e4567-e89b-12d3-a456-426614174000',
        {
          method: 'PATCH',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Mock updated agent response
      const mockUpdatedAgent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Agent Name',
        description: 'Updated description',
        user_id: 'test-user-id',
        agentMemory: []
      };
      
      // Mock agent update
      prisma.agent.findFirst = vi.fn().mockResolvedValue(mockAgent);
      prisma.agent.update = vi.fn().mockResolvedValue(mockUpdatedAgent);
      
      // Call the API handler
      const response = await PATCH(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('agent');
      expect(responseData.agent).toEqual(mockUpdatedAgent);
      
      // Verify Prisma calls
      expect(prisma.agent.findFirst).toHaveBeenCalledWith({
        where: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          user_id: 'test-user-id'
        }
      });
      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: {
          id: '123e4567-e89b-12d3-a456-426614174000'
        },
        data: {
          name: 'Updated Agent Name',
          description: 'Updated description'
        },
        include: {
          agentMemory: true
        }
      });
    });
    
    it('should return 404 if agent is not found during update', async () => {
      // Mock request body
      const requestBody = {
        name: 'Updated Agent Name'
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'https://example.com/api/agents/123e4567-e89b-12d3-a456-426614174000',
        {
          method: 'PATCH',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Mock agent not found
      prisma.agent.findFirst = vi.fn().mockResolvedValue(null);
      
      // Call the API handler
      const response = await PATCH(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Agent not found or you do not have permission to update it' });
    });
  });
  
  describe('DELETE /api/agents/[id]', () => {
    it('should delete agent and return success message', async () => {
      // Mock successful delete
      prisma.agent.findFirst = vi.fn().mockResolvedValue(mockAgent);
      prisma.agent.delete = vi.fn().mockResolvedValue(mockAgent);
      
      // Call the API handler
      const response = await DELETE(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      expect(responseData).toEqual({ message: 'Agent deleted successfully' });
      
      // Verify Prisma calls
      expect(prisma.agent.findFirst).toHaveBeenCalledWith({
        where: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          user_id: 'test-user-id'
        }
      });
      expect(prisma.agent.delete).toHaveBeenCalledWith({
        where: {
          id: '123e4567-e89b-12d3-a456-426614174000'
        }
      });
    });
    
    it('should return 500 if delete operation fails', async () => {
      // Mock delete error
      prisma.agent.findFirst = vi.fn().mockResolvedValue(mockAgent);
      prisma.agent.delete = vi.fn().mockRejectedValue(new Error('Database error'));
      
      // Call the API handler
      const response = await DELETE(mockRequest, { params: mockParams });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Failed to delete agent', details: 'Database error' });
    });
  });
});
