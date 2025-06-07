import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Create mock functions using vi.hoisted to ensure they're defined before mocks are hoisted
const mockGetUser = vi.hoisted(() => vi.fn());
const mockCount = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());

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
      count: mockCount,
      findMany: mockFindMany,
      create: mockCreate,
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
import { GET, POST } from '@/app/api/knowledge-base/route';

describe('Knowledge Base API', () => {
  const mockUserId = 'test-user-id';
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create mock request
    mockRequest = new NextRequest('http://localhost:3000/api/knowledge-base');
    
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });
    
    // Mock successful database operations by default
    mockCount.mockResolvedValue(1);
    mockFindMany.mockResolvedValue([]);
    mockCreate.mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174000',
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
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('GET /api/knowledge-base', () => {
    it('should return all knowledge base entries for authenticated user', async () => {
      // Mock Prisma responses
      const mockEntries = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Entry',
          description: 'Test description',
          type: 'text',
          url: null,
          file_path: null,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      mockCount.mockResolvedValue(1);
      mockFindMany.mockResolvedValue(mockEntries);
      
      // Call the API handler
      const response = await GET(mockRequest);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(200);
      expect(responseData).toHaveProperty('entries');
      expect(responseData.entries).toEqual(mockEntries);
      expect(responseData).toHaveProperty('pagination');
      
      // Verify Prisma calls
      expect(mockCount).toHaveBeenCalledWith({
        where: {
          user_id: mockUserId
        }
      });
      
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          user_id: mockUserId
        },
        orderBy: {
          created_at: 'desc'
        },
        skip: 0,
        take: 50,
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          url: true,
          file_path: true,
          metadata: true,
          created_at: true,
          updated_at: true,
        }
      });
    });
    
    it('should handle query parameters correctly', async () => {
      // Create mock request with query parameters
      mockRequest = new NextRequest('http://localhost:3000/api/knowledge-base?limit=10&offset=5&query=test&type=text');
      
      // Ensure authentication succeeds
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
      
      // Mock Prisma responses
      mockCount.mockResolvedValue(15);
      mockFindMany.mockResolvedValue([]);
      
      // Call the API handler
      await GET(mockRequest);
      
      // Verify Prisma calls with correct query parameters
      expect(mockCount).toHaveBeenCalledWith({
        where: {
          user_id: mockUserId,
          type: 'text',
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
          ]
        }
      });
      
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          user_id: 'test-user-id',
          type: 'text',
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
          ]
        },
        orderBy: {
          created_at: 'desc'
        },
        skip: 5,
        take: 10,
        select: expect.any(Object)
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
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(401);
      expect(responseData).toHaveProperty('error', 'Unauthorized');
    });
    
    it('should return 500 if database operation fails', async () => {
      // Mock Prisma error
      mockFindMany.mockRejectedValue(new Error('Database error'));
      
      // Ensure authentication succeeds but database operation fails
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });
      
      // Call the API handler
      const response = await GET(mockRequest);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(500);
      expect(responseData).toHaveProperty('error', 'Failed to fetch knowledge base entries');
      expect(responseData).toHaveProperty('details', 'Database error');
    });
  });
  
  describe('POST /api/knowledge-base', () => {
    it('should create a new text knowledge base entry', async () => {
      // Mock request body
      const requestBody = {
        title: 'New Entry',
        description: 'Test description',
        type: 'text',
        content: 'This is the content of the knowledge base entry',
        metadata: { tags: ['test'] }
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/knowledge-base',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Ensure authentication succeeds
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
      
      // Mock knowledge base entry creation response
      const mockEntry = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...requestBody,
        url: null,
        file_path: null,
        embedding: {},
        user_id: 'test-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockCreate.mockResolvedValue(mockEntry);
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(201);
      expect(responseData).toHaveProperty('entry');
      
      // Content and embedding should be removed from the response
      expect(responseData.entry).not.toHaveProperty('content');
      expect(responseData.entry).not.toHaveProperty('embedding');
      
      // Verify Prisma calls
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          user_id: 'test-user-id',
          title: requestBody.title,
          description: requestBody.description,
          type: requestBody.type,
          content: requestBody.content,
          url: null,
          file_path: null,
          metadata: requestBody.metadata,
          embedding: {},
        },
      });
    });
    
    it('should create a new URL knowledge base entry', async () => {
      // Mock request body
      const requestBody = {
        title: 'New URL Entry',
        description: 'Test URL description',
        type: 'url',
        content: 'This is the content of the URL entry',
        url: 'https://example.com',
        metadata: { source: 'web' }
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/knowledge-base',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Ensure authentication succeeds
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
      
      // Mock knowledge base entry creation response
      const mockEntry = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        ...requestBody,
        file_path: null,
        embedding: {},
        user_id: 'test-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockCreate.mockResolvedValue(mockEntry);
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(201);
      expect(responseData).toHaveProperty('entry');
      
      // Verify Prisma calls
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          user_id: 'test-user-id',
          title: requestBody.title,
          description: requestBody.description,
          type: requestBody.type,
          content: requestBody.content,
          url: requestBody.url,
          file_path: null,
          metadata: requestBody.metadata,
          embedding: {},
        },
      });
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Mock request with missing fields
      const requestBody = {
        // Missing title
        description: 'Test description',
        type: 'text'
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/knowledge-base',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Ensure authentication succeeds
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(400);
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Missing required fields');
    });
    
    it('should return 400 if content type validation fails', async () => {
      // Mock request with invalid content for type
      const requestBody = {
        title: 'Invalid Entry',
        description: 'Test description',
        type: 'url',
        content: 'This is content without a URL'
        // Missing url for url type
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/knowledge-base',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Ensure authentication succeeds
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(400);
      expect(responseData).toEqual({ error: 'URL is required for url type' });
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Mock request body
      const requestBody = {
        title: 'New Entry',
        description: 'Test description',
        type: 'text',
        content: 'This is content'
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/knowledge-base',
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
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(401);
      expect(responseData).toHaveProperty('error', 'Unauthorized');
    });
    
    it('should return 500 if database operation fails', async () => {
      // Mock request body
      const requestBody = {
        title: 'New Entry',
        description: 'Test description',
        type: 'text',
        content: 'This is content'
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/knowledge-base',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Ensure authentication succeeds but database operation fails
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
      
      // Mock Prisma error
      mockCreate.mockRejectedValue(new Error('Database error'));
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(500);
      expect(responseData).toHaveProperty('error', 'Failed to create knowledge base entry');
      expect(responseData).toHaveProperty('details', 'Database error');
    });
  });
});
