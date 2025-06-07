/**
 * Subscription Usage Limits API
 * Endpoints for checking and enforcing subscription usage limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SUBSCRIPTION_PLANS } from '@/lib/billing/stripe-service';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler } from '@/lib/error-handler';

// Resource types that have usage limits
export type ResourceType = 'prompt_credits' | 'agents' | 'workflows' | 'batch_jobs' | 'plugin_integrations' | 'api_keys';

// Usage limits by plan and resource type
export const USAGE_LIMITS = {
  FREE: {
    prompt_credits: 25,     // Monthly token credits
    agents: 2,              // Concurrent active AI agents
    workflows: 3,           // Saved automation workflows
    batch_jobs: 1,          // Concurrent batch processing jobs
    plugin_integrations: 1, // Connected external services
    api_keys: 1,            // Custom API keys for agent deployments
  },
  PRO: {
    prompt_credits: 500,    // Monthly token credits
    agents: 5,               // Concurrent active AI agents
    workflows: 10,           // Saved automation workflows
    batch_jobs: 3,           // Concurrent batch processing jobs
    plugin_integrations: 3,  // Connected external services
    api_keys: 3,             // Custom API keys for agent deployments
  },
  TEAMS: {
    prompt_credits: 500,    // Monthly token credits per user
    agents: 10,              // Concurrent active AI agents
    workflows: 25,           // Saved automation workflows
    batch_jobs: 5,           // Concurrent batch processing jobs
    plugin_integrations: 10, // Connected external services
    api_keys: 5,             // Custom API keys for agent deployments
  },
  ENTERPRISE: {
    prompt_credits: 1000,   // Monthly token credits per user
    agents: 25,              // Concurrent active AI agents
    workflows: 50,           // Saved automation workflows
    batch_jobs: 10,          // Concurrent batch processing jobs
    plugin_integrations: 25, // Connected external services
    api_keys: 10,            // Custom API keys for agent deployments
  },
};

async function getAllUsageLimits(userId: string) {
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
    throw new Error('User not found');
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
    planTier,
    limits,
    usage,
    remaining,
  };
}

/**
 * GET /api/billing/subscription/limits
 * Get all usage limits for the current user
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get all usage limits for the user
    const usageLimits = await getAllUsageLimits(userId);
    
    return NextResponse.json(usageLimits);
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'get_subscription_limits_error',
      errorMessage: `Failed to get subscription limits: ${error.message}`,
      payload: { error: error.message }
    });
    
    return NextResponse.json(
      { error: 'Failed to get subscription limits' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing/subscription/limits
 * Check if a user has reached their usage limit for a specific resource
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get resource type from request body
    const { resourceType } = await req.json();
    
    if (!resourceType) {
      return NextResponse.json(
        { error: 'Resource type is required' },
        { status: 400 }
      );
    }
    
    // Check if resource type is valid
    const validResourceTypes = [
      'prompt_credits',
      'agents',
      'workflows',
      'batch_jobs',
      'plugin_integrations',
      'api_keys'
    ];
    
    if (!validResourceTypes.includes(resourceType)) {
      return NextResponse.json(
        { error: `Invalid resource type: ${resourceType}` },
        { status: 400 }
      );
    }
    
    // Use the checkUsageLimit utility function to check the usage limit
    const { checkUsageLimit } = await import('@/lib/billing/subscription-utils');
    const result = await checkUsageLimit(userId, resourceType as any);
    
    return NextResponse.json(result);
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'check_usage_limit_error',
      errorMessage: `Failed to check usage limit: ${error.message}`,
      payload: { error: error.message }
    });
    
    return NextResponse.json(
      { error: 'Failed to check usage limit' },
      { status: 500 }
    );
  }
}
