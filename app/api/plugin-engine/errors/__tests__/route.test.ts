import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GET, POST, PATCH } from '../route';
import { ErrorHandler } from '@/lib/plugin-engine/error-handler';

// Mock dependencies
vi.mock('@supabase/supabase-js');
vi.mock('@/lib/plugin-engine/error-handler');

describe('Error Logs API Routes', () => {
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
      logError: vi.fn().mockResolvedValue('test-error-id'),
      getAgentErrors: vi.fn().mockResolvedValue([
        { id: 'error-1', tool: 'gmail', errorCode: 'AUTH_ERROR' },
        { id: 'error-2', tool: 'slack', errorCode: 'API_ERROR' },
      ]),
      resolveError: vi.fn().mockResolvedValue(undefined),
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
      
      mockRequest = new NextRequest('http://localhost/api/plugin-engine/errors?agentId=test-agent');
      
      const response = await GET(mockRequest);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: 'Unauthorized' })
      );
    });

    it('should return 400 if agentId is missing', async () => {
      mockRequest = new NextRequest('http://localhost/api/plugin-engine/errors');
      
      const response = await GET(mockRequest);
      
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: 'Missing required parameter: agentId' })
      );
    });

    it('should return error logs for an agent', async () => {
      mockRequest = new NextRequest('http://localhost/api/plugin-engine/errors?agentId=test-agent&limit=10');
      
      const response = await GET(mockRequest);
      
      expect(mockErrorHandler.getAgentErrors).toHaveBeenCalledWith('test-agent', 10);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        errors: [
          { id: 'error-1', tool: 'gmail', errorCode: 'AUTH_ERROR' },
          { id: 'error-2', tool: 'slack', errorCode: 'API_ERROR' },
        ],
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
        'http://localhost/api/plugin-engine/errors',
        {
          method: 'POST',
          body: JSON.stringify({
            agentId: 'test-agent',
            tool: 'gmail',
            action: 'send',
            errorCode: 'AUTH_ERROR',
            errorMessage: 'Authentication failed',
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
        'http://localhost/api/plugin-engine/errors',
        {
          method: 'POST',
          body: JSON.stringify({
            agentId: 'test-agent',
            // Missing required fields
          }),
        }
      );
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: expect.stringContaining('Missing required') })
      );
    });

    it('should log an error and return the error ID', async () => {
      const errorData = {
        agentId: 'test-agent',
        tool: 'gmail',
        action: 'send',
        errorCode: 'AUTH_ERROR',
        errorMessage: 'Authentication failed',
        payload: { to: 'test@example.com' },
      };
      
      mockRequest = new NextRequest(
        'http://localhost/api/plugin-engine/errors',
        {
          method: 'POST',
          body: JSON.stringify(errorData),
        }
      );
      
      const response = await POST(mockRequest);
      
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(expect.objectContaining({
        ...errorData,
        userId: 'test-user-id',
        timestamp: expect.any(String),
        resolved: false,
      }));
      
      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({
        errorId: 'test-error-id',
        message: 'Error logged successfully',
      });
    });
  });

  describe('PATCH', () => {
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
        'http://localhost/api/plugin-engine/errors',
        {
          method: 'PATCH',
          body: JSON.stringify({
            errorId: 'test-error-id',
          }),
        }
      );
      
      const response = await PATCH(mockRequest);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: 'Unauthorized' })
      );
    });

    it('should return 400 if errorId is missing', async () => {
      mockRequest = new NextRequest(
        'http://localhost/api/plugin-engine/errors',
        {
          method: 'PATCH',
          body: JSON.stringify({}),
        }
      );
      
      const response = await PATCH(mockRequest);
      
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: 'Missing required parameter: errorId' })
      );
    });

    it('should resolve an error and return success message', async () => {
      mockRequest = new NextRequest(
        'http://localhost/api/plugin-engine/errors',
        {
          method: 'PATCH',
          body: JSON.stringify({
            errorId: 'test-error-id',
          }),
        }
      );
      
      const response = await PATCH(mockRequest);
      
      expect(mockErrorHandler.resolveError).toHaveBeenCalledWith('test-error-id');
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        message: 'Error resolved successfully',
      });
    });
  });
});
