import { vi } from 'vitest'

// Mock OpenAI
vi.mock('openai', () => {
  const MockOpenAI = vi.fn().mockImplementation(() => ({
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      }),
    },
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Mocked AI response',
              },
            },
          ],
        }),
      },
    },
  }))
  
  return {
    default: MockOpenAI,
  }
})

// Mock Redis
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    expire: vi.fn().mockResolvedValue(1),
    incr: vi.fn().mockResolvedValue(1),
    decr: vi.fn().mockResolvedValue(0),
    hget: vi.fn().mockResolvedValue(null),
    hset: vi.fn().mockResolvedValue(1),
    hdel: vi.fn().mockResolvedValue(1),
    hgetall: vi.fn().mockResolvedValue({}),
  })),
}))

// Mock ioredis
vi.mock('ioredis', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      exists: vi.fn().mockResolvedValue(0),
      expire: vi.fn().mockResolvedValue(1),
      incr: vi.fn().mockResolvedValue(1),
      decr: vi.fn().mockResolvedValue(0),
      hget: vi.fn().mockResolvedValue(null),
      hset: vi.fn().mockResolvedValue(1),
      hdel: vi.fn().mockResolvedValue(1),
      hgetall: vi.fn().mockResolvedValue({}),
      disconnect: vi.fn().mockResolvedValue(undefined),
      quit: vi.fn().mockResolvedValue(undefined),
    })),
  }
})

// Mock CacheManager
vi.mock('@/lib/ai/cache-manager', () => {
  const MockCacheManager = vi.fn().mockImplementation(() => ({
    getCachedResponse: vi.fn().mockResolvedValue(null),
    cacheResponse: vi.fn().mockResolvedValue(true),
    invalidateCache: vi.fn().mockResolvedValue(true),
    invalidateModelCache: vi.fn().mockResolvedValue(true),
    getCacheStats: vi.fn().mockResolvedValue({ totalEntries: 0, byModel: {}, estimatedSize: 0 }),
  }))
  
  return {
    CacheManager: MockCacheManager,
    LLMCacheManager: MockCacheManager,
  }
})

// Mock Prisma
vi.mock('@/lib/prisma', () => {
  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    created_at: new Date(),
    updated_at: new Date(),
  }

  return {
    prisma: {
      user: {
        create: vi.fn().mockResolvedValue(mockUser),
        upsert: vi.fn().mockResolvedValue(mockUser),
        findUnique: vi.fn().mockResolvedValue(mockUser),
        findFirst: vi.fn().mockResolvedValue(mockUser),
        findMany: vi.fn().mockResolvedValue([mockUser]),
        update: vi.fn().mockResolvedValue(mockUser),
        delete: vi.fn().mockResolvedValue(mockUser),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      agent: {
        create: vi.fn().mockImplementation((data) => Promise.resolve({
          id: '550e8400-e29b-41d4-a716-446655440001',
          ...data.data,
          created_at: new Date(),
          updated_at: new Date(),
        })),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue({
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Test Agent',
          description: 'Test Description',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          created_at: new Date(),
          updated_at: new Date(),
        }),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        count: vi.fn().mockResolvedValue(0),
      },
      workflow: {
        create: vi.fn().mockResolvedValue({
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Test Workflow',
          description: 'Test Description',
          user_id: mockUser.id,
          nodes: [],
          edges: [],
          status: 'draft',
          created_at: new Date(),
          updated_at: new Date(),
        }),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue({
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Test Workflow',
          description: 'Test Description',
          user_id: mockUser.id,
          nodes: [],
          edges: [],
          status: 'draft',
          created_at: new Date(),
          updated_at: new Date(),
        }),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        count: vi.fn().mockResolvedValue(0),
      },
      task: {
        create: vi.fn().mockImplementation((data) => Promise.resolve({
          id: '550e8400-e29b-41d4-a716-446655440003',
          ...data.data,
          created_at: new Date(),
          updated_at: new Date(),
        })),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue({
          id: '550e8400-e29b-41d4-a716-446655440003',
          title: 'Test Task',
          description: 'Test Description',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'PENDING',
          priority: 'MEDIUM',
          created_at: new Date(),
          updated_at: new Date(),
        }),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        count: vi.fn().mockResolvedValue(0),
      },
      agentMemory: {
        create: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        count: vi.fn().mockResolvedValue(0),
      },
      workflowExecution: {
        create: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        count: vi.fn().mockResolvedValue(0),
      },
      errorLog: {
        create: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        count: vi.fn().mockResolvedValue(0),
      },
      $disconnect: vi.fn().mockResolvedValue(undefined),
    },
  }
})

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
      name: 'Test User',
    },
  }),
}))

// Mock Supabase client
vi.mock('@/lib/supabase-client', () => {
  const mockGetUser = vi.fn().mockResolvedValue({
    data: {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
      },
    },
    error: null,
  })

  return {
    supabase: {
      auth: {
        getUser: mockGetUser,
      },
    },
    // Export the mock function so tests can modify it
    mockGetUser,
  }
})

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters' 