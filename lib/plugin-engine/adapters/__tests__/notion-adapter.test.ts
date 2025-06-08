import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotionAdapter } from '../notion-adapter';

// Mock the dependencies to avoid database calls
vi.mock('../integration-manager', () => ({
  IntegrationManager: {
    getInstance: () => ({
      storeIntegration: vi.fn().mockResolvedValue(true),
      getIntegration: vi.fn().mockResolvedValue(null), // Not connected by default
      isConnected: vi.fn().mockResolvedValue({ connected: false })
    })
  }
}));

vi.mock('../error-handler', () => ({
  ErrorHandler: {
    getInstance: () => ({
      logError: vi.fn().mockResolvedValue(true),
      getFallbackMessage: vi.fn().mockReturnValue('Something went wrong with Notion')
    })
  }
}));

describe('NotionAdapter', () => {
  let adapter: NotionAdapter;

  beforeEach(() => {
    adapter = new NotionAdapter();
  });

  it('should return correct metadata', () => {
    const metadata = adapter.getMetadata();
    expect(metadata.name).toBe('Notion');
    expect(metadata.description).toBe('Create and manage content in Notion');
    expect(metadata.version).toBe('1.0.0');
    expect(metadata.scopes).toContain('read_content');
    expect(metadata.scopes).toContain('update_content');
    expect(metadata.scopes).toContain('insert_content');
  });

  it('should handle connection', async () => {
    const authStatus = await adapter.connect('test-user-id');
    expect(authStatus).toHaveProperty('connected');
    expect(typeof authStatus.connected).toBe('boolean');
  });

  it('should handle disconnection', async () => {
    await expect(adapter.disconnect('test-user-id')).resolves.not.toThrow();
  });

  it('should return error when no integration exists for send', async () => {
    const payload = {
      action: 'create_page',
      title: 'Test Page'
    };

    const result = await adapter.send('test-agent-id', payload);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Notion');
  });

  it('should return error when no integration exists for fetch', async () => {
    const query = {
      action: 'search',
      query: 'test query'
    };

    const result = await adapter.fetch('test-agent-id', query);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Notion');
  });
}); 