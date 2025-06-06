import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GET, POST } from '../route';
import { ErrorHandler } from '@/lib/plugin-engine/error-handler';

// Mock dependencies
vi.mock('@supabase/supabase-js');
vi.mock('@/lib/plugin-engine/error-handler');

describe('Fallback Messages API Routes', () => {
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
      getFallbackMessage: vi.fn().mockResolvedValue('Default fallback message'),
      setFallbackMessage: vi.fn().mockResolvedValue(undefined),
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
      
      mockRequest = new NextRequest('http://localhost/api/plugin-engine/errors/fallbacks?tool=gmail');
      
      const response = await GET(mockRequest);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: 'Unauthorized' })
      );
    });

    it('should return 400 if tool is missing', async () => {
      mockRequest = new NextRequest('http://localhost/api/plugin-engine/errors/fallbacks');
      
      const response = await GET(mockRequest);
      
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: 'Missing required parameter: tool' })
      );
    });

    it('should return fallback message for a tool without agentId', async () => {
      mockRequest = new NextRequest('http://localhost/api/plugin-engine/errors/fallbacks?tool=gmail');
      
      const response = await GET(mockRequest);
      
      expect(mockErrorHandler.getFallbackMessage).toHaveBeenCalledWith('gmail', undefined);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        message: 'Default fallback message',
      });
    });

    it('should return fallback message for a tool with agentId', async () => {
      mockRequest = new NextRequest('http://localhost/api/plugin-engine/errors/fallbacks?tool=gmail&agentId=test-agent');
      
      const response = await GET(mockRequest);
      
      expect(mockErrorHandler.getFallbackMessage).toHaveBeenCalledWith('gmail', 'test-agent');
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        message: 'Default fallback message',
      });
    });
  });

  describe('POST', () => {
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
      
      mockRequest = new NextRequest(
        'http://localhost/api/plugin-engine/errors/fallbacks',
        {
          method: 'POST',
          body: JSON.stringify({
            tool: 'gmail',
            message: 'Custom fallback message',
          }),
        }
      );
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: 'Unauthorized' })
      );
    });

    it('should return 400 if required fields are missing', async () => {
      mockRequest = new NextRequest(
        'http://localhost/api/plugin-engine/errors/fallbacks',
        {
          method: 'POST',
          body: JSON.stringify({
            tool: 'gmail',
            // Missing message field
          }),
        }
      );
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: expect.stringContaining('Missing required') })
      );
    });

    it('should set fallback message without agentId', async () => {
      const fallbackData = {
        tool: 'gmail',
        message: 'Custom fallback message',
      };
      
      mockRequest = new NextRequest(
        'http://localhost/api/plugin-engine/errors/fallbacks',
        {
          method: 'POST',
          body: JSON.stringify(fallbackData),
        }
      );
      
      const response = await POST(mockRequest);
      
      expect(mockErrorHandler.setFallbackMessage).toHaveBeenCalledWith(
        'gmail',
        'Custom fallback message',
        undefined,
        'test-user-id'
      );
      
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        message: 'Fallback message set successfully',
      });
    });

    it('should set fallback message with agentId', async () => {
      const fallbackData = {
        tool: 'gmail',
        message: 'Custom fallback message',
        agentId: 'test-agent',
      };
      
      mockRequest = new NextRequest(
        'http://localhost/api/plugin-engine/errors/fallbacks',
        {
          method: 'POST',
          body: JSON.stringify(fallbackData),
        }
      );
      
      const response = await POST(mockRequest);
      
      expect(mockErrorHandler.setFallbackMessage).toHaveBeenCalledWith(
        'gmail',
        'Custom fallback message',
        'test-agent',
        'test-user-id'
      );
      
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        message: 'Fallback message set successfully',
      });
    });
  });
});
