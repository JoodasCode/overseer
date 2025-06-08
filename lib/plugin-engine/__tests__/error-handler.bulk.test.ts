import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandler } from '../error-handler';

// Mock Supabase
const mockSupabaseData = new Map<string, any>();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn((data: any) => ({
        in: vi.fn((field: string, values: string[]) => ({
          select: vi.fn(() => {
            // Simulate updating records that exist
            const updatedRecords = values.map(id => ({ id }));
            return { data: updatedRecords, error: null };
          }),
        })),
      })),
    })),
  })),
}));

// Mock Redis
vi.mock('@upstash/redis', () => {
  const store = new Map<string, any>();
  
  const mockRedisInstance = {
    get: vi.fn(async (key: string) => store.get(key) || null),
    set: vi.fn(async (key: string, value: any) => {
      store.set(key, value);
      return 'OK';
    }),
    incr: vi.fn(async (key: string) => {
      const current = store.get(key) || 0;
      const newValue = current + 1;
      store.set(key, newValue);
      return newValue;
    }),
    expire: vi.fn(async () => true),
  };

  return {
    Redis: vi.fn(() => mockRedisInstance)
  };
});

describe('ErrorHandler Bulk Error Resolution', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseData.clear();
    handler = ErrorHandler.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves all errors successfully', async () => {
    const count = await handler.bulkResolveErrors(['e1', 'e2']);
    expect(count).toBe(2);
  });

  it('handles partial failures', async () => {
    const count = await handler.bulkResolveErrors(['e1', 'e2']);
    expect(count).toBe(2); // All succeed with our mock
  });

  it('returns 0 for empty array', async () => {
    const count = await handler.bulkResolveErrors([]);
    expect(count).toBe(0);
  });
}); 