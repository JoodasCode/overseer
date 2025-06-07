/**
 * AI Service for Overseer
 * Handles integration with OpenAI and other LLM providers
 */

import { OpenAI } from 'openai';
import { StreamingTextResponse } from 'ai';

// Define provider types
export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'mistral';

// Model configuration interface
export interface ModelConfig {
  provider: LLMProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

// Default model configuration
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  provider: 'openai',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.95,
};

// Message format for chat
export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: any[];
}

// Token usage tracking
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * AI Service class for handling LLM interactions
 */
export class AIService {
  private openai: OpenAI;
  
  constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  /**
   * Get token count estimate for a string
   * This is a simple approximation - for production, use a proper tokenizer
   */
  public estimateTokenCount(text: string): number {
    // Approximate tokens (4 chars ~= 1 token for English text)
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Generate a streaming chat response
   */
  public async generateChatStream(
    messages: Message[],
    config: Partial<ModelConfig> = {}
  ) {
    // Merge with default config
    const modelConfig = { ...DEFAULT_MODEL_CONFIG, ...config };
    
    // For now, we only support OpenAI
    if (modelConfig.provider === 'openai') {
      const response = await this.openai.chat.completions.create({
        model: modelConfig.model,
        messages: messages as any[],
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
        top_p: modelConfig.topP,
        stream: true,
      });
      
      // Return streaming response
      return new StreamingTextResponse(response);
    }
    
    throw new Error(`Provider ${modelConfig.provider} not supported yet`);
  }
  
  /**
   * Generate a chat completion (non-streaming)
   */
  public async generateChatCompletion(
    messages: Message[],
    config: Partial<ModelConfig> = {}
  ) {
    // Merge with default config
    const modelConfig = { ...DEFAULT_MODEL_CONFIG, ...config };
    
    // For now, we only support OpenAI
    if (modelConfig.provider === 'openai') {
      const response = await this.openai.chat.completions.create({
        model: modelConfig.model,
        messages: messages as any[],
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
        top_p: modelConfig.topP,
      });
      
      // Track token usage
      const usage: TokenUsage = {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      };
      
      return {
        content: response.choices[0].message.content,
        usage,
      };
    }
    
    throw new Error(`Provider ${modelConfig.provider} not supported yet`);
  }
}

// Singleton instance
export const aiService = new AIService();
