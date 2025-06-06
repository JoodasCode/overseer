/**
 * Context Mapper Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContextMapper } from '../context-mapper';

// Mock dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => ({ data: { externalId: 'external-123', contextKey: 'project-123' }, error: null })),
              single: vi.fn(() => ({ data: { id: 'mapping-123', agentId: 'agent-123', tool: 'notion', contextKey: 'project-123', externalId: 'external-123' }, error: null })),
              order: vi.fn(() => ({ data: [{ id: 'mapping-123', contextKey: 'project-123', externalId: 'external-123' }], error: null })),
            })),
            maybeSingle: vi.fn(() => ({ data: { externalId: 'external-123', contextKey: 'project-123' }, error: null })),
            single: vi.fn(() => ({ data: { id: 'mapping-123', agentId: 'agent-123', tool: 'notion', contextKey: 'project-123', externalId: 'external-123' }, error: null })),
            order: vi.fn(() => ({ data: [{ id: 'mapping-123', contextKey: 'project-123', externalId: 'external-123' }], error: null })),
          })),
          single: vi.fn(() => ({ data: { id: 'mapping-123', agentId: 'agent-123', tool: 'notion', contextKey: 'project-123', externalId: 'external-123' }, error: null })),
          maybeSingle: vi.fn(() => ({ data: { externalId: 'external-123', contextKey: 'project-123' }, error: null })),
        })),
        single: vi.fn(() => ({ data: { id: 'mapping-123', agentId: 'agent-123', tool: 'notion', contextKey: 'project-123', externalId: 'external-123' }, error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: 'mapping-123' }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ data: null, error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ data: null, error: null })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({ data: [{ id: 'mapping-123' }, { id: 'mapping-456' }], error: null })),
      })),
    })),
  })),
}));

vi.mock('@upstash/redis', () => {
  const mockRedisInstance = {
    get: vi.fn(async (key: string) => {
      if (key.includes('context_map:agent-123:notion:project-123')) {
        return 'external-123';
      }
      if (key.includes('context_map_rev:agent-123:notion:external-123')) {
        return 'project-123';
      }
      return null;
    }),
    set: vi.fn(async () => 'OK'),
    del: vi.fn(async () => 1),
    expire: vi.fn(async () => true),
  };

  return {
    Redis: vi.fn(() => mockRedisInstance)
  };
});

describe('ContextMapper', () => {
  let contextMapper: ContextMapper;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create a fresh instance for each test
    contextMapper = ContextMapper.getInstance();
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();
  });

  it('should be a singleton', () => {
    const instance1 = ContextMapper.getInstance();
    const instance2 = ContextMapper.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should create a new mapping', async () => {
    const result = await contextMapper.createMapping({
      agentId: 'agent-123',
      userId: 'user-123',
      tool: 'notion',
      contextKey: 'project-123',
      externalId: 'external-123',
      metadata: { name: 'Project X' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    expect(result).toBe('mapping-123');
  });

  it('should get external ID for a context key', async () => {
    const externalId = await contextMapper.getExternalId('agent-123', 'notion', 'project-123');
    expect(externalId).toBe('external-123');
  });

  it('should get context key for an external ID', async () => {
    const contextKey = await contextMapper.getContextKey('agent-123', 'notion', 'external-123');
    expect(contextKey).toBe('project-123');
  });

  it('should update an existing mapping', async () => {
    const result = await contextMapper.updateMapping('mapping-123', {
      externalId: 'new-external-id',
      metadata: { name: 'Updated Project' },
    });

    expect(result).toBe(true);
  });

  it('should delete a mapping', async () => {
    const result = await contextMapper.deleteMapping('mapping-123');
    expect(result).toBe(true);
  });

  it('should list all mappings for an agent and tool', async () => {
    const mappings = await contextMapper.listMappings('agent-123', 'notion');
    
    expect(mappings).toHaveLength(1);
    expect(mappings[0].contextKey).toBe('project-123');
    expect(mappings[0].externalId).toBe('external-123');
  });

  it('should bulk upsert mappings', async () => {
    const result = await contextMapper.bulkUpsertMappings([
      {
        agentId: 'agent-123',
        userId: 'user-123',
        tool: 'notion',
        contextKey: 'project-123',
        externalId: 'external-123',
      },
      {
        agentId: 'agent-123',
        userId: 'user-123',
        tool: 'notion',
        contextKey: 'project-456',
        externalId: 'external-456',
      },
    ]);

    expect(result).toBe(2);
  });
});
