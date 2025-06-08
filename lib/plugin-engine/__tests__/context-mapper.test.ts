/**
 * Context Mapper Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContextMapper } from '../context-mapper';

// Create a simple in-memory store for testing that can be accessed by tests
const dbStore = new Map<string, any>();

// Mock dependencies
vi.mock('@supabase/supabase-js', () => {
  
  return {
    createClient: vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn((field: string, value: string) => ({
            eq: vi.fn((field2: string, value2: string) => ({
              eq: vi.fn((field3: string, value3: string) => ({
                maybeSingle: vi.fn(() => {
                  // Find matching record
                  for (const [key, record] of dbStore.entries()) {
                    if (record[field] === value && record[field2] === value2 && record[field3] === value3) {
                      return { data: record, error: null };
                    }
                  }
                  return { data: null, error: null };
                }),
                single: vi.fn(() => {
                  // Find matching record
                  for (const [key, record] of dbStore.entries()) {
                    if (record[field] === value && record[field2] === value2 && record[field3] === value3) {
                      return { data: record, error: null };
                    }
                  }
                  return { data: null, error: null };
                }),
                order: vi.fn(() => ({ 
                  data: Array.from(dbStore.values()).filter(record => 
                    record[field] === value && record[field2] === value2
                  ), 
                  error: null 
                })),
              })),
              maybeSingle: vi.fn(() => {
                // Find matching record
                for (const [key, record] of dbStore.entries()) {
                  if (record[field] === value && record[field2] === value2) {
                    return { data: record, error: null };
                  }
                }
                return { data: null, error: null };
              }),
              single: vi.fn(() => {
                // Find matching record
                for (const [key, record] of dbStore.entries()) {
                  if (record[field] === value && record[field2] === value2) {
                    return { data: record, error: null };
                  }
                }
                return { data: null, error: null };
              }),
              order: vi.fn(() => ({ 
                data: Array.from(dbStore.values()).filter(record => 
                  record[field] === value
                ), 
                error: null 
              })),
            })),
            single: vi.fn(() => {
              // Find matching record
              for (const [key, record] of dbStore.entries()) {
                if (record[field] === value) {
                  return { data: record, error: null };
                }
              }
              return { data: null, error: null };
            }),
            maybeSingle: vi.fn(() => {
              // Find matching record
              for (const [key, record] of dbStore.entries()) {
                if (record[field] === value) {
                  return { data: record, error: null };
                }
              }
              return { data: null, error: null };
            }),
          })),
          single: vi.fn(() => ({ data: { id: 'mapping-123' }, error: null })),
        })),
        insert: vi.fn((data: any) => ({
          select: vi.fn(() => ({
            single: vi.fn(() => {
              // Store the inserted data
              const key = `${data.agentId}:${data.tool}:${data.contextKey}`;
              const record = { ...data, id: 'mapping-123' };
              dbStore.set(key, record);
              return { data: record, error: null };
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ data: null, error: null })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn((field: string, value: string) => ({
            eq: vi.fn((field2: string, value2: string) => ({
              eq: vi.fn((field3: string, value3: string) => {
                // Find and delete matching record
                for (const [key, record] of dbStore.entries()) {
                  if (record[field] === value && record[field2] === value2 && record[field3] === value3) {
                    dbStore.delete(key);
                    break;
                  }
                }
                return { data: null, error: null };
              }),
            })),
          })),
        })),
        upsert: vi.fn((data: any, options?: any) => {
          // Handle both single item and array
          const items = Array.isArray(data) ? data : [data];
          
          // Store the upserted data
          items.forEach((item, index) => {
            const key = `${item.agentId}:${item.tool}:${item.contextKey}`;
            dbStore.set(key, { ...item, id: item.id || `mapping-${index + 1}` });
          });
          
          // Return an object that can handle both .select() and direct response
          const result = {
            data: items.map((item, index) => ({ id: item.id || `mapping-${index + 1}` })),
            error: null
          };
          
          return {
            select: vi.fn(() => result),
            ...result // Also return data/error directly for when .select() is not called
          };
        }),
      })),
    }))
  };
});

vi.mock('@upstash/redis', () => {
  // Create a simple in-memory store for testing
  const store = new Map<string, string>();
  
  const mockRedisInstance = {
    get: vi.fn(async (key: string) => {
      return store.get(key) || null;
    }),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    del: vi.fn(async (key: string) => {
      const existed = store.has(key);
      store.delete(key);
      return existed ? 1 : 0;
    }),
    expire: vi.fn(async () => true),
  };

  return {
    Redis: vi.fn(() => mockRedisInstance)
  };
});

describe('ContextMapper', () => {
  let contextMapper: ContextMapper;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Clear the mock database
    dbStore.clear();
    
    // Create a fresh instance for each test
    contextMapper = ContextMapper.getInstance();
    // Clear mappings for isolation
    (contextMapper as any).mappings = new Map();
    
    // Add some test data to the mock database
    await contextMapper.createMapping({
      agentId: 'agent-123',
      userId: 'user-123',
      tool: 'notion',
      contextKey: 'project-123',
      externalId: 'external-123',
      metadata: { name: 'Project X' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
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

  it('upserts and retrieves a mapping', async () => {
    const mapping = {
      id: 'm1',
      agentId: 'agent1',
      userId: 'user1',
      tool: 'slack',
      contextKey: 'channel',
      externalId: 'C123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await contextMapper.upsertMapping(mapping);
    const result = await contextMapper.getMapping('agent1', 'slack', 'channel');
    expect(result?.externalId).toBe('C123');
  });

  it('deletes a mapping', async () => {
    const mapping = {
      id: 'm2',
      agentId: 'agent2',
      userId: 'user2',
      tool: 'gmail',
      contextKey: 'thread',
      externalId: 'T456',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await contextMapper.upsertMapping(mapping);
    await contextMapper.deleteMapping('agent2', 'gmail', 'thread');
    const result = await contextMapper.getMapping('agent2', 'gmail', 'thread');
    expect(result).toBeUndefined();
  });

  it('bulk upserts mappings', async () => {
    const mappings = [
      {
        id: 'm3',
        agentId: 'agent3',
        userId: 'user3',
        tool: 'notion',
        contextKey: 'page',
        externalId: 'P789',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'm4',
        agentId: 'agent4',
        userId: 'user4',
        tool: 'asana',
        contextKey: 'task',
        externalId: 'A101',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    const count = await contextMapper.bulkUpsertMappings(mappings);
    expect(count).toBe(2);
    const result1 = await contextMapper.getMapping('agent3', 'notion', 'page');
    const result2 = await contextMapper.getMapping('agent4', 'asana', 'task');
    expect(result1?.externalId).toBe('P789');
    expect(result2?.externalId).toBe('A101');
  });
});
