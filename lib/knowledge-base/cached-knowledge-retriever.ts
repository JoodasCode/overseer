/**
 * Cached Knowledge Retriever
 * 
 * Enhances the knowledge retriever with Redis caching for improved performance.
 * Integrates with the synchronized data architecture for intelligent cache management.
 */

import { KnowledgeRetriever } from './knowledge-retriever';
import { redisService } from '@/lib/redis/redis-service';

export interface CachedKnowledgeOptions {
  enableCache?: boolean;
  cachePrefix?: string;
  ttl?: number;
  maxRetries?: number;
}

export interface KnowledgeSearchMetrics {
  cacheHit: boolean;
  searchTime: number;
  resultCount: number;
  queryComplexity: 'simple' | 'medium' | 'complex';
}

/**
 * Cached Knowledge Retriever Class
 */
export class CachedKnowledgeRetriever {
  private static defaultOptions: CachedKnowledgeOptions = {
    enableCache: true,
    cachePrefix: 'knowledge_search',
    ttl: 10 * 60, // 10 minutes
    maxRetries: 3,
  };

  /**
   * Retrieve knowledge with intelligent caching
   */
  static async retrieveKnowledge(
    query: string,
    userId: string,
    limit: number = 5,
    options: CachedKnowledgeOptions = {}
  ): Promise<{
    results: any[];
    metrics: KnowledgeSearchMetrics;
  }> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    
    // Generate cache key
    const queryHash = redisService.generateHash(`${query}:${userId}:${limit}`);
    const cacheKey = `${opts.cachePrefix}:${userId}:${queryHash}`;
    
    let cacheHit = false;
    let results: any[] = [];

    try {
      // Try to get from cache first (if enabled)
      if (opts.enableCache) {
        const cachedResults = await redisService.getCachedKnowledgeQuery(userId, queryHash);
        if (cachedResults) {
          results = cachedResults;
          cacheHit = true;
          
          // Track cache hit
          await redisService.trackCacheHit('knowledge_search', true);
        }
      }

      // If not in cache, fetch from database
      if (!cacheHit) {
        results = await KnowledgeRetriever.retrieveKnowledge(query, userId, limit);
        
        // Cache the results (if enabled and we have results)
        if (opts.enableCache && results.length > 0) {
          await redisService.cacheKnowledgeQuery(userId, queryHash, results);
        }
        
        // Track cache miss
        await redisService.trackCacheHit('knowledge_search', false);
      }

      const searchTime = Date.now() - startTime;
      const queryComplexity = this.assessQueryComplexity(query);

      // Store performance metrics
      const metrics: KnowledgeSearchMetrics = {
        cacheHit,
        searchTime,
        resultCount: results.length,
        queryComplexity,
      };

      // Track performance metrics
      await this.trackSearchMetrics(metrics, userId);

      return { results, metrics };
    } catch (error) {
      console.error('Error in cached knowledge retrieval:', error);
      
      // Fallback to direct database query
      if (cacheHit) {
        // If cache failed, try direct query
        results = await KnowledgeRetriever.retrieveKnowledge(query, userId, limit);
      }

      const searchTime = Date.now() - startTime;
      return {
        results,
        metrics: {
          cacheHit: false,
          searchTime,
          resultCount: results.length,
          queryComplexity: this.assessQueryComplexity(query),
        },
      };
    }
  }

  /**
   * Search knowledge base by keyword with caching
   */
  static async searchByKeyword(
    query: string,
    userId: string,
    limit: number = 10,
    options: CachedKnowledgeOptions = {}
  ): Promise<{
    results: any[];
    metrics: KnowledgeSearchMetrics;
  }> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    
    // Generate cache key for keyword search
    const queryHash = redisService.generateHash(`keyword:${query}:${userId}:${limit}`);
    
    let cacheHit = false;
    let results: any[] = [];

    try {
      // Try cache first
      if (opts.enableCache) {
        const cachedResults = await redisService.getCachedKnowledgeQuery(userId, queryHash);
        if (cachedResults) {
          results = cachedResults;
          cacheHit = true;
          await redisService.trackCacheHit('knowledge_keyword', true);
        }
      }

      // Fetch from database if not cached
      if (!cacheHit) {
        results = await KnowledgeRetriever.searchByKeyword(query, userId, limit);
        
        // Cache results
        if (opts.enableCache && results.length > 0) {
          await redisService.cacheKnowledgeQuery(userId, queryHash, results);
        }
        
        await redisService.trackCacheHit('knowledge_keyword', false);
      }

      const searchTime = Date.now() - startTime;
      const metrics: KnowledgeSearchMetrics = {
        cacheHit,
        searchTime,
        resultCount: results.length,
        queryComplexity: this.assessQueryComplexity(query),
      };

      await this.trackSearchMetrics(metrics, userId);

      return { results, metrics };
    } catch (error) {
      console.error('Error in cached keyword search:', error);
      
      // Fallback
      const searchTime = Date.now() - startTime;
      return {
        results: [],
        metrics: {
          cacheHit: false,
          searchTime,
          resultCount: 0,
          queryComplexity: this.assessQueryComplexity(query),
        },
      };
    }
  }

  /**
   * Get knowledge context with intelligent caching and prefetching
   */
  static async getKnowledgeContext(
    query: string,
    userId: string,
    maxTokens: number = 1500,
    options: CachedKnowledgeOptions = {}
  ): Promise<{
    context: string;
    metrics: KnowledgeSearchMetrics;
    sources: any[];
  }> {
    const startTime = Date.now();
    
    // First, get cached knowledge results
    const { results, metrics } = await this.retrieveKnowledge(
      query,
      userId,
      5, // Limit for context
      options
    );

    // Build context from results
    const context = await KnowledgeRetriever.getKnowledgeContext(query, userId, maxTokens);
    
    const totalTime = Date.now() - startTime;
    
    // Enhanced metrics
    const enhancedMetrics: KnowledgeSearchMetrics = {
      ...metrics,
      searchTime: totalTime,
    };

    // Track context generation metrics
    await redisService.storeMetric('knowledge_context_generated', 1, {
      userId: userId.substring(0, 8), // Truncated for privacy
      contextLength: context.length.toString(),
      sourceCount: results.length.toString(),
      cacheHit: metrics.cacheHit.toString(),
    });

    return {
      context,
      metrics: enhancedMetrics,
      sources: results,
    };
  }

  /**
   * Prefetch knowledge for an agent based on recent activity
   */
  static async prefetchAgentKnowledge(
    agentId: string,
    userId: string,
    recentQueries: string[] = [],
    recentTasks: any[] = []
  ): Promise<void> {
    try {
      // Generate prefetch queries based on agent activity
      const prefetchQueries = this.generatePrefetchQueries(recentQueries, recentTasks);
      
      // Fetch and cache results for these queries
      for (const query of prefetchQueries.slice(0, 5)) { // Limit to 5 prefetch queries
        await this.retrieveKnowledge(query, userId, 3, {
          enableCache: true,
          cachePrefix: `prefetch_${agentId}`,
          ttl: 30 * 60, // 30 minutes for prefetched data
        });
      }

      // Track prefetch operation
      await redisService.storeMetric('knowledge_prefetch', 1, {
        agentId: agentId.substring(0, 8),
        queryCount: prefetchQueries.length.toString(),
      });
    } catch (error) {
      console.error('Error prefetching agent knowledge:', error);
    }
  }

  /**
   * Invalidate knowledge cache for a user
   */
  static async invalidateUserKnowledgeCache(userId: string): Promise<void> {
    try {
      await redisService.invalidateUserCaches(userId);
      
      // Track cache invalidation
      await redisService.storeMetric('knowledge_cache_invalidated', 1, {
        userId: userId.substring(0, 8),
      });
    } catch (error) {
      console.error('Error invalidating knowledge cache:', error);
    }
  }

  /**
   * Warm up knowledge cache for frequently accessed content
   */
  static async warmKnowledgeCache(userId: string): Promise<void> {
    try {
      // Get popular queries for this user (this would come from analytics)
      const popularQueries = await this.getPopularQueries(userId);
      
      // Pre-cache these queries
      for (const query of popularQueries.slice(0, 10)) {
        await this.retrieveKnowledge(query, userId, 5, {
          enableCache: true,
          ttl: 60 * 60, // 1 hour for warmed cache
        });
      }

      // Track cache warming
      await redisService.storeMetric('knowledge_cache_warmed', 1, {
        userId: userId.substring(0, 8),
        queryCount: popularQueries.length.toString(),
      });
    } catch (error) {
      console.error('Error warming knowledge cache:', error);
    }
  }

  /**
   * Get knowledge search analytics
   */
  static async getSearchAnalytics(
    userId: string,
    timeRange: { start: number; end: number }
  ): Promise<{
    totalSearches: number;
    cacheHitRate: number;
    averageSearchTime: number;
    popularQueries: Array<{ query: string; count: number }>;
  }> {
    try {
      const metrics = await redisService.getMetrics(
        'knowledge_search',
        timeRange.start,
        timeRange.end
      );

      const cacheHits = await redisService.getMetrics(
        'cache_hit',
        timeRange.start,
        timeRange.end
      );

      const cacheMisses = await redisService.getMetrics(
        'cache_miss',
        timeRange.start,
        timeRange.end
      );

      const totalCacheOperations = cacheHits.length + cacheMisses.length;
      const cacheHitRate = totalCacheOperations > 0 
        ? (cacheHits.length / totalCacheOperations) * 100 
        : 0;

      const averageSearchTime = metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
        : 0;

      return {
        totalSearches: metrics.length,
        cacheHitRate,
        averageSearchTime,
        popularQueries: [], // Would implement query frequency tracking
      };
    } catch (error) {
      console.error('Error getting search analytics:', error);
      return {
        totalSearches: 0,
        cacheHitRate: 0,
        averageSearchTime: 0,
        popularQueries: [],
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Assess query complexity for performance optimization
   */
  private static assessQueryComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const words = query.split(/\s+/).length;
    const hasSpecialChars = /[^\w\s]/.test(query);
    const hasComplexTerms = /\b(analyze|compare|summarize|explain|elaborate)\b/i.test(query);

    if (words <= 3 && !hasSpecialChars && !hasComplexTerms) {
      return 'simple';
    } else if (words <= 10 && (!hasSpecialChars || !hasComplexTerms)) {
      return 'medium';
    } else {
      return 'complex';
    }
  }

  /**
   * Track search metrics in Redis
   */
  private static async trackSearchMetrics(
    metrics: KnowledgeSearchMetrics,
    userId: string
  ): Promise<void> {
    try {
      // Track search time
      await redisService.storeMetric('knowledge_search_time', metrics.searchTime, {
        userId: userId.substring(0, 8),
        complexity: metrics.queryComplexity,
        cacheHit: metrics.cacheHit.toString(),
      });

      // Track result count
      await redisService.storeMetric('knowledge_search_results', metrics.resultCount, {
        userId: userId.substring(0, 8),
        complexity: metrics.queryComplexity,
      });
    } catch (error) {
      console.error('Error tracking search metrics:', error);
    }
  }

  /**
   * Generate prefetch queries based on agent activity
   */
  private static generatePrefetchQueries(
    recentQueries: string[],
    recentTasks: any[]
  ): string[] {
    const queries = new Set<string>();

    // Add variations of recent queries
    recentQueries.forEach(query => {
      queries.add(query);
      
      // Add shortened versions
      const words = query.split(' ');
      if (words.length > 2) {
        queries.add(words.slice(0, Math.ceil(words.length / 2)).join(' '));
      }
    });

    // Add queries based on task topics
    recentTasks.forEach(task => {
      if (task.title) {
        queries.add(task.title);
      }
      if (task.description) {
        // Extract key terms from description
        const keyTerms = task.description
          .split(/\s+/)
          .filter((word: string) => word.length > 3)
          .slice(0, 3)
          .join(' ');
        if (keyTerms) {
          queries.add(keyTerms);
        }
      }
    });

    return Array.from(queries);
  }

  /**
   * Get popular queries for a user (placeholder - would use real analytics)
   */
  private static async getPopularQueries(userId: string): Promise<string[]> {
    // In a real implementation, this would analyze user's search history
    // For now, return some common knowledge base queries
    return [
      'project requirements',
      'technical documentation',
      'user guide',
      'API reference',
      'troubleshooting',
      'best practices',
      'configuration',
      'setup instructions',
      'examples',
      'tutorials',
    ];
  }
} 