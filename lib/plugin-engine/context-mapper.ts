/**
 * Context Mapper for Plugin Engine
 * 
 * Manages mappings between agent context and external service IDs
 * For example, mapping an agent's "project-123" to Notion's actual page ID
 */

import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { ContextMapping } from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export class ContextMapper {
  private static instance: ContextMapper;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ContextMapper {
    if (!ContextMapper.instance) {
      ContextMapper.instance = new ContextMapper();
    }
    return ContextMapper.instance;
  }

  /**
   * Create a new context mapping
   * @param mapping Context mapping object
   * @returns ID of the created mapping
   */
  public async createMapping(mapping: Omit<ContextMapping, 'id'>): Promise<string> {
    // Store in Supabase
    const { data, error } = await supabase
      .from('context_mappings')
      .insert({
        ...mapping,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create context mapping:', error);
      throw new Error(`Failed to create context mapping: ${error.message}`);
    }

    // Cache in Redis for quick lookups
    const cacheKey = this.getCacheKey(mapping.agentId, mapping.tool, mapping.contextKey);
    await redis.set(cacheKey, mapping.externalId);
    
    // Set expiry if provided
    if (mapping.expiresAt) {
      const expiryMs = new Date(mapping.expiresAt).getTime() - Date.now();
      if (expiryMs > 0) {
        await redis.expire(cacheKey, Math.floor(expiryMs / 1000));
      }
    }

    return data.id;
  }

  /**
   * Get external ID for a context key
   * @param agentId Agent ID
   * @param tool Tool name
   * @param contextKey Context key
   * @returns External ID or null if not found
   */
  public async getExternalId(agentId: string, tool: string, contextKey: string): Promise<string | null> {
    // Try Redis cache first
    const cacheKey = this.getCacheKey(agentId, tool, contextKey);
    const cachedId = await redis.get<string>(cacheKey);
    
    if (cachedId) {
      return cachedId;
    }
    
    // Fall back to Supabase
    const { data, error } = await supabase
      .from('context_mappings')
      .select('externalId')
      .eq('agentId', agentId)
      .eq('tool', tool)
      .eq('contextKey', contextKey)
      .maybeSingle();
    
    if (error) {
      console.error('Failed to get external ID:', error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    // Update cache
    await redis.set(cacheKey, data.externalId);
    
    return data.externalId;
  }

  /**
   * Get context key for an external ID
   * @param agentId Agent ID
   * @param tool Tool name
   * @param externalId External ID
   * @returns Context key or null if not found
   */
  public async getContextKey(agentId: string, tool: string, externalId: string): Promise<string | null> {
    // Try Redis cache first (using reverse lookup)
    const reverseCacheKey = this.getReverseCacheKey(agentId, tool, externalId);
    const cachedKey = await redis.get<string>(reverseCacheKey);
    
    if (cachedKey) {
      return cachedKey;
    }
    
    // Fall back to Supabase
    const { data, error } = await supabase
      .from('context_mappings')
      .select('contextKey')
      .eq('agentId', agentId)
      .eq('tool', tool)
      .eq('externalId', externalId)
      .maybeSingle();
    
    if (error) {
      console.error('Failed to get context key:', error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    // Update cache
    await redis.set(reverseCacheKey, data.contextKey);
    
    return data.contextKey;
  }

  /**
   * Update an existing context mapping
   * @param id Mapping ID
   * @param updates Updates to apply
   * @returns Success status
   */
  public async updateMapping(id: string, updates: Partial<Omit<ContextMapping, 'id' | 'agentId' | 'tool' | 'contextKey'>>): Promise<boolean> {
    // Get the current mapping
    const { data: currentMapping, error: fetchError } = await supabase
      .from('context_mappings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !currentMapping) {
      console.error('Failed to fetch mapping for update:', fetchError);
      return false;
    }
    
    // Update in Supabase
    const { error } = await supabase
      .from('context_mappings')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Failed to update context mapping:', error);
      return false;
    }
    
    // Update cache
    const cacheKey = this.getCacheKey(currentMapping.agentId, currentMapping.tool, currentMapping.contextKey);
    
    if (updates.externalId) {
      await redis.set(cacheKey, updates.externalId);
      
      // Update reverse lookup cache
      const reverseCacheKey = this.getReverseCacheKey(currentMapping.agentId, currentMapping.tool, updates.externalId);
      await redis.set(reverseCacheKey, currentMapping.contextKey);
    }
    
    // Update expiry if provided
    if (updates.expiresAt) {
      const expiryMs = new Date(updates.expiresAt).getTime() - Date.now();
      if (expiryMs > 0) {
        await redis.expire(cacheKey, Math.floor(expiryMs / 1000));
      }
    }
    
    return true;
  }



  /**
   * List all context mappings for an agent and tool
   * @param agentId Agent ID
   * @param tool Tool name
   * @returns Array of context mappings
   */
  public async listMappings(agentId: string, tool: string): Promise<ContextMapping[]> {
    const { data, error } = await supabase
      .from('context_mappings')
      .select('*')
      .eq('agentId', agentId)
      .eq('tool', tool)
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Failed to list context mappings:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Bulk create or update mappings
   * @param mappings Array of mappings to create or update
   * @returns Number of successful operations
   */
  public async bulkUpsertMappings(mappings: Array<Omit<ContextMapping, 'id' | 'createdAt' | 'updatedAt'>>): Promise<number> {
    if (mappings.length === 0) {
      return 0;
    }
    
    // Prepare mappings with timestamps
    const now = new Date().toISOString();
    const preparedMappings = mappings.map(mapping => ({
      ...mapping,
      updatedAt: now
    }));
    
    // Upsert to Supabase
    const { data, error } = await supabase
      .from('context_mappings')
      .upsert(preparedMappings, {
        onConflict: 'agentId,tool,contextKey',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error('Failed to bulk upsert mappings:', error);
      return 0;
    }
    
    // Update cache for each mapping
    const cachePromises = preparedMappings.map(mapping => {
      const cacheKey = this.getCacheKey(mapping.agentId, mapping.tool, mapping.contextKey);
      const reverseCacheKey = this.getReverseCacheKey(mapping.agentId, mapping.tool, mapping.externalId);
      
      return Promise.all([
        redis.set(cacheKey, mapping.externalId),
        redis.set(reverseCacheKey, mapping.contextKey)
      ]);
    });
    
    await Promise.all(cachePromises.flat());
    
    return data.length;
  }

  /**
   * Generate cache key for Redis
   */
  private getCacheKey(agentId: string, tool: string, contextKey: string): string {
    return `context_map:${agentId}:${tool}:${contextKey}`;
  }

  /**
   * Generate reverse lookup cache key for Redis
   */
  private getReverseCacheKey(agentId: string, tool: string, externalId: string): string {
    return `context_map_rev:${agentId}:${tool}:${externalId}`;
  }

  /**
   * Get the full context mapping for a given agent, tool, and contextKey
   */
  public async getMapping(agentId: string, tool: string, contextKey: string): Promise<ContextMapping | undefined> {
    // Try Redis cache for externalId
    const cacheKey = this.getCacheKey(agentId, tool, contextKey);
    const cachedExternalId = await redis.get<string>(cacheKey);
    if (cachedExternalId) {
      // Try to get the rest from Supabase
      const { data, error } = await supabase
        .from('context_mappings')
        .select('*')
        .eq('agentId', agentId)
        .eq('tool', tool)
        .eq('contextKey', contextKey)
        .maybeSingle();
      if (error) {
        console.error('Failed to get mapping from Supabase:', error);
        return undefined;
      }
      return data || undefined;
    }
    // If not in cache, get from Supabase
    const { data, error } = await supabase
      .from('context_mappings')
      .select('*')
      .eq('agentId', agentId)
      .eq('tool', tool)
      .eq('contextKey', contextKey)
      .maybeSingle();
    if (error) {
      console.error('Failed to get mapping from Supabase:', error);
      return undefined;
    }
    if (data) {
      // Update cache
      await redis.set(cacheKey, data.externalId);
      const reverseCacheKey = this.getReverseCacheKey(agentId, tool, data.externalId);
      await redis.set(reverseCacheKey, contextKey);
    }
    return data || undefined;
  }

  /**
   * Upsert a context mapping (create or update)
   * @param mapping Context mapping object
   * @returns Success status
   */
  public async upsertMapping(mapping: ContextMapping): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const mappingData = {
        ...mapping,
        updatedAt: now
      };

      // Upsert to Supabase
      const { error } = await supabase
        .from('context_mappings')
        .upsert(mappingData, {
          onConflict: 'agentId,tool,contextKey',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Failed to upsert mapping:', error);
        return false;
      }

      // Update cache
      const cacheKey = this.getCacheKey(mapping.agentId, mapping.tool, mapping.contextKey);
      const reverseCacheKey = this.getReverseCacheKey(mapping.agentId, mapping.tool, mapping.externalId);
      
      await Promise.all([
        redis.set(cacheKey, mapping.externalId),
        redis.set(reverseCacheKey, mapping.contextKey)
      ]);

      return true;
    } catch (error) {
      console.error('Failed to upsert mapping:', error);
      return false;
    }
  }

  /**
   * Delete a context mapping by agentId, tool, and contextKey
   * @param agentId Agent ID
   * @param tool Tool name
   * @param contextKey Context key
   * @returns Success status
   */
  public async deleteMapping(agentId: string, tool: string, contextKey: string): Promise<boolean>;
  /**
   * Delete a context mapping by ID
   * @param id Mapping ID
   * @returns Success status
   */
  public async deleteMapping(id: string): Promise<boolean>;
  public async deleteMapping(agentIdOrId: string, tool?: string, contextKey?: string): Promise<boolean> {
    if (tool && contextKey) {
      // Delete by agentId, tool, contextKey
      const agentId = agentIdOrId;
      
      // Get mapping to find externalId for cache
      const mapping = await this.getMapping(agentId, tool, contextKey);
      if (!mapping) {
        return false;
      }

      // Delete from Supabase
      const { error } = await supabase
        .from('context_mappings')
        .delete()
        .eq('agentId', agentId)
        .eq('tool', tool)
        .eq('contextKey', contextKey);

      if (error) {
        console.error('Failed to delete mapping:', error);
        return false;
      }

      // Clear from cache
      const cacheKey = this.getCacheKey(agentId, tool, contextKey);
      await redis.del(cacheKey);
      
      // Clear reverse lookup cache
      const reverseCacheKey = this.getReverseCacheKey(agentId, tool, mapping.externalId);
      await redis.del(reverseCacheKey);

      return true;
    } else {
      // Delete by ID (original implementation)
      const id = agentIdOrId;
      
      // Get the mapping first to clear cache
      const { data: mapping, error: fetchError } = await supabase
        .from('context_mappings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError || !mapping) {
        console.error('Failed to fetch mapping for deletion:', fetchError);
        return false;
      }
      
      // Delete from Supabase
      const { error } = await supabase
        .from('context_mappings')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Failed to delete context mapping:', error);
        return false;
      }
      
      // Clear from cache
      const cacheKey = this.getCacheKey(mapping.agentId, mapping.tool, mapping.contextKey);
      await redis.del(cacheKey);
      
      // Clear reverse lookup cache
      const reverseCacheKey = this.getReverseCacheKey(mapping.agentId, mapping.tool, mapping.externalId);
      await redis.del(reverseCacheKey);
      
      return true;
    }
  }

  /**
   * Bulk delete context mappings by agentId, tool, and contextKey
   */
  public async bulkDeleteMappings(keys: Array<{ agentId: string; tool: string; contextKey: string }>): Promise<number> {
    if (!keys.length) return 0;
    let deletedCount = 0;
    for (const { agentId, tool, contextKey } of keys) {
      const success = await this.deleteMapping(agentId, tool, contextKey);
      if (success) {
        deletedCount++;
      }
    }
    return deletedCount;
  }
}
