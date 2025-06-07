import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Create mock functions using vi.hoisted to ensure they're defined before mocks are hoisted
const mockGetUser = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());

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
    workflow: {
      findMany: mockFindMany,
      create: mockCreate
    }
  }
}));

// Import the route after mocking
import { GET, POST } from '@/app/api/workflows/route';

describe('Workflows API Routes', () => {
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
    
    // Create mock request
    mockRequest = new NextRequest('http://localhost:3000/api/workflows');
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('GET /api/workflows', () => {
    it('should return all workflows for authenticated user', async () => {
      // Mock Prisma responses
      const mockWorkflows = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Workflow',
          description: 'Test description',
          config: { nodes: [{ id: 'node1', type: 'trigger' }] },
          status: 'draft',
          user_id: 'test-user-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      mockFindMany.mockResolvedValue(mockWorkflows);
      
      // Call the API handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('workflows');
      expect(responseData.workflows).toEqual(mockWorkflows);
      
      // Verify Prisma calls
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          user_id: 'test-user-id'
        },
        orderBy: {
          updated_at: 'desc'
        }
      });
    });
    
    it('should filter workflows by status', async () => {
      // Create request with status filter
      mockRequest = new NextRequest('http://localhost:3000/api/workflows?status=active');
      
      // Mock Prisma responses
      const mockWorkflows = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Active Workflow',
          description: 'Test description',
          config: { nodes: [{ id: 'node1', type: 'trigger' }] },
          status: 'active',
          user_id: 'test-user-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      mockFindMany.mockResolvedValue(mockWorkflows);
      
      // Call the API handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('workflows');
      expect(responseData.workflows).toEqual(mockWorkflows);
      
      // Verify Prisma calls with status filter
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          user_id: 'test-user-id',
          status: 'active'
        },
        orderBy: {
          updated_at: 'desc'
        }
      });
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated user
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' }
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
      mockFindMany.mockRejectedValue(new Error('Database error'));
      
      // Call the API handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);
      expect(responseData).toHaveProperty('error', 'Failed to fetch workflows');
      expect(responseData).toHaveProperty('details', 'Database error');
    });
  });
  
  describe('POST /api/workflows', () => {
    it('should create a new workflow', async () => {
      // Mock request body
      const requestBody = {
        name: 'New Workflow',
        description: 'Test description',
        nodes: [
          { id: 'node1', type: 'trigger', position: { x: 100, y: 100 } },
          { id: 'node2', type: 'action', position: { x: 300, y: 100 } }
        ],
        status: 'draft'
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/workflows',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Mock created workflow
      const mockCreatedWorkflow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: requestBody.name,
        description: requestBody.description,
        config: { nodes: requestBody.nodes },
        status: requestBody.status,
        user_id: 'test-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockCreate.mockResolvedValue(mockCreatedWorkflow);
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(201);
      expect(responseData).toHaveProperty('workflow');
      expect(responseData.workflow).toEqual(mockCreatedWorkflow);
      
      // Verify Prisma calls
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          name: requestBody.name,
          description: requestBody.description,
          config: { nodes: requestBody.nodes },
          status: requestBody.status,
          user_id: 'test-user-id',
          created_at: expect.any(Date),
          updated_at: expect.any(Date)
        }
      });
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Mock request with missing fields
      const requestBody = {
        // Missing name
        description: 'Test description',
        nodes: []
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/workflows',
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
      expect(responseData).toEqual({ error: 'Missing required fields' });
    });
    
    it('should return 400 if nodes structure is invalid', async () => {
      // Mock request with invalid nodes
      const requestBody = {
        name: 'New Workflow',
        description: 'Test description',
        nodes: 'not-an-array-or-object' // Invalid nodes structure
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/workflows',
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
      expect(responseData).toEqual({ error: 'Invalid nodes structure' });
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Mock request body
      const requestBody = {
        name: 'New Workflow',
        description: 'Test description',
        nodes: [{ id: 'node1', type: 'trigger' }]
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/workflows',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Mock unauthenticated user
      mockGetUser.mockResolvedValueOnce({
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
        name: 'New Workflow',
        description: 'Test description',
        nodes: [{ id: 'node1', type: 'trigger' }]
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/workflows',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Mock Prisma error
      mockCreate.mockRejectedValue(new Error('Database error'));
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);
      expect(responseData).toHaveProperty('error', 'Failed to create workflow');
      expect(responseData).toHaveProperty('details', 'Database error');
    });
  });
});
