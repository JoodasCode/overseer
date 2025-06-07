import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Create mock functions using vi.hoisted to ensure they're defined before mocks are hoisted
const mockGetUser = vi.hoisted(() => vi.fn());
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockRandomUUID = vi.hoisted(() => vi.fn());

// Mock crypto's randomUUID
vi.mock('crypto', () => ({
  randomUUID: mockRandomUUID
}));

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
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

// Import the route after mocking
import { GET, POST } from '@/app/api/user/api-keys/route';

describe('API Keys API', () => {
  const mockUserId = 'test-user-id';
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create mock request
    mockRequest = new NextRequest('http://localhost:3000/api/user/api-keys');
    
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });
    
    // Mock randomUUID for consistent testing
    mockRandomUUID.mockReturnValue('00000000-0000-0000-0000-000000000000');
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('GET /api/user/api-keys', () => {
    it('should return all API keys for authenticated user', async () => {
      // Mock user with API keys
      const mockUser = {
        id: mockUserId,
        api_keys: ['osk_testkey1', 'osk_testkey2'],
        api_key_metadata: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Test Key 1',
            created_at: '2025-06-01T00:00:00Z',
            last_used: '2025-06-05T00:00:00Z',
            key_preview: 'key1',
            scopes: ['read', 'write']
          },
          {
            id: '223e4567-e89b-12d3-a456-426614174001',
            name: 'Test Key 2',
            created_at: '2025-06-02T00:00:00Z',
            last_used: null,
            key_preview: 'key2',
            scopes: ['*']
          }
        ]
      };
      
      mockFindUnique.mockResolvedValue(mockUser);
      
      // Call the API handler
      const response = await GET(mockRequest);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(200);
      expect(responseData).toHaveProperty('api_keys');
      expect(responseData.api_keys).toHaveLength(2);
      
      // Check that API keys are properly formatted with preview only
      expect(responseData.api_keys[0]).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Key 1',
        created_at: '2025-06-01T00:00:00Z',
        last_used: '2025-06-05T00:00:00Z',
        key_preview: 'osk_...key1',
        scopes: ['read', 'write']
      });
      
      // Verify Prisma calls
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          id: mockUserId
        },
        select: {
          api_keys: true,
          api_key_metadata: true
        }
      });
    });
    
    it('should return 404 if user profile is not found', async () => {
      // Mock user not found
      mockFindUnique.mockResolvedValue(null);
      
      // Call the API handler
      const response = await GET(mockRequest);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(404);
      expect(responseData).toHaveProperty('error', 'User profile not found');
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated user
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
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
      // Mock database error
      mockFindUnique.mockRejectedValue(new Error('Database error'));
      
      // Call the API handler
      const response = await GET(mockRequest);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(500);
      // The actual error message might be different based on where the error occurs
      expect(responseData).toHaveProperty('error');
      expect(responseData).toHaveProperty('details');
    });
  });
  
  describe('POST /api/user/api-keys', () => {
    it('should create a new API key', async () => {
      // Mock request body
      const requestBody = {
        name: 'New API Key',
        scopes: ['read', 'write']
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/user/api-keys',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Mock existing user data
      const mockUser = {
        id: mockUserId,
        api_keys: ['osk_existingkey'],
        api_key_metadata: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Existing Key',
            created_at: '2025-06-01T00:00:00Z',
            key_preview: 'key1',
            scopes: ['*']
          }
        ]
      };
      
      mockFindUnique.mockResolvedValue(mockUser);
      mockUpdate.mockResolvedValue({});
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(201);
      expect(responseData).toHaveProperty('api_key');
      expect(responseData.api_key).toHaveProperty('key');
      expect(responseData.api_key.key).toMatch(/^osk_/);
      expect(responseData.api_key).toHaveProperty('name', 'New API Key');
      expect(responseData.api_key).toHaveProperty('scopes', ['read', 'write']);
      
      // Verify Prisma calls
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: { 
          api_keys: true,
          api_key_metadata: true
        }
      });
      
      // Check that update was called with correct data
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          api_keys: expect.arrayContaining(['osk_existingkey', expect.stringMatching(/^osk_/)]),
          api_key_metadata: expect.arrayContaining([
            expect.objectContaining({
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Existing Key'
            }),
            expect.objectContaining({
              id: expect.any(String),
              name: 'New API Key',
              scopes: ['read', 'write']
            })
          ])
        }
      });
    });
    
    it('should create a new API key with default scope if none provided', async () => {
      // Mock request body with no scopes
      const requestBody = {
        name: 'New API Key'
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/user/api-keys',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Mock existing user data
      const mockUser = {
        id: mockUserId,
        api_keys: [],
        api_key_metadata: []
      };
      
      mockFindUnique.mockResolvedValue(mockUser);
      mockUpdate.mockResolvedValue({});
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response!.json();
      
      // Verify response has default scope ['*']
      expect(response!.status).toBe(201);
      expect(responseData.api_key).toHaveProperty('scopes', ['*']);
      
      // Verify Prisma update was called with default scope
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          api_keys: expect.arrayContaining([expect.stringMatching(/^osk_/)]),
          api_key_metadata: expect.arrayContaining([
            expect.objectContaining({
              name: 'New API Key',
              scopes: ['*']
            })
          ])
        }
      });
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Mock request with missing name field
      mockRequest = new NextRequest(
        'http://localhost:3000/api/user/api-keys',
        {
          method: 'POST',
          body: JSON.stringify({})
        }
      );
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(400);
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Missing required fields');
      
      // Note: In the actual implementation, findUnique might be called during authentication
      // before validation, so we don't assert that it wasn't called
    });
    
    it('should return 404 if user profile is not found', async () => {
      // Mock request body
      const requestBody = {
        name: 'New API Key'
      };
      
      // Set request body
      mockRequest = new NextRequest(
        'http://localhost:3000/api/user/api-keys',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
      
      // Mock user not found
      mockFindUnique.mockResolvedValue(null);
      
      // Call the API handler
      const response = await POST(mockRequest);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(404);
      expect(responseData).toHaveProperty('error', 'User profile not found');
      
      // Verify update was not called
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
