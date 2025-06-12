import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface KnowledgeItem {
  id: string
  title: string
  content: string
  content_type: string
  metadata: any
  created_at: string
  updated_at: string
}

/**
 * Supabase-compatible knowledge retriever for agents
 */
export class SupabaseKnowledgeRetriever {
  /**
   * Search knowledge base by keyword for a specific user
   */
  static async searchByKeyword(query: string, userId: string, limit: number = 5): Promise<KnowledgeItem[]> {
    try {
      const { data, error } = await supabase
        .from('KnowledgeBase')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error searching knowledge base:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in searchByKeyword:', error)
      return []
    }
  }

  /**
   * Get all knowledge entries for a user
   */
  static async getAllKnowledge(userId: string, limit: number = 10): Promise<KnowledgeItem[]> {
    try {
      const { data, error } = await supabase
        .from('KnowledgeBase')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching all knowledge:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllKnowledge:', error)
      return []
    }
  }

  /**
   * Get knowledge context for an agent based on query
   */
  static async getKnowledgeContext(query: string, userId: string, maxTokens: number = 1500): Promise<string> {
    try {
      // First try keyword search
      let relevantKnowledge = await this.searchByKeyword(query, userId, 3)
      
      // If no results from keyword search, get recent knowledge
      if (relevantKnowledge.length === 0) {
        relevantKnowledge = await this.getAllKnowledge(userId, 3)
      }

      if (relevantKnowledge.length === 0) {
        return ''
      }

      // Format knowledge context
      let context = '--- KNOWLEDGE BASE CONTEXT ---\n\n'
      let totalLength = 0

      for (const item of relevantKnowledge) {
        // Estimate token count (roughly 4 chars per token)
        const itemLength = (item.title.length + item.content.length) / 4

        if (totalLength + itemLength > maxTokens) {
          // Truncate content to fit within token limit
          const availableTokens = maxTokens - totalLength - item.title.length / 4 - 20 // 20 tokens for formatting
          const truncatedContent = item.content.substring(0, Math.max(0, availableTokens * 4))

          context += `DOCUMENT: ${item.title}\n`
          context += `CONTENT: ${truncatedContent}...(truncated)\n\n`
          break
        }

        context += `DOCUMENT: ${item.title}\n`
        context += `CONTENT: ${item.content}\n\n`
        totalLength += itemLength
      }

      context += '--- END OF KNOWLEDGE BASE CONTEXT ---\n\n'
      return context
    } catch (error) {
      console.error('Error getting knowledge context:', error)
      return ''
    }
  }

  /**
   * Quick check if user has any knowledge base content
   */
  static async hasKnowledge(userId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('KnowledgeBase')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (error) {
        console.error('Error checking knowledge existence:', error)
        return false
      }

      return (count || 0) > 0
    } catch (error) {
      console.error('Error in hasKnowledge:', error)
      return false
    }
  }
} 