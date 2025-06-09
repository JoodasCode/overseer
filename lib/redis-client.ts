import { Redis } from '@upstash/redis';

let redisInstance: Redis | null = null;

/**
 * Get Redis client with lazy initialization
 * This ensures environment variables are loaded before creating the client
 */
export function getRedisClient(): Redis {
  if (!redisInstance) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url) {
      console.warn('[Redis] UPSTASH_REDIS_REST_URL is not defined. Using mock Redis client.');
      // Return a mock Redis client for development
      return createMockRedis();
    }

    if (!token) {
      console.warn('[Redis] UPSTASH_REDIS_REST_TOKEN is not defined. Using mock Redis client.');
      // Return a mock Redis client for development
      return createMockRedis();
    }

    console.log('[Redis] Initializing Redis client with URL:', url.substring(0, 30) + '...');
    
    redisInstance = new Redis({
      url,
      token,
    });
  }

  return redisInstance;
}

/**
 * Create a mock Redis client for development/testing
 */
function createMockRedis(): Redis {
  return {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    incr: async () => 1,
    expire: async () => 1,
    exists: async () => 0,
    hget: async () => null,
    hset: async () => 1,
    hdel: async () => 1,
    hgetall: async () => ({}),
  } as any;
}

/**
 * Reset Redis instance (for testing)
 */
export function resetRedisInstance(): void {
  redisInstance = null;
} 