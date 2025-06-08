import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted to ensure mock functions are hoisted to the top
const mockGetSession = vi.hoisted(() => vi.fn());
const mockLogError = vi.hoisted(() => vi.fn());
const mockGetAgentErrors = vi.hoisted(() => vi.fn());
const mockResolveError = vi.hoisted(() => vi.fn());
const mockGetFallbackMessage = vi.hoisted(() => vi.fn());

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
    },
  })),
}));

// Mock ErrorHandler
vi.mock('@/lib/plugin-engine', () => ({
  ErrorHandler: {
    getInstance: () => ({
      logError: mockLogError,
      getAgentErrors: mockGetAgentErrors,
      resolveError: mockResolveError,
      getFallbackMessage: mockGetFallbackMessage,
    }),
  },
}));

// Set environment variables for testing
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test-url.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');

import { GET, POST, PATCH } from '../route';

describe('Error Logs API Routes', () => {
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
    mockLogError.mockResolvedValue('test-error-id');
    mockGetAgentErrors.mockResolvedValue([
      { id: 'error-1', tool: 'gmail', errorCode: 'AUTH_ERROR' },
      { id: 'error-2', tool: 'slack', errorCode: 'API_ERROR' },
    ]);
    mockResolveError.mockResolvedValue(undefined);
    mockGetFallbackMessage.mockReturnValue('Please try again later');
  });

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock authentication failure
      mockGetSession.mockResolvedValue({
        data: { session: null },
      });
      
      const request = new NextRequest('http://localhost/api/plugin-engine/errors?agentId=test-agent');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: 'Unauthorized' })
      );
    });

    it('should return 400 if agentId is missing', async () => {
      const request = new NextRequest('http://localhost/api/plugin-engine/errors');
      const response = await GET(request);
      
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: expect.stringContaining('agentId') })
      );
    });

    it('should return error logs for an agent', async () => {
      const request = new NextRequest('http://localhost/api/plugin-engine/errors?agentId=test-agent&limit=10');
      const response = await GET(request);
      
      expect(mockGetAgentErrors).toHaveBeenCalledWith('test-agent', 10);
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
      mockGetSession.mockResolvedValue({
        data: { session: null },
      });
      
      const request = new NextRequest(
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
      
      const response = await POST(request);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: 'Unauthorized' })
      );
    });

    it('should return 400 if required fields are missing', async () => {
      const request = new NextRequest(
        'http://localhost/api/plugin-engine/errors',
        {
          method: 'POST',
          body: JSON.stringify({
            agentId: 'test-agent',
            // Missing required fields
          }),
        }
      );
      
      const response = await POST(request);
      
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
      
      const request = new NextRequest(
        'http://localhost/api/plugin-engine/errors',
        {
          method: 'POST',
          body: JSON.stringify(errorData),
        }
      );
      
      const response = await POST(request);
      
      expect(mockLogError).toHaveBeenCalledWith(expect.objectContaining({
        ...errorData,
        userId: 'test-user-id',
        timestamp: expect.any(String),
        resolved: false,
      }));
      
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        success: true,
        errorId: 'test-error-id',
        fallbackMessage: 'Please try again later',
      });
    });
  });

  describe('PATCH', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock authentication failure
      mockGetSession.mockResolvedValue({
        data: { session: null },
      });
      
      const request = new NextRequest(
        'http://localhost/api/plugin-engine/errors',
        {
          method: 'PATCH',
          body: JSON.stringify({
            errorId: 'test-error-id',
          }),
        }
      );
      
      const response = await PATCH(request);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: 'Unauthorized' })
      );
    });

    it('should return 400 if errorId is missing', async () => {
      const request = new NextRequest(
        'http://localhost/api/plugin-engine/errors',
        {
          method: 'PATCH',
          body: JSON.stringify({}),
        }
      );
      
      const response = await PATCH(request);
      
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: expect.stringContaining('errorId') })
      );
    });

    it('should resolve an error and return success message', async () => {
      const request = new NextRequest(
        'http://localhost/api/plugin-engine/errors',
        {
          method: 'PATCH',
          body: JSON.stringify({
            errorId: 'test-error-id',
          }),
        }
      );
      
      const response = await PATCH(request);
      
      expect(mockResolveError).toHaveBeenCalledWith('test-error-id');
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        success: true,
      });
    });
  });
});
