import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SlackAdapter } from '../slack';
import { TaskIntent } from '../../types';

describe('SlackAdapter', () => {
  let adapter: SlackAdapter;

  beforeEach(() => {
    adapter = new SlackAdapter();
  });

  it('should send a message with valid input', async () => {
    const intent: TaskIntent = {
      agentId: 'agent1',
      userId: 'user1',
      tool: 'slack',
      intent: 'send',
      context: { channel: 'general', text: 'Hello, world!' },
    };
    const result = await adapter.execute(intent);
    expect(result.success).toBe(true);
    expect(result.data?.channel).toBe('general');
  });

  it('should read messages with valid input', async () => {
    const intent: TaskIntent = {
      agentId: 'agent1',
      userId: 'user1',
      tool: 'slack',
      intent: 'read',
      context: { channel: 'general' },
    };
    const result = await adapter.execute(intent);
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data?.messages)).toBe(true);
  });

  it('should return error for missing channel on send', async () => {
    const intent: TaskIntent = {
      agentId: 'agent1',
      userId: 'user1',
      tool: 'slack',
      intent: 'send',
      context: { text: 'No channel' },
    };
    const result = await adapter.execute(intent);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Missing required fields/);
  });

  it('should return error for missing channel on read', async () => {
    const intent: TaskIntent = {
      agentId: 'agent1',
      userId: 'user1',
      tool: 'slack',
      intent: 'read',
      context: {},
    };
    const result = await adapter.execute(intent);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Missing required field/);
  });

  it('should return error for unsupported intent', async () => {
    const intent: TaskIntent = {
      agentId: 'agent1',
      userId: 'user1',
      tool: 'slack',
      intent: 'unsupported',
      context: {},
    };
    const result = await adapter.execute(intent);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Unsupported intent/);
  });
}); 