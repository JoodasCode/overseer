import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GmailAdapter } from '../gmail';
import { TaskIntent } from '../../types';

describe('GmailAdapter', () => {
  let adapter: GmailAdapter;

  beforeEach(() => {
    adapter = new GmailAdapter();
  });

  it('should send an email with valid input', async () => {
    const intent: TaskIntent = {
      agentId: 'agent1',
      userId: 'user1',
      tool: 'gmail',
      intent: 'send',
      context: { to: 'test@example.com', subject: 'Test', body: 'Hello!' },
    };
    const result = await adapter.execute(intent);
    expect(result.success).toBe(true);
    expect(result.data?.to).toBe('test@example.com');
  });

  it('should read emails with valid input', async () => {
    const intent: TaskIntent = {
      agentId: 'agent1',
      userId: 'user1',
      tool: 'gmail',
      intent: 'read',
      context: { label: 'INBOX' },
    };
    const result = await adapter.execute(intent);
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data?.messages)).toBe(true);
  });

  it('should return error for missing recipient on send', async () => {
    const intent: TaskIntent = {
      agentId: 'agent1',
      userId: 'user1',
      tool: 'gmail',
      intent: 'send',
      context: { subject: 'No recipient', body: 'Missing to' },
    };
    const result = await adapter.execute(intent);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Missing required fields/);
  });

  it('should return error for unsupported intent', async () => {
    const intent: TaskIntent = {
      agentId: 'agent1',
      userId: 'user1',
      tool: 'gmail',
      intent: 'unsupported',
      context: {},
    };
    const result = await adapter.execute(intent);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Unsupported intent/);
  });
}); 