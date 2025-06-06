import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandler } from '../error-handler';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

// Mock Supabase and Redis
vi.mock('@supabase/supabase-js');
vi.mock('@upstash/redis');

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let mockSupabase: any;
  let mockRedis: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockReturnThis(),
      data: null,
      error: null,
    };
    
    (createClient as any).mockReturnValue({
      from: mockSupabase.from,
      rpc: mockSupabase.rpc,
    });
    
    // Mock Redis client
    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      incr: vi.fn(),
      del: vi.fn(),
    };
    
    (Redis.prototype.get as any) = mockRedis.get;
    (Redis.prototype.set as any) = mockRedis.set;
    (Redis.prototype.incr as any) = mockRedis.incr;
    (Redis.prototype.del as any) = mockRedis.del;
    
    // Initialize ErrorHandler
    errorHandler = ErrorHandler.getInstance();
  });

  afterEach(() => {
    // Reset singleton instance
    (ErrorHandler as any).instance = null;
  });

  describe('logError', () => {
    it('should log an error to Supabase', async () => {
      const errorLog = {
        agentId: 'agent-123',
        userId: 'user-456',
        tool: 'gmail',
        action: 'send',
        errorCode: 'AUTHENTICATION_ERROR',
        errorMessage: 'Failed to authenticate',
        payload: { to: 'test@example.com' },
        timestamp: new Date().toISOString(),
        resolved: false,
      };
      
      mockSupabase.data = { id: 'error-123' };
      mockSupabase.error = null;
      
      const errorId = await errorHandler.logError(errorLog);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('error_logs');
      expect(mockSupabase.insert).toHaveBeenCalledWith(errorLog);
      expect(mockRedis.incr).toHaveBeenCalledWith(`error:count:${errorLog.agentId}:${errorLog.tool}`);
      expect(errorId).toBe('error-123');
    });
    
    it('should handle Supabase error when logging', async () => {
      const errorLog = {
        agentId: 'agent-123',
        userId: 'user-456',
        tool: 'gmail',
        action: 'send',
        errorCode: 'AUTHENTICATION_ERROR',
        errorMessage: 'Failed to authenticate',
        payload: { to: 'test@example.com' },
        timestamp: new Date().toISOString(),
        resolved: false,
      };
      
      mockSupabase.data = null;
      mockSupabase.error = { message: 'Database error' };
      
      await expect(errorHandler.logError(errorLog)).rejects.toThrow('Failed to log error: Database error');
    });
  });

  describe('getFallbackMessage', () => {
    it('should return agent-specific fallback message if available', async () => {
      // Set up Redis mock to return a cached message
      mockRedis.get.mockResolvedValueOnce('Agent-specific fallback message');
      
      const message = await errorHandler.getFallbackMessage('gmail', 'agent-123');
      
      expect(mockRedis.get).toHaveBeenCalledWith('fallback:gmail:agent-123');
      expect(message).toBe('Agent-specific fallback message');
    });
    
    it('should return generic fallback message if no agent-specific message', async () => {
      // No agent-specific message, but has generic message
      mockRedis.get.mockResolvedValueOnce(null);
      mockRedis.get.mockResolvedValueOnce('Generic fallback message');
      
      const message = await errorHandler.getFallbackMessage('gmail', 'agent-123');
      
      expect(mockRedis.get).toHaveBeenCalledWith('fallback:gmail:agent-123');
      expect(mockRedis.get).toHaveBeenCalledWith('fallback:gmail');
      expect(message).toBe('Generic fallback message');
    });
    
    it('should return default fallback message if no message found', async () => {
      // No messages in Redis
      mockRedis.get.mockResolvedValueOnce(null);
      mockRedis.get.mockResolvedValueOnce(null);
      
      const message = await errorHandler.getFallbackMessage('gmail', 'agent-123');
      
      expect(message).toBe('The service is currently unavailable. Please try again later.');
    });
  });

  describe('setFallbackMessage', () => {
    it('should set fallback message in Redis and Supabase', async () => {
      const tool = 'gmail';
      const message = 'Custom fallback message';
      const agentId = 'agent-123';
      const userId = 'user-456';
      
      mockSupabase.data = { id: 'fallback-123' };
      mockSupabase.error = null;
      
      await errorHandler.setFallbackMessage(tool, message, agentId, userId);
      
      expect(mockRedis.set).toHaveBeenCalledWith(`fallback:${tool}:${agentId}`, message);
      expect(mockSupabase.from).toHaveBeenCalledWith('fallback_messages');
    });
    
    it('should set generic fallback message when no agentId provided', async () => {
      const tool = 'gmail';
      const message = 'Generic fallback message';
      const userId = 'user-456';
      
      mockSupabase.data = { id: 'fallback-123' };
      mockSupabase.error = null;
      
      await errorHandler.setFallbackMessage(tool, message, undefined, userId);
      
      expect(mockRedis.set).toHaveBeenCalledWith(`fallback:${tool}`, message);
      expect(mockSupabase.from).toHaveBeenCalledWith('fallback_messages');
    });
  });

  describe('shouldDisableTool', () => {
    it('should return true if error count exceeds threshold', async () => {
      mockRedis.get.mockResolvedValueOnce('11'); // Above default threshold of 10
      
      const result = await errorHandler.shouldDisableTool('agent-123', 'gmail');
      
      expect(mockRedis.get).toHaveBeenCalledWith('error:count:agent-123:gmail');
      expect(result).toBe(true);
    });
    
    it('should return false if error count is below threshold', async () => {
      mockRedis.get.mockResolvedValueOnce('5'); // Below default threshold of 10
      
      const result = await errorHandler.shouldDisableTool('agent-123', 'gmail');
      
      expect(mockRedis.get).toHaveBeenCalledWith('error:count:agent-123:gmail');
      expect(result).toBe(false);
    });
    
    it('should return false if no error count found', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      
      const result = await errorHandler.shouldDisableTool('agent-123', 'gmail');
      
      expect(mockRedis.get).toHaveBeenCalledWith('error:count:agent-123:gmail');
      expect(result).toBe(false);
    });
  });

  describe('resolveError', () => {
    it('should mark an error as resolved', async () => {
      const errorId = 'error-123';
      
      mockSupabase.data = { id: errorId };
      mockSupabase.error = null;
      
      await errorHandler.resolveError(errorId);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('error_logs');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        resolved: true,
        resolvedAt: expect.any(String),
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', errorId);
    });
  });

  describe('bulkResolveErrors', () => {
    it('should resolve multiple errors', async () => {
      const errorIds = ['error-123', 'error-456'];
      
      mockSupabase.data = { count: 2 };
      mockSupabase.error = null;
      
      const count = await errorHandler.bulkResolveErrors(errorIds);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('error_logs');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        resolved: true,
        resolvedAt: expect.any(String),
      });
      expect(mockSupabase.in).toHaveBeenCalledWith('id', errorIds);
      expect(count).toBe(2);
    });
  });

  describe('getAgentErrors', () => {
    it('should get errors for an agent', async () => {
      const agentId = 'agent-123';
      const mockErrors = [
        { id: 'error-123', tool: 'gmail' },
        { id: 'error-456', tool: 'slack' },
      ];
      
      mockSupabase.data = mockErrors;
      mockSupabase.error = null;
      
      const errors = await errorHandler.getAgentErrors(agentId);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('error_logs');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('agentId', agentId);
      expect(mockSupabase.order).toHaveBeenCalledWith('timestamp', { ascending: false });
      expect(errors).toEqual(mockErrors);
    });
  });

  describe('getErrorStatsByTool', () => {
    it('should get error statistics by tool', async () => {
      const mockStats = {
        gmail: 5,
        slack: 3,
        notion: 1,
      };
      
      mockSupabase.data = mockStats;
      mockSupabase.error = null;
      
      const stats = await errorHandler.getErrorStatsByTool(7);
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_error_stats_by_tool', { days_param: 7 });
      expect(stats).toEqual(mockStats);
    });
  });

  describe('getErrorTrends', () => {
    it('should get error trends data', async () => {
      const mockTrends = [
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 3 },
      ];
      
      mockSupabase.data = mockTrends;
      mockSupabase.error = null;
      
      const trends = await errorHandler.getErrorTrends(30);
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_error_trends', { days_param: 30, tool_param: null });
      expect(trends).toEqual(mockTrends);
    });
    
    it('should get error trends for a specific tool', async () => {
      const mockTrends = [
        { date: '2023-01-01', count: 3 },
        { date: '2023-01-02', count: 1 },
      ];
      
      mockSupabase.data = mockTrends;
      mockSupabase.error = null;
      
      const trends = await errorHandler.getErrorTrends(30, 'gmail');
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_error_trends', { days_param: 30, tool_param: 'gmail' });
      expect(trends).toEqual(mockTrends);
    });
  });
});
