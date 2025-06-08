import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandler } from '../error-handler';

describe('ErrorHandler Bulk Error Resolution', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    handler = ErrorHandler.getInstance();
    // Mock the resolveError method
    (handler as any).resolveError = vi.fn(async (id: any) => {
      if (id === 'fail') throw new Error('Resolution failed');
      return true;
    });
  });

  it('resolves all errors successfully', async () => {
    const count = await handler.bulkResolveErrors(['e1', 'e2']);
    expect(count).toBe(2);
    expect((handler as any).resolveError).toHaveBeenCalledTimes(2);
  });

  it('handles partial failures', async () => {
    const count = await handler.bulkResolveErrors(['e1', 'fail', 'e2']);
    expect(count).toBe(2); // Only 2 succeeded
  });

  it('returns 0 if all fail', async () => {
    (handler as any).resolveError = vi.fn(async () => { throw new Error('fail'); });
    const count = await handler.bulkResolveErrors(['fail1', 'fail2']);
    expect(count).toBe(0);
  });
}); 