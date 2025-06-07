import { KnowledgeRetriever } from './knowledge-retriever';
import { ErrorHandler } from '@/lib/plugin-engine/error-handler';

// Initialize error handler
const errorHandler = ErrorHandler.getInstance();

// Define error logging helper
const logError = (error: unknown, action: string) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  errorHandler.logError({
    tool: 'knowledge-context-provider',
    action,
    errorCode: 'KNOWLEDGE_CONTEXT_ERROR',
    errorMessage: errorMessage,
    agentId: 'system',
    userId: 'system',
    payload: { details: JSON.stringify(error) },
    timestamp: new Date().toISOString(),
    resolved: false
  }).catch(console.error);
};

/**
 * Knowledge context provider for chat system
 */
export class KnowledgeContextProvider {
  /**
   * Get knowledge context for a chat message
   * @param message The user's message
   * @param userId The user ID
   * @param agentId The agent ID
   * @param conversationHistory Previous conversation history (optional)
   * @returns Knowledge context to include in the prompt
   */
  public static async getContextForMessage(
    message: string,
    userId: string,
    agentId: string,
    conversationHistory: string[] = []
  ): Promise<string> {
    try {
      // Combine message with recent conversation history for better context
      const contextQuery = this.buildContextQuery(message, conversationHistory);
      
      // Get knowledge context
      const knowledgeContext = await KnowledgeRetriever.getKnowledgeContext(
        contextQuery,
        userId,
        1500 // Max tokens for context
      );
      
      return knowledgeContext;
    } catch (error) {
      logError(error, 'getContextForMessage');
      return '';
    }
  }
  
  /**
   * Build a context query from the message and conversation history
   * @param message The current message
   * @param conversationHistory Previous conversation history
   * @returns A combined query for context retrieval
   */
  private static buildContextQuery(message: string, conversationHistory: string[] = []): string {
    // If no history, just use the message
    if (conversationHistory.length === 0) {
      return message;
    }
    
    // Take the last 3 messages from history for context
    const recentHistory = conversationHistory.slice(-3);
    
    // Combine with the current message
    return [...recentHistory, message].join(' ');
  }
  
  /**
   * Enhance a prompt with knowledge context
   * @param prompt The original prompt
   * @param userId The user ID
   * @param agentId The agent ID
   * @param message The user's message
   * @param conversationHistory Previous conversation history
   * @returns Enhanced prompt with knowledge context
   */
  public static async enhancePromptWithKnowledge(
    prompt: string,
    userId: string,
    agentId: string,
    message: string,
    conversationHistory: string[] = []
  ): Promise<string> {
    try {
      // Get knowledge context
      const knowledgeContext = await this.getContextForMessage(
        message,
        userId,
        agentId,
        conversationHistory
      );
      
      // If no knowledge context, return original prompt
      if (!knowledgeContext) {
        return prompt;
      }
      
      // Insert knowledge context before the user's message
      // Look for a placeholder or insert at a logical position
      if (prompt.includes('{{KNOWLEDGE_CONTEXT}}')) {
        return prompt.replace('{{KNOWLEDGE_CONTEXT}}', knowledgeContext);
      } else {
        // Find a good insertion point - typically before the user's message
        // This is a simplified approach - in a real system, you'd have a more structured prompt
        const userMessageMarker = 'USER:';
        const userMessageIndex = prompt.lastIndexOf(userMessageMarker);
        
        if (userMessageIndex !== -1) {
          return prompt.slice(0, userMessageIndex) + 
                 knowledgeContext + 
                 prompt.slice(userMessageIndex);
        } else {
          // If we can't find a good insertion point, just prepend
          return knowledgeContext + prompt;
        }
      }
    } catch (error) {
      logError(error, 'enhancePromptWithKnowledge');
      return prompt; // Return original prompt on error
    }
  }
}
