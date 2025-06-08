/**
 * Notion Adapter Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to ensure mock functions are hoisted to the top
const mockRedisGet = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockRedisSet = vi.hoisted(() => vi.fn().mockResolvedValue('OK'));
const mockRedisIncr = vi.hoisted(() => vi.fn().mockResolvedValue(1));
const mockRedisExpire = vi.hoisted(() => vi.fn().mockResolvedValue(1));
const mockRedisDel = vi.hoisted(() => vi.fn().mockResolvedValue(1));

// Create hoisted mock functions for IntegrationManager
const mockGetIntegration = vi.hoisted(() => vi.fn());
const mockIsConnected = vi.hoisted(() => vi.fn());
const mockStoreIntegration = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockDisconnect = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockRemoveIntegration = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

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
    from: mockSupabaseFrom
  }))
}));

// Mock IntegrationManager
vi.mock('../integration-manager', () => ({
  IntegrationManager: {
    getInstance: () => ({
      getIntegration: mockGetIntegration,
      isConnected: mockIsConnected,
      storeIntegration: mockStoreIntegration,
      disconnect: mockDisconnect,
      removeIntegration: mockRemoveIntegration,
    }),
  },
}));

// Set environment variables for testing
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test-url.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');
vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test-redis-url');
vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');

import { NotionAdapter } from '../adapters/notion-adapter';
import { IntegrationManager } from '../integration-manager';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('NotionAdapter', () => {
  let notionAdapter: NotionAdapter;
  let mockIntegrationManager: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock responses
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    
    // Get mock integration manager
    mockIntegrationManager = IntegrationManager.getInstance();
    
    // Set up default mocks
    mockGetIntegration.mockResolvedValue({
      accessToken: 'test-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    
    mockIsConnected.mockResolvedValue({ connected: true });
    
    // Create adapter instance
    notionAdapter = new NotionAdapter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return correct metadata', () => {
    const metadata = notionAdapter.getMetadata();
    
    expect(metadata.id).toBe('notion');
    expect(metadata.name).toBe('Notion');
    expect(metadata.description).toContain('Notion');
    expect(metadata.scopes).toContain('read_content');
  });

  it('should handle connection', async () => {
    const result = await notionAdapter.connect('test-user');
    
    expect(result.connected).toBe(true);
    expect(result.expiresAt).toBeDefined();
  });

  it('should check connection status', async () => {
    // Test connected case
    mockIsConnected.mockResolvedValue({ connected: true });
    
    let result = await notionAdapter.isConnected('test-user');
    expect(result).toBe(true);
    
    // Test not connected case
    mockIsConnected.mockResolvedValue({ connected: false });
    
    result = await notionAdapter.isConnected('test-user');
    expect(result).toBe(false);
  });

  it('should create a page', async () => {
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'page-123', url: 'https://notion.so/page-123' }),
    });
    
    const result = await notionAdapter.send('test-agent', {
      action: 'create_page',
      title: 'Test Page',
      content: 'Test content',
      parent: 'database-123',
    });
    
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('page-123');
    expect(result.data.url).toBe('https://notion.so/page-123');
  });

  it('should update a page', async () => {
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'page-123', url: 'https://notion.so/page-123' }),
    });
    
    const result = await notionAdapter.send('test-agent', {
      action: 'update_page',
      pageId: 'page-123',
      properties: { Status: 'Done' },
      content: 'Updated content',
    });
    
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('page-123');
  });

  it('should search pages', async () => {
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        results: [
          { id: 'page-123', properties: { title: 'Test Page' } },
          { id: 'page-456', properties: { title: 'Another Page' } }
        ] 
      }),
    });
    
    const result = await notionAdapter.fetch('test-agent', {
      action: 'search',
      query: 'test',
    });
    
    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(2);
    expect(result.data.results[0].id).toBe('page-123');
  });

  it('should query a database', async () => {
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        results: [
          { id: 'row-123', properties: { Name: 'Test Item' } },
          { id: 'row-456', properties: { Name: 'Another Item' } }
        ] 
      }),
    });
    
    const result = await notionAdapter.fetch('test-agent', {
      action: 'query_database',
      databaseId: 'db-123',
      filter: { property: 'Status', status: { equals: 'Done' } },
    });
    
    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(2);
  });

  it('should handle API errors', async () => {
    // Test with missing required field to trigger an error
    const result = await notionAdapter.send('test-agent', {
      action: 'update_page',
      // Missing pageId to trigger validation error
      properties: { Status: 'Done' },
    });
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('Missing page ID');
    expect(result.error).toBeDefined();
    // Check error code if error exists
    if (result.error) {
      expect(result.error.code).toBe('MISSING_ID');
    }
  });

  it('should disconnect', async () => {
    await notionAdapter.disconnect('test-user');
    
    expect(mockDisconnect).toHaveBeenCalledWith(
      'test-user',
      'notion'
    );
  });
});
