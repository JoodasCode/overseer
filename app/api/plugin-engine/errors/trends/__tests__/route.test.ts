import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GET } from '../route';
import { ErrorHandler } from '@/lib/plugin-engine/error-handler';

// Mock dependencies
vi.mock('@supabase/supabase-js');
vi.mock('@/lib/plugin-engine/error-handler');

describe('Error Trends API Route', () => {
  let mockRequest: NextRequest;
  let mockErrorHandler: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Supabase client
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
    });
    
    // Mock ErrorHandler
    mockErrorHandler = {
      getErrorTrends: vi.fn().mockResolvedValue([
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 3 },
      ]),
      getErrorStatsByTool: vi.fn().mockResolvedValue({
        gmail: 5,
        slack: 3,
        notion: 1,
      }),
    };
    
    (ErrorHandler.getInstance as any).mockReturnValue(mockErrorHandler);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock authentication failure
      (createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      });
      
      mockRequest = new NextRequest('http://localhost/api/plugin-engine/errors/trends');
      
      const response = await GET(mockRequest);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: 'Unauthorized' })
      );
    });

    it('should return error trends with default days', async () => {
      mockRequest = new NextRequest('http://localhost/api/plugin-engine/errors/trends');
      
      const response = await GET(mockRequest);
      
      expect(mockErrorHandler.getErrorTrends).toHaveBeenCalledWith(30, undefined);
      expect(mockErrorHandler.getErrorStatsByTool).toHaveBeenCalledWith(30);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        trends: [
          { date: '2023-01-01', count: 5 },
          { date: '2023-01-02', count: 3 },
        ],
        statsByTool: {
          gmail: 5,
          slack: 3,
          notion: 1,
        },
      });
    });

    it('should return error trends with specified days', async () => {
      mockRequest = new NextRequest('http://localhost/api/plugin-engine/errors/trends?days=7');
      
      const response = await GET(mockRequest);
      
      expect(mockErrorHandler.getErrorTrends).toHaveBeenCalledWith(7, undefined);
      expect(mockErrorHandler.getErrorStatsByTool).toHaveBeenCalledWith(7);
      expect(response.status).toBe(200);
    });

    it('should return error trends for a specific tool', async () => {
      mockRequest = new NextRequest('http://localhost/api/plugin-engine/errors/trends?tool=gmail');
      
      const response = await GET(mockRequest);
      
      expect(mockErrorHandler.getErrorTrends).toHaveBeenCalledWith(30, 'gmail');
      expect(mockErrorHandler.getErrorStatsByTool).toHaveBeenCalledWith(30);
      expect(response.status).toBe(200);
    });

    it('should handle invalid days parameter', async () => {
      mockRequest = new NextRequest('http://localhost/api/plugin-engine/errors/trends?days=invalid');
      
      const response = await GET(mockRequest);
      
      // Should default to 30 days
      expect(mockErrorHandler.getErrorTrends).toHaveBeenCalledWith(30, undefined);
      expect(response.status).toBe(200);
    });
  });
});
