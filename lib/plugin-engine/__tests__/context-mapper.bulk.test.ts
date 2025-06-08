import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContextMapper } from '../context-mapper';

describe('ContextMapper Bulk Operations', () => {
  let mapper: ContextMapper;

  beforeEach(() => {
    mapper = ContextMapper.getInstance();
    (mapper as any).mappings = new Map();
  });

  it('bulk upserts multiple mappings', async () => {
    const mappings = [
      {
        id: 'b1', agentId: 'a1', userId: 'u1', tool: 'slack', contextKey: 'channel', externalId: 'C1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: 'b2', agentId: 'a2', userId: 'u2', tool: 'gmail', contextKey: 'thread', externalId: 'T2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
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
        id: 'b3', agentId: 'a3', userId: 'u3', tool: 'notion', contextKey: 'page', externalId: 'P3', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: 'b4', agentId: 'a4', userId: 'u4', tool: 'asana', contextKey: 'task', externalId: 'A4', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
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