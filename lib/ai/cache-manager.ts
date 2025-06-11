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

/**
 * Cache Manager for agent-specific responses
 */
export class CacheManager {
  private readonly defaultTTL = 60 * 60 * 24; // 1 day in seconds
  private readonly namespace = 'agent:cache:';
  
  /**
   * Cache a response for an agent
   */
  public async cacheResponse(
    agentId: string,
    message: string,
    completion: string,
    ttl: number = this.defaultTTL
  ): Promise<boolean> {
    try {
      const cacheKey = this.generateAgentCacheKey(agentId, message);
      
      const cacheData = {
        content: completion,
        timestamp: Date.now(),
        agentId,
        message,
      };
      
      await getRedisClient().set(cacheKey, cacheData, { ex: ttl });
      return true;
    } catch (error) {
      console.error('Error caching agent response:', error);
      return false;
    }
  }
  
  /**
   * Get a cached response for an agent
   */
  public async getCachedResponse(agentId: string, message: string): Promise<any | null> {
    try {
      const cacheKey = this.generateAgentCacheKey(agentId, message);
      const cachedData = await getRedisClient().get(cacheKey);
      
      return cachedData;
    } catch (error) {
      console.error('Error retrieving agent cache:', error);
      return null;
    }
  }
  
  /**
   * Generate a cache key for agent responses
   */
  private generateAgentCacheKey(agentId: string, message: string): string {
    const keyData = JSON.stringify({ agentId, message });
    return this.namespace + createHash('sha256').update(keyData).digest('hex');
  }
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
      await getRedisClient().del(cacheKey);
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
      const keys = await getRedisClient().keys(`${this.namespace}*`);
      
      // For each key, get the data and check if it matches the model
      for (const key of keys) {
        const data = await getRedisClient().get<CachedResponse>(key);
        if (data && data.model === model) {
          await getRedisClient().del(key);
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
      const keys = await getRedisClient().keys(`${this.namespace}*`);
      
      const modelCounts: Record<string, number> = {};
      let totalSize = 0;
      
      // For each key, get the data and count by model
      for (const key of keys) {
        const data = await getRedisClient().get<CachedResponse>(key);
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
