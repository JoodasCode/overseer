/**
 * AI Service for Overseer
 * Handles integration with OpenAI and other LLM providers
 */

import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { getAgentContext } from './agent-context';
import { CreditSystem } from './credit-system';
import { CacheManager } from './cache-manager';
import { KeyManager } from './key-manager';

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
  private creditSystem: CreditSystem;
  private cacheManager: CacheManager;
  private keyManager: KeyManager;
  
  constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.creditSystem = new CreditSystem();
    this.cacheManager = new CacheManager();
    this.keyManager = new KeyManager();
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
      
      // Convert OpenAI stream to ReadableStream
      const readableStream = openAIStreamToReadableStream(response);
      
      // Return streaming response
      return new StreamingTextResponse(readableStream);
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

  async createStreamingResponse(
    agentId: string,
    message: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    } = {}
  ) {
    const context = await getAgentContext(agentId);
    const model = options.model || 'gpt-4';
    
    // Check credits before proceeding
    await this.creditSystem.checkAndDeductCredits(agentId, model);

    const response = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: context.systemPrompt,
        },
        ...context.memory,
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      stream: true,
    });

    const stream = OpenAIStream(response, {
      onCompletion: async (completion) => {
        // Update agent memory with the interaction
        await this.updateAgentMemory(agentId, message, completion);
        
        // Cache the response for future similar queries
        await this.cacheManager.cacheResponse(agentId, message, completion);
      },
    });

    return new StreamingTextResponse(stream);
  }

  private async updateAgentMemory(
    agentId: string,
    userMessage: string,
    aiResponse: string
  ) {
    // Implementation for updating agent memory
    // This will be expanded in the agent memory system
  }
}

// Singleton instance
export const aiService = new AIService();

/**
 * Utility function to convert OpenAI's Stream to a standard web ReadableStream
 * This resolves the TypeScript error with StreamingTextResponse expecting a ReadableStream
 */
function openAIStreamToReadableStream(stream: AsyncIterable<ChatCompletionChunk>) {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
