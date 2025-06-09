/**
 * LLM Response Cache Manager
 * Implements caching for LLM responses to reduce token usage and improve response times
 */

import { createHash } from 'crypto';
import { Message } from './service';
import { getRedisClient } from '../redis-client';

export interface CachedResponse {
  content: string;
  tokens: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  timestamp: number;
}

export class LLMCacheManager {
  private readonly defaultTTL = 60 * 60 * 24 * 7; // 7 days in seconds
  private readonly namespace = 'llm:cache:';
  
  /**
   * Generate a cache key from messages and model config
   */
  private generateCacheKey(messages: Message[], modelConfig: any = {}): string {
    // Extract only the essential parts of messages to create a consistent key
    const messagesForKey = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // Include only model name and temperature from config for key generation
    const configForKey = {
      model: modelConfig.model || 'default',
      temperature: modelConfig.temperature || 1,
    };
    
    // Create a deterministic string representation
    const keyData = JSON.stringify({
      messages: messagesForKey,
      config: configForKey,
    });
    
    // Hash the data to create a fixed-length key
    return this.namespace + createHash('sha256').update(keyData).digest('hex');
  }
  
  /**
   * Get a cached response if available
   */
  public async getCachedResponse(
    messages: Message[],
    modelConfig: any = {}
  ): Promise<CachedResponse | null> {
    try {
      const cacheKey = this.generateCacheKey(messages, modelConfig);
      const cachedData = await getRedisClient().get<CachedResponse>(cacheKey);
      
      return cachedData;
    } catch (error) {
      console.error('Error retrieving from cache:', error);
      return null;
    }
  }
  
  /**
   * Cache an LLM response
   */
  public async cacheResponse(
    messages: Message[],
    modelConfig: any = {},
    response: string,
    tokens: { promptTokens: number; completionTokens: number; totalTokens: number },
    ttl: number = this.defaultTTL
  ): Promise<boolean> {
    try {
      const cacheKey = this.generateCacheKey(messages, modelConfig);
      
      const cacheData: CachedResponse = {
        content: response,
        tokens,
        model: modelConfig.model || 'default',
        timestamp: Date.now(),
      };
      
      await getRedisClient().set(cacheKey, cacheData, { ex: ttl });
      return true;
    } catch (error) {
      console.error('Error caching response:', error);
      return false;
    }
  }
  
  /**
   * Invalidate a specific cache entry
   */
  public async invalidateCache(messages: Message[], modelConfig: any = {}): Promise<boolean> {
    try {
      const cacheKey = this.generateCacheKey(messages, modelConfig);
      await redis.del(cacheKey);
      return true;
    } catch (error) {
      console.error('Error invalidating cache:', error);
      return false;
    }
  }
  
  /**
   * Invalidate all cache entries for a specific model
   */
  public async invalidateModelCache(model: string): Promise<boolean> {
    try {
      // Get all keys with the namespace
      const keys = await redis.keys(`${this.namespace}*`);
      
      // For each key, get the data and check if it matches the model
      for (const key of keys) {
        const data = await redis.get<CachedResponse>(key);
        if (data && data.model === model) {
          await redis.del(key);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error invalidating model cache:', error);
      return false;
    }
  }
  
  /**
   * Get cache statistics
   */
  public async getCacheStats(): Promise<{
    totalEntries: number;
    byModel: Record<string, number>;
    estimatedSize: number;
  }> {
    try {
      // Get all keys with the namespace
      const keys = await redis.keys(`${this.namespace}*`);
      
      const modelCounts: Record<string, number> = {};
      let totalSize = 0;
      
      // For each key, get the data and count by model
      for (const key of keys) {
        const data = await redis.get<CachedResponse>(key);
        if (data) {
          const model = data.model || 'unknown';
          modelCounts[model] = (modelCounts[model] || 0) + 1;
          
          // Estimate size in bytes (rough approximation)
          const dataSize = JSON.stringify(data).length;
          totalSize += dataSize;
        }
      }
      
      return {
        totalEntries: keys.length,
        byModel: modelCounts,
        estimatedSize: totalSize,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        byModel: {},
        estimatedSize: 0,
      };
    }
  }
}

// Singleton instance
export const llmCacheManager = new LLMCacheManager();
