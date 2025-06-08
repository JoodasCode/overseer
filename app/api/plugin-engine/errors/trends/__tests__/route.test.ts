import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted to ensure mock functions are hoisted to the top
const mockGetSession = vi.hoisted(() => vi.fn());
const mockGetErrorTrends = vi.hoisted(() => vi.fn());
const mockGetMostFrequentErrorCodes = vi.hoisted(() => vi.fn());

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
    },
  })),
}));

// Mock ErrorHandler
vi.mock('@/lib/plugin-engine/error-handler', () => ({
  ErrorHandler: {
    getInstance: () => ({
      getErrorTrends: mockGetErrorTrends,
      getMostFrequentErrorCodes: mockGetMostFrequentErrorCodes,
    }),
  },
}));

// Set environment variables for testing
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test-url.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');

import { GET } from '../route';

describe('Error Trends API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default successful authentication
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user-id' },
        },
      },
    });
    
    // Set up default ErrorHandler responses
    mockGetErrorTrends.mockResolvedValue([
      { date: '2023-01-01', count: 5 },
      { date: '2023-01-02', count: 3 },
    ]);
    
    mockGetMostFrequentErrorCodes.mockResolvedValue([
      { errorCode: 'AUTH_ERROR', count: 5 },
      { errorCode: 'API_ERROR', count: 3 },
    ]);
  });

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock authentication failure
      mockGetSession.mockResolvedValue({
        data: { session: null },
      });
      
      const request = new NextRequest('http://localhost/api/plugin-engine/errors/trends');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: 'Unauthorized' })
      );
    });

    it('should return error trends with default days', async () => {
      const request = new NextRequest('http://localhost/api/plugin-engine/errors/trends');
      const response = await GET(request);
      
      expect(mockGetErrorTrends).toHaveBeenCalledWith(30, undefined);
      expect(mockGetMostFrequentErrorCodes).toHaveBeenCalledWith(5, 30);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        trends: [
          { date: '2023-01-01', count: 5 },
          { date: '2023-01-02', count: 3 },
        ],
        frequentErrors: [
          { errorCode: 'AUTH_ERROR', count: 5 },
          { errorCode: 'API_ERROR', count: 3 },
        ],
        period: expect.objectContaining({
          days: 30,
          tool: 'all',
        }),
      });
    });

    it('should return error trends with specified days', async () => {
      const request = new NextRequest('http://localhost/api/plugin-engine/errors/trends?days=7');
      const response = await GET(request);
      
      expect(mockGetErrorTrends).toHaveBeenCalledWith(7, undefined);
      expect(mockGetMostFrequentErrorCodes).toHaveBeenCalledWith(5, 7);
      expect(response.status).toBe(200);
    });

    it('should return error trends for a specific tool', async () => {
      const request = new NextRequest('http://localhost/api/plugin-engine/errors/trends?tool=gmail');
      const response = await GET(request);
      
      expect(mockGetErrorTrends).toHaveBeenCalledWith(30, 'gmail');
      expect(mockGetMostFrequentErrorCodes).toHaveBeenCalledWith(5, 30);
      expect(response.status).toBe(200);
    });

    it('should handle invalid days parameter', async () => {
      const request = new NextRequest('http://localhost/api/plugin-engine/errors/trends?days=invalid');
      const response = await GET(request);
      
      // Currently passes NaN when invalid input is provided
      expect(mockGetErrorTrends).toHaveBeenCalledWith(NaN, undefined);
      expect(response.status).toBe(500); // Will fail due to invalid date calculation
    });
  });
});
