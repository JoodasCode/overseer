/**
 * Subscription Utilities
 * Helper functions for subscription management and enforcement
 */

import { prisma } from '@/lib/db/prisma';
import { SUBSCRIPTION_PLANS } from './stripe-service';
import { ErrorHandler } from '@/lib/error-handler';
import { USAGE_LIMITS } from '@/app/api/billing/subscription/limits/route';

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid';

export interface SubscriptionInfo {
  planTier: string;
  status: SubscriptionStatus;
  isActive: boolean;
  periodEnd: Date | null;
  quantity: number;
  monthlyCredits: number;
  trialEnd: Date | null;
  isInTrial: boolean;
  daysUntilRenewal: number | null;
}

export interface UsageLimits {
  prompt_credits: number;
  agents: number;
  workflows: number;
  batch_jobs: number;
  plugin_integrations: number;
  api_keys: number;
}

/**
 * Get detailed subscription information for a user
 */
export async function getSubscriptionInfo(userId: string): Promise<SubscriptionInfo | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan_tier: true,
        subscription_status: true,
        subscription_period_end: true,
        subscription_quantity: true,
        trial_end: true,
      },
    });

    if (!user) {
      return null;
    }

    // Default to FREE plan if no plan is set
    const planTier = user.plan_tier || 'FREE';
    const status = (user.subscription_status || 'active') as SubscriptionStatus;
    const quantity = user.subscription_quantity || 1;
    const periodEnd = user.subscription_period_end;
    const trialEnd = user.trial_end;

    // Calculate if subscription is active
    const isActive = ['active', 'trialing'].includes(status);
    
    // Calculate monthly credits based on plan and quantity
    const monthlyCredits = SUBSCRIPTION_PLANS[planTier]?.monthlyCredits * quantity || 
                          SUBSCRIPTION_PLANS.FREE.monthlyCredits;
    
    // Calculate if user is in trial period
    const now = new Date();
    const isInTrial = status === 'trialing' && trialEnd ? trialEnd > now : false;
    
    // Calculate days until renewal
    const daysUntilRenewal = periodEnd 
      ? Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      planTier,
      status,
      isActive,
      periodEnd,
      quantity,
      monthlyCredits,
      trialEnd,
      isInTrial,
      daysUntilRenewal,
    };
  } catch (error: any) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'get_subscription_info_error',
        errorMessage: `Failed to get subscription info: ${error.message}`,
        userId,
        payload: { error: error.message }
      })
    );
    
    return null;
  }
}

/**
 * Check if a user has reached their usage limit for a specific resource
 */
export async function checkUsageLimit(
  userId: string, 
  resourceType: keyof UsageLimits
): Promise<{ 
  withinLimits: boolean; 
  limit: number; 
  currentUsage: number; 
  remaining: number;
}> {
  try {
    // Get user's subscription info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan_tier: true,
        subscription_quantity: true,
        credits_added: true,
        credits_used: true,
      },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Default to FREE plan if no plan is set
    const planTier = user.plan_tier || 'FREE';
    const quantity = user.subscription_quantity || 1;
    
    // Get the usage limits for the user's plan
    const planLimits = USAGE_LIMITS[planTier as keyof typeof USAGE_LIMITS];
    
    // Special case for prompt_credits
    if (resourceType === 'prompt_credits') {
      const creditsAdded = user.credits_added || 0;
      const creditsUsed = user.credits_used || 0;
      const remaining = Math.max(0, creditsAdded - creditsUsed);
      
      return {
        withinLimits: creditsUsed < creditsAdded,
        limit: creditsAdded,
        currentUsage: creditsUsed,
        remaining,
      };
    }
    
    // For TEAMS and ENTERPRISE plans, multiply limits by quantity
    const multiplier = (planTier === 'TEAMS' || planTier === 'ENTERPRISE') ? quantity : 1;
    
    // Calculate the limit for the resource
    const limit = planLimits[resourceType] * multiplier;
    
    // Get current usage for the resource
    let currentUsage = 0;
    
    switch (resourceType) {
      case 'agents':
        // Get current active agent count
        currentUsage = await prisma.agent.count({
          where: {
            userId,
            status: 'ACTIVE',
          },
        });
        break;
        
      case 'workflows':
        // Get current workflow count
        currentUsage = await prisma.workflow.count({
          where: {
            userId,
          },
        });
        break;
        
      case 'batch_jobs':
        // Get current batch job count
        currentUsage = await prisma.batchJob.count({
          where: {
            userId,
            status: 'PROCESSING',
          },
        });
        break;
        
      case 'plugin_integrations':
        // Get current plugin integration count
        currentUsage = await prisma.pluginIntegration.count({
          where: {
            userId,
            active: true,
          },
        });
        break;
        
      case 'api_keys':
        // Get current API key count
        currentUsage = await prisma.apiKey.count({
          where: {
            userId,
            active: true,
          },
        });
        break;
        
      default:
        // Should never reach here due to TypeScript, but just in case
        ErrorHandler.logError({
          errorCode: 'invalid_resource_type',
          errorMessage: `Invalid resource type: ${resourceType}`,
          userId,
          payload: { resourceType }
        });
        break;
    }
    
    const remaining = Math.max(0, limit - currentUsage);
    const withinLimits = currentUsage < limit;
    // Log if limit is reached
    if (!withinLimits) {
      ErrorHandler.logError({
        errorCode: 'subscription_limit_reached',
        errorMessage: `User ${userId} has reached the ${resourceType} limit for ${planTier} plan`,
        userId,
        payload: { 
          resourceType,
          planTier,
          limit,
          currentUsage
        }
      });
    }
    
    return {
      withinLimits,
      limit,
      currentUsage,
      remaining,
    };
  } catch (error: any) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'check_usage_limit_error',
        errorMessage: `Failed to check usage limit: ${error.message}`,
        userId,
        payload: { error: error.message, resourceType }
      })
    );
    
    // Default to no limit exceeded in case of error
    return {
      withinLimits: true,
      limit: 0,
      currentUsage: 0,
      remaining: 0,
    };
  }
}

/**
 * Record resource usage for a user
 */
export async function recordResourceUsage(
  userId: string,
  resourceType: keyof UsageLimits,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  try {
    // Check if usage is within limits first
    const { withinLimits } = await checkUsageLimit(userId, resourceType);
    
    if (!withinLimits) {
      return false;
    }
    
    // For all resource types, create a usage log entry for tracking
    await prisma.usageLog.create({
      data: {
        userId,
        resourceType,
        metadata,
      },
    });
    
    // For prompt_credits, update the user's credit usage
    if (resourceType === 'prompt_credits' && metadata.credits) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits_used: {
            increment: metadata.credits,
          },
        },
      });
    }
    
    return true;
  } catch (error: any) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'record_resource_usage_error',
        errorMessage: `Failed to record resource usage: ${error.message}`,
        userId,
        payload: { error: error.message, resourceType, metadata }
      })
    );
    
    return false;
  }
}

/**
 * Get all usage limits for a user
 */
export async function getAllUsageLimits(userId: string): Promise<{
  limits: UsageLimits;
  usage: UsageLimits;
  remaining: UsageLimits;
}> {
  try {
    // Get user's subscription info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan_tier: true,
        subscription_quantity: true,
        credits_added: true,
        credits_used: true,
      },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Default to FREE plan if no plan is set
    const planTier = user.plan_tier || 'FREE';
    const quantity = user.subscription_quantity || 1;
    
    // Get the usage limits for the user's plan
    const planLimits = USAGE_LIMITS[planTier as keyof typeof USAGE_LIMITS];
    
    // For TEAMS and ENTERPRISE plans, multiply limits by quantity
    const multiplier = (planTier === 'TEAMS' || planTier === 'ENTERPRISE') ? quantity : 1;
    
    // Calculate actual limits
    const limits = {
      prompt_credits: (user.credits_added || 0), // For credits, the limit is what's been added
      agents: planLimits.agents * multiplier,
      workflows: planLimits.workflows * multiplier,
      batch_jobs: planLimits.batch_jobs * multiplier,
      plugin_integrations: planLimits.plugin_integrations * multiplier,
      api_keys: planLimits.api_keys * multiplier,
    };
    
    // Get current usage for agents
    const agentCount = await prisma.agent.count({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });
    
    // Get current workflow count
    const workflowCount = await prisma.workflow.count({
      where: {
        userId,
      },
    });
    
    // Get current API key count
    const apiKeyCount = await prisma.apiKey.count({
      where: {
        userId,
        active: true,
      },
    });
    
    // Get current batch job count
    const batchJobCount = await prisma.batchJob.count({
      where: {
        userId,
        status: 'PROCESSING',
      },
    });
    
    // Get current plugin integration count
    const pluginCount = await prisma.pluginIntegration.count({
      where: {
        userId,
        active: true,
      },
    });
    
    // Current usage
    const usage = {
      prompt_credits: user.credits_used || 0,
      agents: agentCount,
      workflows: workflowCount,
      batch_jobs: batchJobCount,
      plugin_integrations: pluginCount,
      api_keys: apiKeyCount,
    };
    
    // Calculate remaining usage
    const remaining = {
      prompt_credits: Math.max(0, limits.prompt_credits - usage.prompt_credits),
      agents: Math.max(0, limits.agents - usage.agents),
      workflows: Math.max(0, limits.workflows - usage.workflows),
      batch_jobs: Math.max(0, limits.batch_jobs - usage.batch_jobs),
      plugin_integrations: Math.max(0, limits.plugin_integrations - usage.plugin_integrations),
      api_keys: Math.max(0, limits.api_keys - usage.api_keys),
    };
    
    return {
      limits,
      usage,
      remaining,
    };
  } catch (error: any) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'get_all_usage_limits_error',
        errorMessage: `Failed to get all usage limits: ${error.message}`,
        userId,
        payload: { error: error.message }
      })
    );
    
    // Return default values in case of error
    return {
      limits: { 
        prompt_credits: 0, 
        agents: 0, 
        workflows: 0, 
        batch_jobs: 0, 
        plugin_integrations: 0, 
        api_keys: 0 
      },
      usage: { 
        prompt_credits: 0, 
        agents: 0, 
        workflows: 0, 
        batch_jobs: 0, 
        plugin_integrations: 0, 
        api_keys: 0 
      },
      remaining: { 
        prompt_credits: 0, 
        agents: 0, 
        workflows: 0, 
        batch_jobs: 0, 
        plugin_integrations: 0, 
        api_keys: 0 
      },
    };
  }
}
