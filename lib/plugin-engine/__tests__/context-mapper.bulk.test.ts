/**
 * Context Mapper Bulk Operations Tests
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
        upsert: vi.fn((data: any, options?: any) => ({
          select: vi.fn(() => {
            // Handle both single item and array
            const items = Array.isArray(data) ? data : [data];
            
            // Store the upserted data
            items.forEach((item, index) => {
              const key = `${item.agentId}:${item.tool}:${item.contextKey}`;
              dbStore.set(key, { ...item, id: item.id || `mapping-${index + 1}` });
            });
            return { data: items.map((item, index) => ({ id: item.id || `mapping-${index + 1}` })), error: null };
          }),
        })),
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

describe('ContextMapper Bulk Operations', () => {
  let mapper: ContextMapper;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Clear the mock database
    dbStore.clear();
    
    mapper = ContextMapper.getInstance();
    (mapper as any).mappings = new Map();
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();
  });

  it('bulk upserts multiple mappings', async () => {
    const mappings = [
      {
        agentId: 'a1', userId: 'u1', tool: 'slack', contextKey: 'channel', externalId: 'C1', 
        metadata: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        agentId: 'a2', userId: 'u2', tool: 'gmail', contextKey: 'thread', externalId: 'T2', 
        metadata: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    ];
    const count = await mapper.bulkUpsertMappings(mappings);
    expect(count).toBe(2);
    expect(await mapper.getMapping('a1', 'slack', 'channel')).toBeDefined();
    expect(await mapper.getMapping('a2', 'gmail', 'thread')).toBeDefined();
  });

  it('bulk deletes mappings', async () => {
    const mappings = [
      {
        agentId: 'a3', userId: 'u3', tool: 'notion', contextKey: 'page', externalId: 'P3', 
        metadata: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        agentId: 'a4', userId: 'u4', tool: 'asana', contextKey: 'task', externalId: 'A4', 
        metadata: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    ];
    await mapper.bulkUpsertMappings(mappings);
    const count = await mapper.bulkDeleteMappings([
      { agentId: 'a3', tool: 'notion', contextKey: 'page' },
      { agentId: 'a4', tool: 'asana', contextKey: 'task' },
    ]);
    expect(count).toBe(2);
    expect(await mapper.getMapping('a3', 'notion', 'page')).toBeUndefined();
    expect(await mapper.getMapping('a4', 'asana', 'task')).toBeUndefined();
  });

  it('handles empty input gracefully', async () => {
    const upsertCount = await mapper.bulkUpsertMappings([]);
    const deleteCount = await mapper.bulkDeleteMappings([]);
    expect(upsertCount).toBe(0);
    expect(deleteCount).toBe(0);
  });
}); 