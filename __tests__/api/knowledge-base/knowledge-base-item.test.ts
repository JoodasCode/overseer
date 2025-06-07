import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Create mock functions using vi.hoisted to ensure they're defined before mocks are hoisted
const mockGetUser = vi.hoisted(() => vi.fn());
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());

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
    knowledgeBase: {
      findUnique: mockFindUnique,
      update: mockUpdate,
      delete: mockDelete,
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'test-user-id',
        role: 'USER',
        api_keys: []
      })
    }
  },
}));

// Import the route after mocking
import { GET, PATCH, DELETE } from '@/app/api/knowledge-base/[id]/route';

describe('Knowledge Base Item API', () => {
  const mockEntryId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = 'test-user-id';
  let mockRequest: NextRequest;
  let mockParams: { params: { id: string } };
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create mock request
    mockRequest = new NextRequest(`http://localhost:3000/api/knowledge-base/${mockEntryId}`);
    
    // Create mock params
    mockParams = { params: { id: mockEntryId } };
    
    // Mock authenticated user by default
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });
    
    // Mock successful database operations by default
    mockFindUnique.mockResolvedValue({
      id: mockEntryId,
      user_id: mockUserId,
      title: 'Test Entry',
      description: 'Test description',
      type: 'text',
      content: 'Test content',
      url: null,
      file_path: null,
      metadata: {},
      embedding: {},
      created_at: new Date(),
      updated_at: new Date()
    });
    mockUpdate.mockResolvedValue({});
    mockDelete.mockResolvedValue({});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('GET /api/knowledge-base/[id]', () => {
    it('should return a specific knowledge base entry', async () => {
      // Call the API handler
      const response = await GET(mockRequest, mockParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(200);
      expect(responseData).toHaveProperty('entry');
      expect(responseData.entry).toEqual({
        id: mockEntryId,
        user_id: 'test-user-id',
        title: 'Test Entry',
        description: 'Test description',
        type: 'text',
        content: 'Test content',
        url: null,
        file_path: null,
        metadata: {},
        embedding: {},
        created_at: expect.any(String),
        updated_at: expect.any(String)
      });
      
      // Verify Prisma calls
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          id: mockEntryId,
          user_id: 'test-user-id'
        }
      });
    });
    
    it('should return 400 if ID is not a valid UUID', async () => {
      // Create mock params with invalid UUID
      const invalidParams = { params: { id: 'not-a-uuid' } };
      
      // Call the API handler
      const response = await GET(mockRequest, invalidParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Invalid knowledge base entry ID format');
      
      // Verify Prisma was not called
      expect(mockFindUnique).not.toHaveBeenCalled();
    });
    
    it('should return 404 if entry is not found', async () => {
      // Mock entry not found
      mockFindUnique.mockResolvedValue(null);
      
      // Call the API handler
      const response = await GET(mockRequest, mockParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(404);
      expect(responseData).toHaveProperty('error', 'Knowledge base entry not found');
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated user
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });
      
      // Call the API handler
      const response = await GET(mockRequest, mockParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(401);
      expect(responseData).toHaveProperty('error', 'Unauthorized');
    });
    
    it('should return 500 if database operation fails', async () => {
      // Ensure authentication succeeds but database operation fails
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
      
      // Mock Prisma error
      mockFindUnique.mockRejectedValue(new Error('Database error'));
      
      // Call the API handler
      const response = await GET(mockRequest, mockParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(500);
      expect(responseData).toHaveProperty('error', 'Failed to fetch knowledge base entry');
      expect(responseData).toHaveProperty('details', 'Database error');
    });
  });
  
  describe('PATCH /api/knowledge-base/[id]', () => {
    it('should update a knowledge base entry', async () => {
      // Ensure authentication succeeds
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
      
      // Mock existing entry
      const existingEntry = {
        id: mockEntryId,
        title: 'Original Title',
        description: 'Original description',
        metadata: { tags: ['original'] },
        user_id: mockUserId,
        type: 'text',
        content: 'Test content',
        url: null,
        file_path: null,
        embedding: {},
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockFindUnique.mockResolvedValue(existingEntry);
      
      // Mock request body
      const requestBody = {
        title: 'Updated Title',
        description: 'Updated description',
        metadata: { tags: ['updated'] }
      };
      
      // Set request body
      mockRequest = new NextRequest(
        `http://localhost:3000/api/knowledge-base/${mockEntryId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Mock updated entry
      const updatedEntry = {
        id: mockEntryId,
        title: 'Updated Title',
        description: 'Updated description',
        metadata: { tags: ['original', 'updated'] },
        user_id: mockUserId,
        type: 'text',
        url: null,
        file_path: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockUpdate.mockResolvedValue(updatedEntry);
      
      // Call the API handler
      const response = await PATCH(mockRequest, mockParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(200);
      expect(responseData).toHaveProperty('entry');
      expect(responseData.entry).toEqual(updatedEntry);
      
      // Verify Prisma calls
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          id: mockEntryId,
          user_id: mockUserId
        }
      });
      
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: mockEntryId },
        data: {
          title: requestBody.title,
          description: requestBody.description,
          metadata: {
            ...existingEntry.metadata,
            ...requestBody.metadata
          }
        },
        select: expect.any(Object)
      });
    });
    
    it('should return 400 if no fields to update are provided', async () => {
      // Ensure authentication succeeds
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
      
      // Mock request with empty body
      mockRequest = new NextRequest(
        `http://localhost:3000/api/knowledge-base/${mockEntryId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({})
        }
      );
      
      // Call the API handler
      const response = await PATCH(mockRequest, mockParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'No fields to update provided');
      
      // Verify Prisma was not called
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
    
    it('should return 404 if entry is not found', async () => {
      // Ensure authentication succeeds
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
      
      // Mock request body
      const requestBody = {
        title: 'Updated Title'
      };
      
      // Set request body
      mockRequest = new NextRequest(
        `http://localhost:3000/api/knowledge-base/${mockEntryId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Mock entry not found
      mockFindUnique.mockResolvedValue(null);
      
      // Call the API handler
      const response = await PATCH(mockRequest, mockParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(404);
      expect(responseData).toHaveProperty('error', 'Knowledge base entry not found');
      
      // Verify update was not called
      expect(mockUpdate).not.toHaveBeenCalled();
    });
    
    it('should return 400 if ID is not a valid UUID', async () => {
      // Ensure authentication succeeds
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
      
      // Create mock params with invalid UUID
      const invalidParams = { params: { id: 'not-a-uuid' } };
      
      // Mock request body
      const requestBody = {
        title: 'Updated Title'
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/knowledge-base/not-a-uuid',
        {
          method: 'PATCH',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Call the API handler
      const response = await PATCH(mockRequest, invalidParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Invalid knowledge base entry ID format');
      
      // Verify Prisma was not called
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
  
  describe('DELETE /api/knowledge-base/[id]', () => {
    it('should delete a knowledge base entry', async () => {
      // Ensure authentication and entry exists
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
      
      mockFindUnique.mockResolvedValue({
        id: mockEntryId,
        user_id: mockUserId,
        title: 'Test Entry',
        description: 'Test description',
        type: 'text',
        content: 'Test content',
        url: null,
        file_path: null,
        metadata: {},
        embedding: {},
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Mock successful delete
      mockDelete.mockResolvedValue({});
      
      // Call the API handler
      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(200);
      expect(responseData).toHaveProperty('message', 'Knowledge base entry deleted successfully');
      
      // Verify Prisma calls
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          id: mockEntryId,
          user_id: mockUserId
        }
      });
      
      expect(mockDelete).toHaveBeenCalledWith({
        where: {
          id: mockEntryId
        }
      });
    });
    
    it('should return 404 if entry is not found', async () => {
      // Ensure authentication succeeds but entry not found
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });
      
      // Mock entry not found
      mockFindUnique.mockResolvedValue(null);
      
      // Call the API handler
      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(404);
      expect(responseData).toHaveProperty('error', 'Knowledge base entry not found');
      
      // Verify delete was not called
      expect(mockDelete).not.toHaveBeenCalled();
    });
    
    it('should return 400 if ID is not a valid UUID', async () => {
      // Create mock params with invalid UUID
      const invalidParams = { params: { id: 'not-a-uuid' } };
      
      // Call the API handler
      const response = await DELETE(mockRequest, invalidParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Invalid knowledge base entry ID format');
      
      // Verify Prisma was not called
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect(mockDelete).not.toHaveBeenCalled();
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated user
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });
      
      // Call the API handler
      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(401);
      expect(responseData).toHaveProperty('error', 'Unauthorized');
      
      // Verify Prisma was not called
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect(mockDelete).not.toHaveBeenCalled();
    });
    
    it('should return 500 if database operation fails', async () => {
      // Ensure authentication succeeds but database operation fails
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
      
      // Mock entry exists but delete fails
      mockFindUnique.mockResolvedValue({
        id: mockEntryId,
        user_id: mockUserId,
        title: 'Test Entry',
        description: 'Test description',
        type: 'text',
        content: 'Test content',
        url: null,
        file_path: null,
        metadata: {},
        embedding: {},
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Mock Prisma error
      mockDelete.mockRejectedValue(new Error('Database error'));
      
      // Call the API handler
      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(500);
      expect(responseData).toHaveProperty('error', 'Failed to delete knowledge base entry');
      expect(responseData).toHaveProperty('details', 'Database error');
    });
  });
});
