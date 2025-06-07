import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Create mock functions using vi.hoisted to ensure they're defined before mocks are hoisted
const mockGetUser = vi.hoisted(() => vi.fn());
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());

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
import { DELETE } from '@/app/api/user/api-keys/[id]/route';

describe('API Key ID API', () => {
  const mockUserId = 'test-user-id';
  const mockKeyId = '123e4567-e89b-12d3-a456-426614174000';
  let mockRequest: NextRequest;
  let mockParams: { params: { id: string } };
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create mock request
    mockRequest = new NextRequest(`http://localhost:3000/api/user/api-keys/${mockKeyId}`);
    
    // Create mock params
    mockParams = { params: { id: mockKeyId } };
    
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('DELETE /api/user/api-keys/[id]', () => {
    it('should delete an API key', async () => {
      // Mock user with API keys
      const mockUser = {
        id: mockUserId,
        api_keys: ['osk_testkey1', 'osk_testkey2'],
        api_key_metadata: [
          {
            id: mockKeyId,
            name: 'Test Key 1',
            created_at: '2025-06-01T00:00:00Z',
            key_preview: 'key1',
            scopes: ['read', 'write']
          },
          {
            id: '223e4567-e89b-12d3-a456-426614174001',
            name: 'Test Key 2',
            created_at: '2025-06-02T00:00:00Z',
            key_preview: 'key2',
            scopes: ['*']
          }
        ]
      };
      
      mockFindUnique.mockResolvedValue(mockUser);
      mockUpdate.mockResolvedValue({});
      
      // Call the API handler
      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(200);
      expect(responseData).toHaveProperty('message', 'API key deleted successfully');
      
      // Verify Prisma calls
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: {
          api_keys: true,
          api_key_metadata: true
        }
      });
      
      // Check that update was called with correct data - key and metadata removed
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          // Only the second key should remain
          api_keys: ['osk_testkey2'],
          api_key_metadata: [
            {
              id: '223e4567-e89b-12d3-a456-426614174001',
              name: 'Test Key 2',
              created_at: '2025-06-02T00:00:00Z',
              key_preview: 'key2',
              scopes: ['*']
            }
          ]
        }
      });
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
      expect(responseData).toHaveProperty('error', 'Invalid API key ID format');
      
      // Note: In the actual implementation, findUnique might be called during authentication
      // before UUID validation, so we don't assert that it wasn't called
      expect(mockUpdate).not.toHaveBeenCalled();
    });
    
    it('should return 404 if user profile is not found', async () => {
      // Mock user not found
      mockFindUnique.mockResolvedValue(null);
      
      // Call the API handler
      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(404);
      expect(responseData).toHaveProperty('error', 'User profile not found');
      
      // Verify update was not called
      expect(mockUpdate).not.toHaveBeenCalled();
    });
    
    it('should return 404 if API key is not found', async () => {
      // Mock user with API keys but not the one we're looking for
      const mockUser = {
        id: mockUserId,
        api_keys: ['osk_testkey1'],
        api_key_metadata: [
          {
            id: '223e4567-e89b-12d3-a456-426614174001', // Different ID
            name: 'Test Key 2',
            created_at: '2025-06-02T00:00:00Z',
            key_preview: 'key2',
            scopes: ['*']
          }
        ]
      };
      
      mockFindUnique.mockResolvedValue(mockUser);
      
      // Call the API handler
      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(404);
      expect(responseData).toHaveProperty('error', 'API key not found');
      
      // Verify update was not called
      expect(mockUpdate).not.toHaveBeenCalled();
    });
    
    it('should handle case where key preview does not match any API key', async () => {
      // Mock user with API key metadata but no matching actual key
      const mockUser = {
        id: mockUserId,
        api_keys: ['osk_differentkey'], // No key ending with 'key1'
        api_key_metadata: [
          {
            id: mockKeyId,
            name: 'Test Key 1',
            created_at: '2025-06-01T00:00:00Z',
            key_preview: 'key1', // This doesn't match any key in api_keys
            scopes: ['read', 'write']
          }
        ]
      };
      
      mockFindUnique.mockResolvedValue(mockUser);
      mockUpdate.mockResolvedValue({});
      
      // Call the API handler
      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response!.json();
      
      // Verify response is still successful
      expect(response).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(200);
      
      // Verify update was called with metadata removed but keys unchanged
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          api_keys: ['osk_differentkey'], // Keys unchanged
          api_key_metadata: [] // Metadata removed
        }
      });
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
      expect(mockUpdate).not.toHaveBeenCalled();
    });
    
    it('should return 500 if database operation fails', async () => {
      // Mock user with API keys
      const mockUser = {
        id: mockUserId,
        api_keys: ['osk_testkey1'],
        api_key_metadata: [
          {
            id: mockKeyId,
            name: 'Test Key 1',
            key_preview: 'key1'
          }
        ]
      };
      
      mockFindUnique.mockResolvedValue(mockUser);
      
      // Mock database error during update
      mockUpdate.mockRejectedValue(new Error('Database error'));
      
      // Call the API handler
      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response!.json();
      
      // Verify response
      expect(response!).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(500);
      expect(responseData).toHaveProperty('error', 'Failed to delete API key');
      expect(responseData).toHaveProperty('details', 'Database error');
    });
  });
});
