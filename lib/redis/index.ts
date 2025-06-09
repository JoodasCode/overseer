/**
 * Redis Module Index
 * 
 * Exports Redis services and utilities for caching, rate limiting,
 * real-time features, and performance monitoring.
 */

import { redisService } from './redis-service';

export { redisService, RedisService } from './redis-service';
export type { 
  CacheEntry, 
  RateLimitResult, 
  MetricsData 
} from './redis-service';

export { 
  createRateLimit,
  withRateLimit,
  rateLimiters,
  createUserRateLimit,
  createIPRateLimit,
  RATE_LIMITS
} from '../middleware/rate-limit';

export type { RateLimitOptions } from '../middleware/rate-limit';

// Re-export cache-related knowledge base functionality
export { CachedKnowledgeRetriever } from '../knowledge-base/cached-knowledge-retriever';
export type { 
  CachedKnowledgeOptions,
  KnowledgeSearchMetrics 
} from '../knowledge-base/cached-knowledge-retriever';

/**
 * Initialize Redis connections and verify setup
 */
export async function initializeRedis(): Promise<{
  connected: boolean;
  info: any;
  timestamp: number;
}> {
  try {
    const connected = await redisService.ping();
    const info = await redisService.getInfo();
    
    if (connected) {
      console.log('✅ Redis connected successfully');
      console.log('📊 Redis Info:', info);
    } else {
      console.error('❌ Redis connection failed');
    }
    
    return {
      connected,
      info,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('❌ Redis initialization error:', error);
    return {
      connected: false,
      info: null,
      timestamp: Date.now(),
    };
  }
}

/**
 * Health check for Redis services
 */
export async function redisHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  metrics: any;
}> {
  const checks = {
    connection: false,
    caching: false,
    metrics: false,
  };
  
  try {
    // Test basic connection
    checks.connection = await redisService.ping();
    
    // Test caching functionality
    try {
      const testKey = `health_check_${Date.now()}`;
      await redisService.cachePluginResponse('test', 'health', testKey, { test: true });
      const cached = await redisService.getCachedPluginResponse('test', 'health', testKey);
      checks.caching = cached !== null;
    } catch (error) {
      console.error('Caching health check failed:', error);
    }
    
    // Test metrics functionality
    try {
      await redisService.storeMetric('health_check', 1, { test: 'true' });
      checks.metrics = true;
    } catch (error) {
      console.error('Metrics health check failed:', error);
    }
    
    // Determine overall status
    const healthyChecks = Object.values(checks).filter(Boolean).length;
    let status: 'healthy' | 'degraded' | 'unhealthy';
    
    if (healthyChecks === 3) {
      status = 'healthy';
    } else if (healthyChecks >= 1) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    // Get current metrics
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    const recentMetrics = await redisService.getMetrics(
      'health_check',
      fiveMinutesAgo,
      now
    );
    
    return {
      status,
      checks,
      metrics: {
        recentHealthChecks: recentMetrics.length,
        lastCheck: now,
      },
    };
  } catch (error) {
    console.error('Redis health check error:', error);
    return {
      status: 'unhealthy',
      checks,
      metrics: {
        error: (error as Error).message,
        lastCheck: Date.now(),
      },
    };
  }
}

/**
 * Get Redis performance statistics
 */
export async function getRedisStats(): Promise<{
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  activeConnections: number;
  memoryUsage: any;
  operationCounts: Record<string, number>;
}> {
  try {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    // Get cache statistics
    const cacheHits = await redisService.getMetrics('cache_hit', hourAgo, now);
    const cacheMisses = await redisService.getMetrics('cache_miss', hourAgo, now);
    
    const totalOperations = cacheHits.length + cacheMisses.length;
    const hitRate = totalOperations > 0 ? (cacheHits.length / totalOperations) * 100 : 0;
    
    // Get Redis info
    const info = await redisService.getInfo();
    
    return {
      cacheStats: {
        hits: cacheHits.length,
        misses: cacheMisses.length,
        hitRate: Math.round(hitRate * 100) / 100,
      },
      activeConnections: 1, // Upstash Redis doesn't expose this
      memoryUsage: info,
      operationCounts: {
        cacheOperations: totalOperations,
        metricsStored: cacheHits.length + cacheMisses.length,
      },
    };
  } catch (error) {
    console.error('Error getting Redis stats:', error);
    return {
      cacheStats: { hits: 0, misses: 0, hitRate: 0 },
      activeConnections: 0,
      memoryUsage: null,
      operationCounts: {},
    };
  }
} 