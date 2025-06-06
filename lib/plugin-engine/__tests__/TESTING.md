# Testing Strategy for Plugin Engine

## Mocking External Dependencies

### Supabase and Redis Mocking

The plugin engine relies heavily on Supabase and Redis clients which are initialized at the module level. This requires special mocking techniques to ensure tests run properly without actual external connections.

#### Key Techniques

1. **Use `vi.hoisted()` for Mock Functions**

   ```typescript
   // Use vi.hoisted to ensure mock functions are hoisted to the top
   const mockRedisGet = vi.hoisted(() => vi.fn().mockResolvedValue(null));
   const mockRedisSet = vi.hoisted(() => vi.fn().mockResolvedValue('OK'));
   const mockRedisIncr = vi.hoisted(() => vi.fn().mockResolvedValue(1));
   const mockRedisExpire = vi.hoisted(() => vi.fn().mockResolvedValue(1));
   const mockRedisDel = vi.hoisted(() => vi.fn().mockResolvedValue(1));
   ```

   This ensures mock functions are available before module imports.

2. **Create Chainable Mock Objects for Supabase**

   ```typescript
   // Create a chainable mock object for Supabase
   const createSupabaseChain = () => {
     const chainObj: any = {};
     const methods = ['from', 'insert', 'update', 'select', 'eq', 'in', 'order', 'limit', 'single', 'rpc', 'gte', 'group', 'delete'];
     
     methods.forEach(method => {
       chainObj[method] = vi.fn().mockImplementation(() => chainObj);
     });
     
     return chainObj;
   };

   // Create hoisted versions of the mock functions
   const mockSupabaseFrom = vi.hoisted(() => vi.fn().mockImplementation(() => createSupabaseChain()));
   ```

   This approach allows for proper method chaining like `.from().select().eq()` in tests.

3. **Mock Module Imports**

   ```typescript
   vi.mock('@upstash/redis', () => ({
     Redis: vi.fn(() => ({
       get: mockRedisGet,
       set: mockRedisSet,
       incr: mockRedisIncr,
       del: mockRedisDel,
       expire: mockRedisExpire
     }))
   }));

   vi.mock('@supabase/supabase-js', () => ({
     createClient: vi.fn(() => ({
       from: mockSupabaseFrom
     }))
   }));
   ```

4. **Set Environment Variables for Testing**

   ```typescript
   vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test-url.supabase.co');
   vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');
   vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test-redis-url');
   vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
   ```

### Date Mocking

For tests that depend on the current date/time, we use a custom Date mock:

```typescript
// Store the real Date constructor
const realDate = Date;
// Create a mock date with a fixed timestamp
const mockDate = new Date('2023-01-03T00:00:00Z');

// Replace the global Date constructor with our mock
global.Date = class extends realDate {
  constructor(date?: string | number | Date) {
    if (date) {
      super(date);
    } else {
      super();
      return mockDate as any;
    }
  }
  static now() {
    return mockDate.getTime();
  }
} as any;

// After the test, restore the original Date constructor
global.Date = realDate;
```

## Best Practices

1. **Reset Mocks Before Each Test**
   
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
     // Reset any singleton instances if needed
     ErrorHandler['instance'] = null;
   });
   ```

2. **Restore Mocks After Tests**

   ```typescript
   afterEach(() => {
     vi.restoreAllMocks();
   });
   ```

3. **Test Error Handling**

   Always include tests for error cases, not just success paths:

   ```typescript
   it('should handle Supabase error when logging', async () => {
     // Mock Supabase error response
     mockSupabaseFrom.mockReturnValueOnce({
       insert: vi.fn().mockReturnValue({
         select: vi.fn().mockReturnValue({
           single: vi.fn().mockResolvedValue({
             data: null,
             error: { message: 'Database error' }
           })
         })
       })
     });

     const result = await errorHandler.logError({
       agentId: 'agent-123',
       userId: 'user-456',
       tool: 'gmail',
       action: 'send',
       errorCode: 'AUTH_ERROR',
       errorMessage: 'Failed to authenticate'
     });

     expect(result).toBe('');
   });
   ```

4. **Mock Complex Method Chains**

   For complex Supabase queries with multiple chained methods, set up the mock chain to match the exact sequence:

   ```typescript
   // For a chain like .from().select().eq().order()
   const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
   const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
   const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
   mockSupabaseFrom.mockReturnValueOnce({ select: mockSelect });
   ```
