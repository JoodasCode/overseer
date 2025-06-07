/**
 * Agent Context System for Overseer
 * Manages memory and context for AI agents
 */

import { prisma } from '../db/prisma';
import { Message } from './service';
import { KnowledgeContextProvider } from '../knowledge-base/knowledge-context-provider';

// Context source types
export enum ContextSourceType {
  MEMORY = 'memory',
  KNOWLEDGE_BASE = 'knowledge_base',
  INTEGRATION = 'integration',
  TOOL = 'tool',
}

// Context item interface
export interface ContextItem {
  type: ContextSourceType;
  content: string;
  source: string;
  relevanceScore?: number;
}

/**
 * Agent Context Manager class
 * Handles gathering and managing context for agent interactions
 */
export class AgentContextManager {
  private knowledgeProvider: KnowledgeContextProvider;
  
  constructor() {
    this.knowledgeProvider = new KnowledgeContextProvider();
  }
  
  /**
   * Get agent memory from database
   */
  private async getAgentMemory(agentId: string, limit: number = 10): Promise<ContextItem[]> {
    const memories = await prisma.agentMemory.findMany({
      where: { agentId },
      orderBy: { importance: 'desc' },
      take: limit,
    });
    
    return memories.map(memory => ({
      type: ContextSourceType.MEMORY,
      content: memory.content,
      source: 'agent_memory',
      relevanceScore: memory.importance,
    }));
  }
  
  /**
   * Get knowledge base context based on conversation
   */
  private async getKnowledgeContext(
    userId: string,
    messages: Message[],
    limit: number = 5
  ): Promise<ContextItem[]> {
    try {
      // @ts-ignore - Method exists but TypeScript doesn't recognize it
      const knowledgeContext = await this.knowledgeProvider.getKnowledgeContextForChat({
        userId,
        messages,
        maxResults: limit,
      });
      
      if (!knowledgeContext || !knowledgeContext.results) {
        return [];
      }
      
      return knowledgeContext.results.map(item => ({
        type: ContextSourceType.KNOWLEDGE_BASE,
        content: item.content,
        source: item.source || 'knowledge_base',
        relevanceScore: item.score,
      }));
    } catch (error) {
      console.error('Error fetching knowledge context:', error);
      return [];
    }
  }
  
  /**
   * Get context from integrations (placeholder for future implementation)
   */
  private async getIntegrationContext(
    userId: string,
    query: string,
    limit: number = 3
  ): Promise<ContextItem[]> {
    // This would be implemented when integration adapters are ready
    return [];
  }
  
  /**
   * Build system prompt with agent personality and context
   */
  public async buildSystemPrompt(
    agentId: string,
    userId: string
  ): Promise<string> {
    // Get agent details
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });
    
    if (!agent) {
      throw new Error('Agent not found');
    }
    
    // Base system prompt with agent personality
    let systemPrompt = agent.systemPrompt || 'You are a helpful AI assistant.';
    
    // Add agent personality traits if available
    if (agent.personality) {
      systemPrompt += `\n\nPersonality: ${agent.personality}`;
    }
    
    return systemPrompt;
  }
  
  /**
   * Get context for a conversation
   */
  public async getContextForConversation(
    agentId: string,
    userId: string,
    messages: Message[]
  ): Promise<ContextItem[]> {
    // Get the most recent user message for context gathering
    const userMessages = messages.filter(m => m.role === 'user');
    const latestUserMessage = userMessages.length > 0 
      ? userMessages[userMessages.length - 1].content 
      : '';
    
    // Gather context from different sources
    const [memoryContext, knowledgeContext, integrationContext] = await Promise.all([
      this.getAgentMemory(agentId),
      this.getKnowledgeContext(userId, messages),
      this.getIntegrationContext(userId, latestUserMessage),
    ]);
    
    // Combine all context items
    const allContext = [
      ...memoryContext,
      ...knowledgeContext,
      ...integrationContext,
    ];
    
    // Sort by relevance score if available
    return allContext.sort((a, b) => {
      const scoreA = a.relevanceScore || 0;
      const scoreB = b.relevanceScore || 0;
      return scoreB - scoreA;
    });
  }
  
  /**
   * Format context items as a string for inclusion in prompts
   */
  public formatContextForPrompt(contextItems: ContextItem[]): string {
    if (contextItems.length === 0) {
      return '';
    }
    
    let contextString = '\n\nRelevant Context:\n';
    
    contextItems.forEach((item, index) => {
      contextString += `[${item.type}] ${item.content}\n`;
    });
    
    return contextString;
  }
  
  /**
   * Save a new memory for an agent
   */
  public async saveAgentMemory(
    agentId: string,
    content: string,
    importance: number = 0.5
  ): Promise<void> {
    await prisma.agentMemory.create({
      data: {
        agentId,
        content,
        importance,
        createdAt: new Date(),
      },
    });
  }
}

// Singleton instance
export const agentContextManager = new AgentContextManager();
