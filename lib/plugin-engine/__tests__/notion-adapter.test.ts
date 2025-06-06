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

// Set environment variables for testing
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test-url.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');
vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test-redis-url');
vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');

import { NotionAdapter } from '../adapters/notion-adapter';
import { IntegrationManager } from '../integration-manager';

// Mock dependencies
vi.mock('../integration-manager', () => ({
  IntegrationManager: {
    getInstance: vi.fn(() => ({
      getIntegration: vi.fn(),
      storeIntegration: vi.fn(),
      removeIntegration: vi.fn(),
      refreshToken: vi.fn(),
    })),
  },
}));

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
    // Mock successful integration retrieval
    mockIntegrationManager.getIntegration.mockResolvedValue({
      accessToken: 'test-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    
    const result = await notionAdapter.connect('test-user');
    
    expect(result.connected).toBe(true);
    expect(result.expiresAt).toBeDefined();
  });

  it('should check connection status', async () => {
    // Test connected case
    mockIntegrationManager.getIntegration.mockResolvedValue({
      accessToken: 'test-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    
    let result = await notionAdapter.isConnected('test-user');
    expect(result).toBe(true);
    
    // Test not connected case
    mockIntegrationManager.getIntegration.mockResolvedValue(null);
    
    result = await notionAdapter.isConnected('test-user');
    expect(result).toBe(false);
  });

  it('should create a page', async () => {
    // Mock successful integration retrieval
    mockIntegrationManager.getIntegration.mockResolvedValue({
      accessToken: 'test-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    
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
    
    // Verify API call
    expect(global.fetch).toHaveBeenCalled();
    const fetchCall = (global.fetch as any).mock.calls[0];
    expect(fetchCall[0]).toContain('notion.so/api/v1/pages');
    expect(fetchCall[1].method).toBe('POST');
    expect(fetchCall[1].headers.Authorization).toContain('test-token');
  });

  it('should update a page', async () => {
    // Mock successful integration retrieval
    mockIntegrationManager.getIntegration.mockResolvedValue({
      accessToken: 'test-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    
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
    
    // Verify API call
    expect(global.fetch).toHaveBeenCalled();
    const fetchCall = (global.fetch as any).mock.calls[0];
    expect(fetchCall[0]).toContain('notion.so/api/v1/pages/page-123');
    expect(fetchCall[1].method).toBe('PATCH');
  });

  it('should search pages', async () => {
    // Mock successful integration retrieval
    mockIntegrationManager.getIntegration.mockResolvedValue({
      accessToken: 'test-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    
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
      action: 'search_pages',
      query: 'test',
    });
    
    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(2);
    expect(result.data.results[0].id).toBe('page-123');
    
    // Verify API call
    expect(global.fetch).toHaveBeenCalled();
    const fetchCall = (global.fetch as any).mock.calls[0];
    expect(fetchCall[0]).toContain('notion.so/api/v1/search');
    expect(fetchCall[1].method).toBe('POST');
  });

  it('should query a database', async () => {
    // Mock successful integration retrieval
    mockIntegrationManager.getIntegration.mockResolvedValue({
      accessToken: 'test-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    
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
    
    // Verify API call
    expect(global.fetch).toHaveBeenCalled();
    const fetchCall = (global.fetch as any).mock.calls[0];
    expect(fetchCall[0]).toContain('notion.so/api/v1/databases/db-123/query');
    expect(fetchCall[1].method).toBe('POST');
    expect(JSON.parse(fetchCall[1].body)).toHaveProperty('filter');
  });

  it('should handle API errors', async () => {
    // Mock successful integration retrieval
    mockIntegrationManager.getIntegration.mockResolvedValue({
      accessToken: 'test-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    
    // Mock API error
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Page not found', code: 'not_found' }),
    });
    
    const result = await notionAdapter.send('test-agent', {
      action: 'update_page',
      pageId: 'nonexistent',
      properties: { Status: 'Done' },
    });
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('failed');
    expect(result.error).toBeDefined();
    // Check error code if error exists
    if (result.error) {
      expect(result.error.code).toBe('not_found');
    }
  });

  it('should disconnect', async () => {
    await notionAdapter.disconnect('test-user');
    
    expect(mockIntegrationManager.removeIntegration).toHaveBeenCalledWith(
      'test-user',
      'notion'
    );
  });
});
