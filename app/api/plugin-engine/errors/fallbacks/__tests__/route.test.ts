import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Create mock functions using vi.hoisted to ensure they're defined before mocks are hoisted
const mockGetSession = vi.hoisted(() => vi.fn());
const mockUpsert = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
const mockGetFallbackMessage = vi.hoisted(() => vi.fn());
const mockSetFallbackMessage = vi.hoisted(() => vi.fn());

// Setup mocks before importing any modules
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getSession: mockGetSession },
    from: mockFrom
  })
}));

vi.mock('@/lib/plugin-engine', () => ({
  ErrorHandler: {
    getInstance: () => ({
      getFallbackMessage: mockGetFallbackMessage,
      setFallbackMessage: mockSetFallbackMessage
    })
  }
}));

// Set environment variables
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');

// Import the route after mocking
import { GET, POST } from '../route';

describe('Fallback Messages API Routes', () => {
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } },
      error: null
    });
    
    mockGetFallbackMessage.mockReturnValue('Default fallback message');
    mockFrom.mockReturnValue({ upsert: mockUpsert });
    mockUpsert.mockReturnValue({ error: null });
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock authentication failure
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Not authenticated' }
      });
      
      mockRequest = new NextRequest('http://localhost/api/plugin-engine/errors/fallbacks?tool=gmail');
      
      const response = await GET(mockRequest);
      
      expect(mockGetSession).toHaveBeenCalled();
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
        expect.objectContaining({ error: 'Missing required query parameter: tool' })
      );
    });

    it('should return fallback message for a tool without agentId', async () => {
      mockRequest = new NextRequest('http://localhost/api/plugin-engine/errors/fallbacks?tool=gmail');
      
      const response = await GET(mockRequest);
      
      expect(mockGetFallbackMessage).toHaveBeenCalledWith('gmail', undefined);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        tool: 'gmail',
        agentId: null,
        message: 'Default fallback message',
      });
    });

    it('should return fallback message for a tool with agentId', async () => {
      mockRequest = new NextRequest('http://localhost/api/plugin-engine/errors/fallbacks?tool=gmail&agentId=test-agent');
      
      const response = await GET(mockRequest);
      
      expect(mockGetFallbackMessage).toHaveBeenCalledWith('gmail', 'test-agent');
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        tool: 'gmail',
        agentId: 'test-agent',
        message: 'Default fallback message',
      });
    });
  });

  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock authentication failure
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Not authenticated' }
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
      
      expect(mockGetSession).toHaveBeenCalled();
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
            // Missing required fields
          }),
        }
      );
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: 'Missing required fields: tool, message' })
      );
    });

    it('should set fallback message without agentId', async () => {
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
      
      expect(mockSetFallbackMessage).toHaveBeenCalledWith(
        'gmail',
        'Custom fallback message',
        undefined
      );
      expect(mockFrom).toHaveBeenCalledWith('fallback_messages');
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        success: true,
        tool: 'gmail',
        agentId: null,
        message: 'Custom fallback message'
      });
    });

    it('should set fallback message with agentId', async () => {
      mockRequest = new NextRequest(
        'http://localhost/api/plugin-engine/errors/fallbacks',
        {
          method: 'POST',
          body: JSON.stringify({
            tool: 'gmail',
            message: 'Custom fallback message',
            agentId: 'test-agent',
          }),
        }
      );
      
      const response = await POST(mockRequest);
      
      expect(mockSetFallbackMessage).toHaveBeenCalledWith(
        'gmail',
        'Custom fallback message',
        'test-agent'
      );
      expect(mockFrom).toHaveBeenCalledWith('fallback_messages');
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        success: true,
        tool: 'gmail',
        agentId: 'test-agent',
        message: 'Custom fallback message'
      });
    });
  });
});
