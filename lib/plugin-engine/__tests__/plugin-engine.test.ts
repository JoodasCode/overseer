/**
 * Plugin Engine Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to ensure mock functions are hoisted to the top
const mockRedisGet = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockRedisSet = vi.hoisted(() => vi.fn().mockResolvedValue('OK'));
const mockRedisIncr = vi.hoisted(() => vi.fn().mockResolvedValue(1));
const mockRedisExpire = vi.hoisted(() => vi.fn().mockResolvedValue(1));
const mockRedisDel = vi.hoisted(() => vi.fn().mockResolvedValue(1));

// Create a chainable mock object for Supabase
const createSupabaseChain = () => {
  const chainObj: any = {};
  const methods = ['from', 'insert', 'update', 'select', 'eq', 'in', 'order', 'limit', 'single', 'rpc', 'gte', 'group', 'delete'];
  
  methods.forEach(method => {
    chainObj[method] = vi.fn().mockImplementation(() => chainObj);
  });
  
  return chainObj;
};

// Create hoisted versions of the mock functions
const mockSupabaseFrom = vi.hoisted(() => vi.fn().mockImplementation(() => createSupabaseChain()));
const mockSupabaseAuth = vi.hoisted(() => ({
  getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'mock-user-id' } }, error: null })
}));
const mockSupabaseRpc = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {}, error: null }));

// Mock modules with vi.mock
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => ({
    get: mockRedisGet,
    set: mockRedisSet,
    incr: mockRedisIncr,
    del: mockRedisDel,
    expire: mockRedisExpire
  }))
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockSupabaseFrom,
    auth: mockSupabaseAuth,
    rpc: mockSupabaseRpc
  }))
}));

// Set environment variables for testing
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test-url.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');
vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test-redis-url');
vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');

import { PluginEngine } from '../plugin-engine';
import { ErrorHandler } from '../error-handler';
import { TaskIntent, PluginAdapter, PluginResult, AuthStatus } from '../types';

// Mock ErrorHandler
vi.mock('../error-handler', () => ({
  ErrorHandler: {
    getInstance: vi.fn(() => ({
      logError: vi.fn(async () => 'mock-error-id'),
      getFallbackMessage: vi.fn(() => 'Mock fallback message'),
      shouldDisableTool: vi.fn(async () => false),
      resolveError: vi.fn(async () => {}),
      getAgentErrors: vi.fn(async () => []),
      getErrorStatsByTool: vi.fn(async () => ({})),
      getErrorTrends: vi.fn(async () => []),
      bulkResolveErrors: vi.fn(async () => 0),
      setFallbackMessage: vi.fn(async () => {}),
    })),
  },
}));

// Mock adapter implementation
class MockAdapter implements PluginAdapter {
  async connect(userId: string): Promise<AuthStatus> {
    return { connected: true, expiresAt: new Date(Date.now() + 3600000).toISOString() };
  }

  async isConnected(userId: string): Promise<boolean> {
    return true;
  }

  async send(agentId: string, payload: any): Promise<PluginResult> {
    return {
      success: true,
      message: 'Mock send successful',
      data: { mockData: 'test' },
    };
  }

  async fetch(agentId: string, query?: any): Promise<PluginResult> {
    return {
      success: true,
      message: 'Mock fetch successful',
      data: { mockResults: ['item1', 'item2'] },
    };
  }

  async disconnect(userId: string): Promise<void> {
    return;
  }

  getMetadata() {
    return {
      id: 'mock',
      name: 'Mock Adapter',
      description: 'A mock adapter for testing',
      version: '1.0.0',
      author: 'Test Author',
      scopes: ['test:scope'],
    };
  }
}

describe('PluginEngine', () => {
  let pluginEngine: PluginEngine;
  let mockAdapter: MockAdapter;
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create a fresh instance for each test
    pluginEngine = PluginEngine.getInstance();
    mockAdapter = new MockAdapter();
    errorHandler = ErrorHandler.getInstance();
    
    // Register the mock adapter
    pluginEngine.registerAdapter('mock', mockAdapter);
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();
  });

  it('should be a singleton', () => {
    const instance1 = PluginEngine.getInstance();
    const instance2 = PluginEngine.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should register and retrieve adapters', () => {
    expect(pluginEngine.getAdapter('mock')).toBe(mockAdapter);
    expect(pluginEngine.getAdapter('nonexistent')).toBeUndefined();
  });

  it('should list available adapters', () => {
    const adapters = pluginEngine.listAdapters();
    expect(adapters).toContain('mock');
    expect(adapters.length).toBe(1);
  });

  it('should process an immediate task intent', async () => {
    const taskIntent: TaskIntent = {
      agentId: 'test-agent',
      intent: 'test_intent',
      tool: 'mock',
      context: { test: 'data' },
      userId: 'test-user',
    };

    const spy = vi.spyOn(mockAdapter, 'send');
    
    const result = await pluginEngine.processIntent(taskIntent);
    
    expect(spy).toHaveBeenCalledWith('test-agent', { test: 'data' });
    expect(result.success).toBe(true);
    expect(result.message).toBe('Mock send successful');
  });

  it('should handle fetch intents', async () => {
    const taskIntent: TaskIntent = {
      agentId: 'test-agent',
      intent: 'fetch_data',
      tool: 'mock',
      context: { query: 'test' },
      userId: 'test-user',
    };

    const spy = vi.spyOn(mockAdapter, 'fetch');
    
    const result = await pluginEngine.processIntent(taskIntent);
    
    expect(spy).toHaveBeenCalledWith('test-agent', { query: 'test' });
    expect(result.success).toBe(true);
    expect(result.message).toBe('Mock fetch successful');
  });

  it('should schedule a future task', async () => {
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    
    const taskIntent: TaskIntent = {
      agentId: 'test-agent',
      intent: 'test_intent',
      tool: 'mock',
      context: { test: 'scheduled' },
      userId: 'test-user',
      scheduledTime: futureDate,
    };

    const result = await pluginEngine.processIntent(taskIntent);
    
    // Should return a success message about scheduling
    expect(result.success).toBe(true);
    expect(result.message).toContain('scheduled');
  });

  it('should handle errors when adapter is not found', async () => {
    const taskIntent: TaskIntent = {
      agentId: 'test-agent',
      intent: 'test_intent',
      tool: 'nonexistent',
      context: { test: 'data' },
      userId: 'test-user',
    };

    const logErrorSpy = vi.spyOn(errorHandler, 'logError');
    const getFallbackSpy = vi.spyOn(errorHandler, 'getFallbackMessage');

    await expect(pluginEngine.processIntent(taskIntent)).rejects.toThrow('Adapter not found');
    
    expect(logErrorSpy).toHaveBeenCalledWith(expect.objectContaining({
      agentId: 'test-agent',
      userId: 'test-user',
      tool: 'nonexistent',
      action: 'test_intent',
      errorCode: 'ADAPTER_NOT_FOUND',
      errorMessage: expect.stringContaining('Adapter not found')
    }));
  });

  it('should handle errors when user is not connected', async () => {
    // Override the isConnected method to return false
    vi.spyOn(mockAdapter, 'isConnected').mockResolvedValueOnce(false);
    
    const taskIntent: TaskIntent = {
      agentId: 'test-agent',
      intent: 'test_intent',
      tool: 'mock',
      context: { test: 'data' },
      userId: 'test-user',
    };

    const logErrorSpy = vi.spyOn(errorHandler, 'logError');
    const getFallbackSpy = vi.spyOn(errorHandler, 'getFallbackMessage');

    await expect(pluginEngine.processIntent(taskIntent)).rejects.toThrow('not connected');
    
    expect(logErrorSpy).toHaveBeenCalledWith(expect.objectContaining({
      agentId: 'test-agent',
      userId: 'test-user',
      tool: 'mock',
      action: 'test_intent',
      errorCode: 'USER_NOT_CONNECTED',
      errorMessage: expect.stringContaining('not connected')
    }));
  });

  it('should normalize context for different intents', async () => {
    // Test for send intent
    const sendIntent: TaskIntent = {
      agentId: 'test-agent',
      intent: 'send_message',
      tool: 'mock',
      context: { message: 'Hello' },
      userId: 'test-user',
    };

    const sendSpy = vi.spyOn(mockAdapter, 'send');
    await pluginEngine.processIntent(sendIntent);
    
    expect(sendSpy).toHaveBeenCalledWith('test-agent', { message: 'Hello' });

    // Test for fetch intent
    const fetchIntent: TaskIntent = {
      agentId: 'test-agent',
      intent: 'fetch_data',
      tool: 'mock',
      context: { query: 'test' },
      userId: 'test-user',
    };

    const fetchSpy = vi.spyOn(mockAdapter, 'fetch');
    await pluginEngine.processIntent(fetchIntent);
    
    expect(fetchSpy).toHaveBeenCalledWith('test-agent', { query: 'test' });
  });

  it('should check if tool should be disabled due to errors', async () => {
    const shouldDisableSpy = vi.spyOn(errorHandler, 'shouldDisableTool');
    shouldDisableSpy.mockResolvedValueOnce(true); // Tool should be disabled
    
    const taskIntent: TaskIntent = {
      agentId: 'test-agent',
      intent: 'test_intent',
      tool: 'mock',
      context: { test: 'data' },
      userId: 'test-user',
    };

    const logErrorSpy = vi.spyOn(errorHandler, 'logError');
    const getFallbackSpy = vi.spyOn(errorHandler, 'getFallbackMessage');
    
    await expect(pluginEngine.processIntent(taskIntent)).rejects.toThrow('disabled due to excessive errors');
    
    expect(shouldDisableSpy).toHaveBeenCalledWith('test-agent', 'mock');
    expect(logErrorSpy).toHaveBeenCalledWith(expect.objectContaining({
      agentId: 'test-agent',
      userId: 'test-user',
      tool: 'mock',
      action: 'test_intent',
      errorCode: 'TOOL_DISABLED',
      errorMessage: expect.stringContaining('disabled due to excessive errors')
    }));
  });

  it('should handle adapter send errors and return fallback message', async () => {
    // Make the adapter's send method throw an error
    const error = new Error('Send failed');
    vi.spyOn(mockAdapter, 'send').mockRejectedValueOnce(error);
    
    const taskIntent: TaskIntent = {
      agentId: 'test-agent',
      intent: 'test_intent',
      tool: 'mock',
      context: { test: 'data' },
      userId: 'test-user',
    };

    const logErrorSpy = vi.spyOn(errorHandler, 'logError');
    const getFallbackSpy = vi.spyOn(errorHandler, 'getFallbackMessage');
    
    const result = await pluginEngine.processIntent(taskIntent);
    
    expect(logErrorSpy).toHaveBeenCalledWith(expect.objectContaining({
      agentId: 'test-agent',
      userId: 'test-user',
      tool: 'mock',
      action: 'test_intent',
      errorCode: 'EXECUTION_ERROR',
      errorMessage: 'Send failed'
    }));
    
    expect(getFallbackSpy).toHaveBeenCalledWith('mock', 'test-agent');
    expect(result).toEqual({
      success: false,
      message: 'Mock fallback message',
      error: 'Send failed'
    });
  });

  it('should handle adapter fetch errors and return fallback message', async () => {
    // Make the adapter's fetch method throw an error
    const error = new Error('Fetch failed');
    vi.spyOn(mockAdapter, 'fetch').mockRejectedValueOnce(error);
    
    const taskIntent: TaskIntent = {
      agentId: 'test-agent',
      intent: 'fetch_data',
      tool: 'mock',
      context: { query: 'test' },
      userId: 'test-user',
    };

    const logErrorSpy = vi.spyOn(errorHandler, 'logError');
    const getFallbackSpy = vi.spyOn(errorHandler, 'getFallbackMessage');
    
    const result = await pluginEngine.processIntent(taskIntent);
    
    expect(logErrorSpy).toHaveBeenCalledWith(expect.objectContaining({
      agentId: 'test-agent',
      userId: 'test-user',
      tool: 'mock',
      action: 'fetch_data',
      errorCode: 'EXECUTION_ERROR',
      errorMessage: 'Fetch failed'
    }));
    
    expect(getFallbackSpy).toHaveBeenCalledWith('mock', 'test-agent');
    expect(result).toEqual({
      success: false,
      message: 'Mock fallback message',
      error: 'Fetch failed'
    });
  });
});
