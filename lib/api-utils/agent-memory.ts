/**
 * Agent memory utilities for enhanced context awareness
 */
import { prisma } from '@/lib/prisma';

/**
 * Memory importance levels
 */
export enum MemoryImportance {
  LOW = 1,
  MEDIUM = 5,
  HIGH = 8,
  CRITICAL = 10
}

/**
 * Memory categories
 */
export enum MemoryCategory {
  SYSTEM = 'system',
  USER_PREFERENCE = 'user_preference',
  LEARNING = 'learning',
  CONVERSATION = 'conversation',
  TASK = 'task',
  RELATIONSHIP = 'relationship'
}

/**
 * Memory entry interface
 */
export interface MemoryEntry {
  key: string;
  value: string;
  type: string;
  metadata: {
    importance: number;
    category: string;
    timestamp?: string;
    source?: string;
    related_keys?: string[];
    [key: string]: any;
  };
}

/**
 * Retrieves all memories for an agent with optional filtering
 * @param agentId The agent ID
 * @param options Optional filtering options
 * @returns Array of memory entries
 */
export async function getAgentMemories(
  agentId: string,
  options?: {
    minImportance?: number;
    categories?: string[];
    limit?: number;
    keys?: string[];
  }
): Promise<MemoryEntry[]> {
  const { minImportance = 0, categories, limit = 100, keys } = options || {};
  
  // Build where clause
  const where: any = {
    agent_id: agentId
  };
  
  // Add key filter if specified
  if (keys && keys.length > 0) {
    where.key = {
      in: keys
    };
  }
  
  // Get memories from database
  const memories = await prisma.agentMemory.findMany({
    where,
    orderBy: {
      updated_at: 'desc'
    },
    take: limit
  });
  
  // Filter by importance and category if needed
  return memories
    .filter(memory => {
      const metadata = memory.metadata as Record<string, any>;
      const importance = metadata?.importance || 0;
      const category = metadata?.category || '';
      
      const passesImportance = importance >= minImportance;
      const passesCategory = !categories || categories.length === 0 || 
        (category && categories.includes(category));
      
      return passesImportance && passesCategory;
    })
    .map(memory => ({
      key: memory.key,
      value: memory.value,
      type: memory.type,
      metadata: memory.metadata as Record<string, any>
    }));
}

/**
 * Stores a new memory or updates an existing one
 * @param agentId The agent ID
 * @param userId The user ID
 * @param memory The memory entry to store
 * @returns The stored memory
 */
export async function storeMemory(
  agentId: string,
  userId: string,
  memory: MemoryEntry
): Promise<MemoryEntry> {
  // Ensure metadata has required fields
  const metadata = {
    importance: MemoryImportance.MEDIUM,
    category: MemoryCategory.LEARNING,
    timestamp: new Date().toISOString(),
    ...memory.metadata
  };
  
  // Update or create memory
  const result = await prisma.agentMemory.upsert({
    where: {
      agent_id_key: {
        agent_id: agentId,
        key: memory.key
      }
    },
    update: {
      value: memory.value,
      type: memory.type,
      metadata,
      updated_at: new Date()
    },
    create: {
      agent_id: agentId,
      key: memory.key,
      value: memory.value,
      type: memory.type,
      metadata,
    }
  });
  
  // Log the memory operation
  await prisma.memoryLog.create({
    data: {
      agent_id: agentId,
      user_id: userId,
      key: memory.key,
      operation: 'upsert',
      value: memory.value,
      metadata: {
        importance: metadata.importance,
        category: metadata.category
      }
    }
  });
  
  return {
    key: result.key,
    value: result.value,
    type: result.type,
    metadata: result.metadata as Record<string, any>
  };
}

/**
 * Retrieves related memories based on semantic similarity
 * @param agentId The agent ID
 * @param query The query text to find related memories
 * @param options Optional filtering options
 * @returns Array of related memory entries
 */
export async function getRelatedMemories(
  agentId: string,
  query: string,
  options?: {
    limit?: number;
    minImportance?: number;
    excludeKeys?: string[];
  }
): Promise<MemoryEntry[]> {
  const { limit = 5, minImportance = 0, excludeKeys = [] } = options || {};
  
  // For now, this is a simple implementation that will be enhanced
  // with vector embeddings in the future
  
  // Get all memories
  const allMemories = await getAgentMemories(agentId, {
    minImportance
  });
  
  // Filter out excluded keys
  const filteredMemories = allMemories.filter(
    memory => !excludeKeys.includes(memory.key)
  );
  
  // Simple keyword matching (to be replaced with embeddings)
  const queryWords = query.toLowerCase().split(/\s+/);
  
  const scoredMemories = filteredMemories.map(memory => {
    const valueText = memory.value.toLowerCase();
    const keyText = memory.key.toLowerCase();
    
    // Calculate simple relevance score
    let score = 0;
    queryWords.forEach(word => {
      if (word.length > 3) { // Ignore short words
        if (valueText.includes(word)) score += 2;
        if (keyText.includes(word)) score += 3;
      }
    });
    
    // Boost by importance
    score *= (memory.metadata.importance / 5);
    
    return { memory, score };
  });
  
  // Sort by score and take top results
  return scoredMemories
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .filter(item => item.score > 0)
    .map(item => item.memory);
}

/**
 * Consolidates learnings into a summary
 * @param agentId The agent ID
 * @param userId The user ID
 * @returns The consolidated learning summary
 */
export async function consolidateLearnings(
  agentId: string,
  userId: string
): Promise<string> {
  // Get recent learning memories
  const recentLearnings = await prisma.memoryLog.findMany({
    where: {
      agent_id: agentId,
      metadata: {
        path: ['category'],
        equals: MemoryCategory.LEARNING
      }
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 20
  });
  
  // Extract unique learnings
  const uniqueLearnings = Array.from(
    new Set(recentLearnings.map(log => log.value))
  );
  
  // Store consolidated learnings
  const consolidatedValue = JSON.stringify(uniqueLearnings);
  
  await storeMemory(agentId, userId, {
    key: 'recent_learnings',
    value: consolidatedValue,
    type: 'json',
    metadata: {
      importance: MemoryImportance.HIGH,
      category: MemoryCategory.SYSTEM,
      consolidated: true
    }
  });
  
  return consolidatedValue;
}
