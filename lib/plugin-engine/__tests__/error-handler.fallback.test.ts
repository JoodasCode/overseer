import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandler } from '../error-handler';

describe('ErrorHandler Fallback Messages', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    handler = ErrorHandler.getInstance();
    // Clear fallback messages for isolation
    (handler as any).fallbackMessages = new Map();
    handler.setFallbackMessage('default', 'Default fallback');
    handler.setFallbackMessage('gmail', 'Gmail fallback');
    handler.setFallbackMessage('gmail', 'Agent-specific fallback', 'agent-123');
  });

  it('returns agent-specific fallback if set', () => {
    const msg = handler.getFallbackMessage('gmail', 'agent-123');
    expect(msg).toBe('Agent-specific fallback');
  });

  it('returns tool fallback if agent-specific not set', () => {
    const msg = handler.getFallbackMessage('gmail', 'agent-999');
    expect(msg).toBe('Gmail fallback');
  });

  it('returns default fallback if tool not set', () => {
    const msg = handler.getFallbackMessage('notion');
    expect(msg).toBe('Default fallback');
  });

  it('returns hardcoded fallback if nothing set', () => {
    (handler as any).fallbackMessages = new Map();
    const msg = handler.getFallbackMessage('unknown');
    expect(msg).toMatch(/The agent encountered an issue/);
  });
}); 