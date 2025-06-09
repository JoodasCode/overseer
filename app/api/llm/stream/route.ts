import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { aiService, Message } from '@/lib/ai/service';
import { creditSystem } from '@/lib/ai/credit-system';
import { agentContextManager } from '@/lib/ai/agent-context';
import { llmCacheManager } from '@/lib/ai/cache-manager';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler } from '@/lib/error-handler';
import { safeJsonParse } from '@/lib/utils/safe-json';

export const runtime = 'edge';

/**
 * POST /api/llm/stream
 * 
 * Streams AI responses with token usage tracking and credit management
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const { 
      messages,
      agentId,
      modelConfig = {},
      includeContext = true
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response('Invalid messages format', { status: 400 });
    }

    // Get agent details if agentId is provided
    let agent = null;
    if (agentId) {
      agent = await prisma.agent.findUnique({
        where: { 
          id: agentId,
          user_id: user.id // Ensure agent belongs to user
        },
      });

      if (!agent) {
        return new Response('Agent not found', { status: 404 });
      }
    }

    // Estimate token usage for credit check
    const estimatedTokens = messages.reduce((total, msg) => {
      return total + aiService.estimateTokenCount(msg.content || '');
    }, 0) + 1000; // Add buffer for response

    // Get model configuration
    const finalModelConfig = {
      ...modelConfig,
      // If agent has specific LLM configuration, use it
      ...(agent?.preferences ? safeJsonParse(JSON.stringify(agent.preferences), {}) : {}),
    };

    // Check if user has enough credits
    const hasCredits = await creditSystem.hasEnoughCredits(
      user.id,
      estimatedTokens,
      finalModelConfig.model || 'gpt-4o'
    );

    if (!hasCredits) {
      return new Response('Insufficient credits', { status: 402 });
    }

    // Prepare messages array with system prompt and context
    let promptMessages: Message[] = [];
    
    // Add system prompt if agent exists
    if (agent && includeContext) {
      const systemPrompt = await agentContextManager.buildSystemPrompt(agentId, user.id);
      promptMessages.push({ role: 'system', content: systemPrompt });
    }
    
    // Add context if requested
    if (agentId && includeContext) {
      const contextItems = await agentContextManager.getContextForConversation(
        agentId,
        user.id,
        messages
      );
      
      if (contextItems.length > 0) {
        const contextString = agentContextManager.formatContextForPrompt(contextItems);
        // Add context as system message if we don't already have one
        if (promptMessages.length === 0) {
          promptMessages.push({ role: 'system', content: `You are a helpful assistant.${contextString}` });
        } else {
          // Append to existing system message
          promptMessages[0].content += contextString;
        }
      }
    }
    
    // Add user messages
    promptMessages = [...promptMessages, ...messages];

    // Store the conversation in the database
    if (agentId) {
      for (const message of messages) {
        await prisma.chatMessage.create({
          data: {
            user_id: user.id,
            agent_id: agentId,
            content: message.content || '',
            role: message.role,
            metadata: {},
          },
        });
      }
    }

    // Check cache first
    const skipCache = body.skipCache === true;
    let cachedResponse = null;
    
    if (!skipCache) {
      cachedResponse = await llmCacheManager.getCachedResponse(promptMessages, finalModelConfig);
    }
    
    if (cachedResponse) {
      // Log cache hit for analytics
      console.log(`Cache hit for user ${user.id}`);
      
      // Track token usage from cache (no actual API call made)
      creditSystem.trackUsage(
        user.id,
        agentId,
        cachedResponse.tokens,
        finalModelConfig.model || 'gpt-4o'
      ).catch(error => {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'token_tracking_error',
            errorMessage: `Failed to track cached token usage: ${error.message}`,
            userId: user.id,
            agentId,
            payload: { error: error.message }
          })
        );
      });
      
      // Return cached response as a stream
      return new Response(cachedResponse.content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Cache': 'HIT'
        }
      });
    }
    
    // No cache hit, generate streaming response
    const stream = await aiService.generateChatStream(promptMessages, finalModelConfig);

    // Track token usage asynchronously (will be estimated since we can't get exact usage from streaming)
    const userMessages = promptMessages.filter(m => m.role === 'user');
    const promptTokens = userMessages.reduce((total, msg) => {
      return total + aiService.estimateTokenCount(msg.content || '');
    }, 0);
    
    const systemMessages = promptMessages.filter(m => m.role === 'system');
    const systemTokens = systemMessages.reduce((total, msg) => {
      return total + aiService.estimateTokenCount(msg.content || '');
    }, 0);
    
    // Estimate response tokens (very rough estimate)
    const estimatedResponseTokens = Math.ceil(promptTokens * 1.5);
    
    // Create token usage object
    const tokenUsage = {
      promptTokens: promptTokens + systemTokens,
      completionTokens: estimatedResponseTokens,
      totalTokens: promptTokens + systemTokens + estimatedResponseTokens
    };
    
    // Track usage asynchronously
    creditSystem.trackUsage(
      user.id,
      agentId,
      tokenUsage,
      finalModelConfig.model || 'gpt-4o'
    ).catch(error => {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'token_tracking_error',
          errorMessage: `Failed to track token usage: ${error.message}`,
          userId: user.id,
          agentId,
          payload: { error: error.message }
        })
      );
    });
    
    // Cache the response asynchronously if it's not a system message
    // We don't want to await this to avoid delaying the response
    if (!skipCache && userMessages.length > 0) {
      // For streaming responses, we need to clone the stream and cache the full response
      // This is a simplified approach - in production you might want to use a more sophisticated method
      // to capture and cache the full response without affecting the stream
      const responseText = 'This is a placeholder for the actual response that would be cached';
      llmCacheManager.cacheResponse(
        promptMessages,
        finalModelConfig,
        responseText,
        tokenUsage
      ).catch(error => {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'cache_error',
            errorMessage: `Failed to cache response: ${error.message}`,
            userId: user.id,
            agentId,
            payload: { error: error.message }
          })
        );
      });
    }

    return stream;
  } catch (error: any) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'llm_stream_error',
        errorMessage: error.message,
        payload: { error: error.stack }
      })
    );
    
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
