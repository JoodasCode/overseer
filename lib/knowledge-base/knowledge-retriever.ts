import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { ErrorHandler } from '@/lib/plugin-engine/error-handler';

// Initialize error handler
const errorHandler = ErrorHandler.getInstance();

// Initialize OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define error logging helper
const logError = (error: unknown, action: string) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  errorHandler.logError({
    tool: 'knowledge-retriever',
    action,
    errorCode: 'KNOWLEDGE_RETRIEVAL_ERROR',
    errorMessage: errorMessage,
    agentId: 'system',
    userId: 'system',
    payload: { details: JSON.stringify(error) },
    timestamp: new Date().toISOString(),
    resolved: false
  }).catch(console.error);
};

/**
 * Knowledge retriever for semantic search
 */
export class KnowledgeRetriever {
  /**
   * Retrieve relevant knowledge for a query
   * @param query The search query
   * @param userId The user ID to search within their knowledge base
   * @param limit Maximum number of results to return
   * @returns Array of relevant knowledge items
   */
  public static async retrieveKnowledge(query: string, userId: string, limit: number = 5): Promise<any[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      if (!queryEmbedding || queryEmbedding.length === 0) {
        throw new Error('Failed to generate embedding for query');
      }
      
      // Perform vector search in the database
      // Note: This requires pgvector extension to be enabled in the database
      const results = await prisma.$queryRaw`
        SELECT 
          id, 
          title, 
          content,
          content_type,
          metadata,
          created_at,
          updated_at,
          1 - (embedding <=> ${queryEmbedding}::vector) as similarity
        FROM knowledge_base
        WHERE 
          user_id = ${userId}
          AND embedding IS NOT NULL
          AND (metadata->>'processingStatus')::text IS NULL OR (metadata->>'processingStatus')::text = 'completed'
        ORDER BY similarity DESC
        LIMIT ${limit};
      `;
      
      return results as any[];
    } catch (error) {
      logError(error, 'retrieveKnowledge');
      return [];
    }
  }
  
  /**
   * Generate embedding for a text
   * @param text The text to generate embedding for
   * @returns The embedding vector
   */
  private static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error) {
      logError(error, 'generateEmbedding');
      return [];
    }
  }
  
  /**
   * Search knowledge base by keyword
   * @param query The search query
   * @param userId The user ID to search within their knowledge base
   * @param limit Maximum number of results to return
   * @returns Array of matching knowledge items
   */
  public static async searchByKeyword(query: string, userId: string, limit: number = 10): Promise<any[]> {
    try {
      // Perform text search in the database
      const results = await prisma.knowledgeBase.findMany({
        where: {
          user_id: userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
          metadata: {
            path: ['processingStatus'],
            not: 'error',
          },
        },
        orderBy: {
          updated_at: 'desc',
        },
        take: limit,
      });
      
      return results;
    } catch (error) {
      logError(error, 'searchByKeyword');
      return [];
    }
  }
  
  /**
   * Get knowledge context for an agent
   * @param query The current query or conversation context
   * @param userId The user ID to search within their knowledge base
   * @param maxTokens Maximum number of tokens to include in context
   * @returns Formatted knowledge context for the agent
   */
  public static async getKnowledgeContext(query: string, userId: string, maxTokens: number = 1500): Promise<string> {
    try {
      // Retrieve relevant knowledge
      const relevantKnowledge = await this.retrieveKnowledge(query, userId, 3);
      
      if (relevantKnowledge.length === 0) {
        return '';
      }
      
      // Format knowledge context
      let context = '--- KNOWLEDGE BASE CONTEXT ---\n\n';
      let totalLength = 0;
      
      for (const item of relevantKnowledge) {
        // Estimate token count (roughly 4 chars per token)
        const itemLength = (item.title.length + item.content.length) / 4;
        
        if (totalLength + itemLength > maxTokens) {
          // Truncate content to fit within token limit
          const availableTokens = maxTokens - totalLength - item.title.length / 4 - 20; // 20 tokens for formatting
          const truncatedContent = item.content.substring(0, Math.max(0, availableTokens * 4));
          
          context += `TITLE: ${item.title}\n`;
          context += `CONTENT: ${truncatedContent}...(truncated)\n\n`;
          break;
        }
        
        context += `TITLE: ${item.title}\n`;
        context += `CONTENT: ${item.content}\n\n`;
        totalLength += itemLength;
      }
      
      context += '--- END OF KNOWLEDGE BASE CONTEXT ---\n\n';
      return context;
    } catch (error) {
      logError(error, 'getKnowledgeContext');
      return '';
    }
  }
}
