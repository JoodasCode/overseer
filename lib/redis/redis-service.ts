/**
 * Redis Service for Agents OS
 * 
 * Provides caching, session management, rate limiting, and real-time pub/sub features.
 * Uses Upstash Redis for serverless-optimized performance.
 */

import { Redis } from '@upstash/redis';
import { safeJsonParse, safeJsonStringify } from '@/lib/utils/safe-json';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  PLUGIN_RESPONSE: 5 * 60,        // 5 minutes
  AGENT_CONTEXT: 60 * 60,         // 1 hour
  SESSION: 2 * 60 * 60,           // 2 hours
  KNOWLEDGE_QUERY: 10 * 60,       // 10 minutes
  USER_PREFERENCES: 24 * 60 * 60, // 24 hours
  METRICS: 5 * 60,                // 5 minutes
} as const;

// Key prefixes for organization
export const KEY_PREFIX = {
  PLUGIN: 'plugin',
  AGENT: 'agent',
  SESSION: 'session',
  KNOWLEDGE: 'knowledge',
  USER: 'user',
  RATE_LIMIT: 'rate',
  METRICS: 'metrics',
  PUBSUB: 'pubsub',
  ERROR_COUNT: 'errors',
} as const;

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export interface MetricsData {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

/**
 * Redis Service Class
 */
export class RedisService {
  private static instance: RedisService;

  private constructor() {}

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  // ============================================================================
  // CACHING METHODS
  // ============================================================================

  /**
   * Cache plugin API response
   */
  async cachePluginResponse(
    userId: string,
    pluginName: string,
    requestHash: string,
    response: any
  ): Promise<void> {
    const key = `${KEY_PREFIX.PLUGIN}:${userId}:${pluginName}:${requestHash}`;
    const entry: CacheEntry = {
      data: response,
      timestamp: Date.now(),
      ttl: CACHE_TTL.PLUGIN_RESPONSE,
    };
    
    await redis.setex(key, CACHE_TTL.PLUGIN_RESPONSE, safeJsonStringify(entry));
  }

  /**
   * Get cached plugin response
   */
  async getCachedPluginResponse(
    userId: string,
    pluginName: string,
    requestHash: string
  ): Promise<any | null> {
    const key = `${KEY_PREFIX.PLUGIN}:${userId}:${pluginName}:${requestHash}`;
    const cached = await redis.get(key);
    
    if (!cached) return null;
    
    const entry: CacheEntry = safeJsonParse(cached as string, { data: null, timestamp: 0, ttl: 0 });
    return entry.data;
  }

  /**
   * Cache agent context and memory
   */
  async cacheAgentContext(
    agentId: string,
    context: {
      memory: any[];
      knowledge: any[];
      recentTasks: any[];
      preferences: any;
    }
  ): Promise<void> {
    const key = `${KEY_PREFIX.AGENT}:${agentId}:context`;
    const entry: CacheEntry = {
      data: context,
      timestamp: Date.now(),
      ttl: CACHE_TTL.AGENT_CONTEXT,
    };
    
    await redis.setex(key, CACHE_TTL.AGENT_CONTEXT, safeJsonStringify(entry));
  }

  /**
   * Get cached agent context
   */
  async getCachedAgentContext(agentId: string): Promise<any | null> {
    const key = `${KEY_PREFIX.AGENT}:${agentId}:context`;
    const cached = await redis.get(key);
    
    if (!cached) return null;
    
    const entry: CacheEntry = safeJsonParse(cached as string, { data: null, timestamp: 0, ttl: 0 });
    return entry.data;
  }

  /**
   * Cache knowledge base query results
   */
  async cacheKnowledgeQuery(
    userId: string,
    queryHash: string,
    results: any[]
  ): Promise<void> {
    const key = `${KEY_PREFIX.KNOWLEDGE}:${userId}:${queryHash}`;
    const entry: CacheEntry = {
      data: results,
      timestamp: Date.now(),
      ttl: CACHE_TTL.KNOWLEDGE_QUERY,
    };
    
    await redis.setex(key, CACHE_TTL.KNOWLEDGE_QUERY, safeJsonStringify(entry));
  }

  /**
   * Get cached knowledge query results
   */
  async getCachedKnowledgeQuery(
    userId: string,
    queryHash: string
  ): Promise<any[] | null> {
    const key = `${KEY_PREFIX.KNOWLEDGE}:${userId}:${queryHash}`;
    const cached = await redis.get(key);
    
    if (!cached) return null;
    
    const entry: CacheEntry = safeJsonParse(cached as string, { data: [], timestamp: 0, ttl: 0 });
    return entry.data;
  }

  /**
   * Invalidate all caches for a user
   */
  async invalidateUserCaches(userId: string): Promise<void> {
    const patterns = [
      `${KEY_PREFIX.PLUGIN}:${userId}:*`,
      `${KEY_PREFIX.KNOWLEDGE}:${userId}:*`,
      `${KEY_PREFIX.USER}:${userId}:*`,
    ];
    
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  }

  /**
   * Invalidate agent context cache
   */
  async invalidateAgentContext(agentId: string): Promise<void> {
    const key = `${KEY_PREFIX.AGENT}:${agentId}:context`;
    await redis.del(key);
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Store user session data
   */
  async storeSession(
    sessionId: string,
    sessionData: {
      userId: string;
      userAgent?: string;
      ipAddress?: string;
      lastActivity: number;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const key = `${KEY_PREFIX.SESSION}:${sessionId}`;
    await redis.setex(key, CACHE_TTL.SESSION, safeJsonStringify(sessionData));
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<any | null> {
    const key = `${KEY_PREFIX.SESSION}:${sessionId}`;
    const session = await redis.get(key);
    
    if (!session) return null;
    
    return safeJsonParse(session as string, null);
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    const key = `${KEY_PREFIX.SESSION}:${sessionId}`;
    const session = await this.getSession(sessionId);
    
    if (session) {
      session.lastActivity = Date.now();
      await redis.setex(key, CACHE_TTL.SESSION, safeJsonStringify(session));
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const key = `${KEY_PREFIX.SESSION}:${sessionId}`;
    await redis.del(key);
  }

  // ============================================================================
  // RATE LIMITING
  // ============================================================================

  /**
   * Check and apply rate limit
   */
  async checkRateLimit(
    identifier: string, // user ID, IP, or API key
    action: string,     // API endpoint or action type
    limit: number,      // max requests
    windowSeconds: number // time window
  ): Promise<RateLimitResult> {
    const key = `${KEY_PREFIX.RATE_LIMIT}:${identifier}:${action}`;
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);
    
    // Use Redis sorted set for sliding window
    await redis.zremrangebyscore(key, 0, windowStart);
    
    const currentCount = await redis.zcard(key);
    
    if (currentCount >= limit) {
      const resetTime = await redis.zrange(key, 0, 0, { withScores: true });
      const oldestRequest = resetTime[1] as number;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: oldestRequest + (windowSeconds * 1000),
      };
    }
    
    // Add current request
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    await redis.expire(key, windowSeconds + 10); // Extra buffer
    
    return {
      allowed: true,
      remaining: limit - currentCount - 1,
      resetTime: now + (windowSeconds * 1000),
    };
  }

  // ============================================================================
  // ERROR TRACKING
  // ============================================================================

  /**
   * Track error count for agent/tool
   */
  async trackError(
    agentId: string,
    toolName: string,
    errorType: string
  ): Promise<void> {
    const key = `${KEY_PREFIX.ERROR_COUNT}:${agentId}:${toolName}:${errorType}`;
    await redis.incr(key);
    await redis.expire(key, 24 * 60 * 60); // 24 hours
  }

  /**
   * Get error count for agent/tool
   */
  async getErrorCount(
    agentId: string,
    toolName: string,
    errorType: string
  ): Promise<number> {
    const key = `${KEY_PREFIX.ERROR_COUNT}:${agentId}:${toolName}:${errorType}`;
    const count = await redis.get(key);
    return count ? parseInt(count as string, 10) : 0;
  }

  /**
   * Reset error count
   */
  async resetErrorCount(
    agentId: string,
    toolName: string,
    errorType: string
  ): Promise<void> {
    const key = `${KEY_PREFIX.ERROR_COUNT}:${agentId}:${toolName}:${errorType}`;
    await redis.del(key);
  }

  // ============================================================================
  // REAL-TIME PUB/SUB
  // ============================================================================

  /**
   * Publish agent activity update
   */
  async publishAgentActivity(
    userId: string,
    agentId: string,
    activity: {
      type: 'task_started' | 'task_completed' | 'memory_updated' | 'error_occurred';
      data: any;
      timestamp: number;
    }
  ): Promise<void> {
    const channel = `${KEY_PREFIX.PUBSUB}:agent_activity:${userId}`;
    const message = {
      agentId,
      ...activity,
    };
    
    await redis.publish(channel, safeJsonStringify(message));
  }

  /**
   * Publish dashboard update
   */
  async publishDashboardUpdate(
    userId: string,
    update: {
      type: 'agent_status' | 'task_update' | 'metrics_update' | 'knowledge_added';
      data: any;
      timestamp: number;
    }
  ): Promise<void> {
    const channel = `${KEY_PREFIX.PUBSUB}:dashboard:${userId}`;
    await redis.publish(channel, safeJsonStringify(update));
  }

  /**
   * Track user presence
   */
  async updateUserPresence(
    userId: string,
    status: 'online' | 'away' | 'offline',
    metadata?: Record<string, any>
  ): Promise<void> {
    const key = `${KEY_PREFIX.USER}:${userId}:presence`;
    const presence = {
      status,
      lastSeen: Date.now(),
      metadata: metadata || {},
    };
    
    await redis.setex(key, 5 * 60, safeJsonStringify(presence)); // 5 minute expiry
    
    // Publish presence update
    await redis.publish(
      `${KEY_PREFIX.PUBSUB}:presence`,
      safeJsonStringify({ userId, ...presence })
    );
  }

  /**
   * Get user presence
   */
  async getUserPresence(userId: string): Promise<any | null> {
    const key = `${KEY_PREFIX.USER}:${userId}:presence`;
    const presence = await redis.get(key);
    
    if (!presence) return null;
    
    return safeJsonParse(presence as string, null);
  }

  // ============================================================================
  // PERFORMANCE METRICS
  // ============================================================================

  /**
   * Store performance metric
   */
  async storeMetric(
    metricName: string,
    value: number,
    tags?: Record<string, string>
  ): Promise<void> {
    const timestamp = Date.now();
    const key = `${KEY_PREFIX.METRICS}:${metricName}`;
    
    const metric: MetricsData = {
      timestamp,
      value,
      metadata: tags,
    };
    
    // Store in sorted set for time-series data
    await redis.zadd(key, { score: timestamp, member: JSON.stringify(metric) });
    
    // Keep only last 24 hours
    const dayAgo = timestamp - (24 * 60 * 60 * 1000);
    await redis.zremrangebyscore(key, 0, dayAgo);
  }

  /**
   * Get metrics for time range
   */
  async getMetrics(
    metricName: string,
    startTime: number,
    endTime: number
  ): Promise<MetricsData[]> {
    const key = `${KEY_PREFIX.METRICS}:${metricName}`;
    const results = await redis.zrange(key, startTime, endTime, { byScore: true });
    
    return results.map((result: any) => {
      const parsed = safeJsonParse(result as string, null);
      return parsed as MetricsData | null;
    }).filter((item): item is MetricsData => item !== null);
  }

  /**
   * Track cache hit/miss
   */
  async trackCacheHit(cacheType: string, hit: boolean): Promise<void> {
    const metricName = `cache_${hit ? 'hit' : 'miss'}`;
    await this.storeMetric(metricName, 1, { cacheType });
  }

  // ============================================================================
  // BACKGROUND JOBS
  // ============================================================================

  /**
   * Warm cache for frequently accessed data
   */
  async warmCache(userId: string): Promise<void> {
    // This would typically be called by a background job
    // For now, we'll just mark it as a placeholder
    const key = `${KEY_PREFIX.USER}:${userId}:cache_warmed`;
    await redis.setex(key, 60 * 60, Date.now().toString()); // 1 hour
  }

  /**
   * Clean up expired data
   */
  async cleanup(): Promise<void> {
    // Get patterns to clean
    const patterns = [
      `${KEY_PREFIX.METRICS}:*`,
      `${KEY_PREFIX.ERROR_COUNT}:*`,
    ];
    
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);
    
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      for (const key of keys) {
        if (key.includes(KEY_PREFIX.METRICS)) {
          // Clean old metrics
          await redis.zremrangebyscore(key, 0, dayAgo);
        }
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Test Redis connection
   */
  async ping(): Promise<boolean> {
    try {
      const result = await redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis ping failed:', error);
      return false;
    }
  }

  /**
   * Get Redis info
   */
  async getInfo(): Promise<any> {
    try {
      // Upstash Redis doesn't support INFO command, return basic metrics instead
      const keyCount = await redis.dbsize();
      return {
        keyCount,
        timestamp: Date.now(),
        status: 'connected'
      };
    } catch (error) {
      console.error('Failed to get Redis info:', error);
      return null;
    }
  }

  /**
   * Generate cache key hash
   */
  generateHash(input: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Export singleton instance
export const redisService = RedisService.getInstance(); 