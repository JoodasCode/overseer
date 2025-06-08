/**
 * Credit System for LLM Usage
 * Handles credit tracking, pre-authorization, and audit logging
 */

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma';
import { ErrorHandler } from '../error-handler';
import { TokenUsage } from './service';

// Define audit log operation types
export type CreditOperationType = 
  | 'usage' 
  | 'add' 
  | 'pre_authorize' 
  | 'release_pre_authorize' 
  | 'refund';

// Plan tiers with credit allocations
export enum PlanTier {
  FREE = 'free',
  PRO = 'pro',
  TEAMS = 'teams',
  ENTERPRISE = 'enterprise',
}

// Credit allocation per plan
export const PLAN_CREDITS = {
  [PlanTier.FREE]: 25,
  [PlanTier.PRO]: 500,
  [PlanTier.TEAMS]: 500, // Per user
  [PlanTier.ENTERPRISE]: 1000, // Per user
};

// Model cost ratios (credits per 1K tokens)
export const MODEL_COST_RATIOS = {
  'gpt-4o': {
    input: 5,
    output: 15,
  },
  'gpt-4-turbo': {
    input: 10,
    output: 30,
  },
  'claude-3-opus': {
    input: 15,
    output: 75,
  },
  'claude-3-sonnet': {
    input: 3,
    output: 15,
  },
  'gemini-1.5-pro': {
    input: 3,
    output: 10,
  },
  'mistral-large': {
    input: 2,
    output: 8,
  },
};

// Default cost ratio for unknown models
const DEFAULT_COST_RATIO = {
  input: 5,
  output: 15,
};

/**
 * Credit System class for managing token usage and credits
 */
export class CreditSystem {
  /**
   * Calculate credits used for a given token usage
   */
  public calculateCreditsUsed(
    tokenUsage: TokenUsage,
    modelName: string,
    userId?: string
  ): number {
    try {
      // Get cost ratio for the model or use default
      const costRatio = MODEL_COST_RATIOS[modelName as keyof typeof MODEL_COST_RATIOS] || DEFAULT_COST_RATIO;
      
      // Calculate credits used (per 1K tokens)
      const inputCredits = (tokenUsage.promptTokens / 1000) * costRatio.input;
      const outputCredits = (tokenUsage.completionTokens / 1000) * costRatio.output;
      
      // Return total credits used (rounded up to nearest 0.01)
      return Math.ceil((inputCredits + outputCredits) * 100) / 100;
    } catch (error: any) {
      if (userId) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'calculate_credits_used_error',
            errorMessage: `Failed to calculate credits used: ${error.message}`,
            userId,
            payload: { error: error.message, tokenUsage, modelName }
          })
        );
      }
      
      // Return a safe default value based on total tokens
      const totalTokens = (tokenUsage?.totalTokens || 0) / 1000;
      return Math.ceil(totalTokens * 5 * 100) / 100; // Use a moderate cost ratio as fallback
    }
  }
  
  /**
   * Calculate credits needed for a given token count and model
   */
  public calculateCreditsForTokens(
    totalTokens: number,
    model: string,
    userId?: string
  ): number {
    try {
      // Base rate: $0.01 per 1K tokens
      let rate = 0.01;
      
      // Adjust rate based on model
      if (model.includes('gpt-4')) {
        // GPT-4 models are more expensive
        rate = model.includes('gpt-4o') ? 0.015 : 0.03;
      } else if (model.includes('gpt-3.5')) {
        // GPT-3.5 models are cheaper
        rate = 0.005;
      }
      
      // Calculate credits (1 credit = $0.01)
      // Convert tokens to thousands and multiply by rate
      return parseFloat(((totalTokens / 1000) * rate).toFixed(4));
    } catch (error: any) {
      if (userId) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'calculate_credits_error',
            errorMessage: `Failed to calculate credits for tokens: ${error.message}`,
            userId,
            payload: { error: error.message, totalTokens, model }
          })
        );
      }
      
      // Return a safe default value
      return parseFloat(((totalTokens / 1000) * 0.01).toFixed(4));
    }
  }

  /**
   * Check if user has enough credits for estimated token usage
   */
  public async hasEnoughCredits(
    userId: string,
    estimatedTokens: number,
    model: string
  ): Promise<boolean> {
    try {
      // Get user's current credits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits_added: true, credits_used: true, pre_authorized_credits: true }
      });
      
      if (!user) {
        return false;
      }
      
      // Calculate available credits
      const availableCredits = user.credits_added - user.credits_used - user.pre_authorized_credits;
      
      // Calculate required credits for this operation
      const requiredCredits = this.calculateCreditsForTokens(estimatedTokens, model, userId);
      
      return availableCredits >= requiredCredits;
    } catch (error: any) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'credit_check_error',
          errorMessage: `Failed to check credit availability: ${error.message}`,
          userId,
          payload: { error: error.message }
        })
      );
      
      return false;
    }
  }

  /**
   * Pre-authorize credits for batch processing
   */
  public async preAuthorizeCredits(
    userId: string,
    amount: number
  ): Promise<boolean> {
    try {
      // Validate amount parameter
      if (isNaN(amount) || amount <= 0) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'pre_authorize_invalid_amount',
            errorMessage: 'Invalid pre-authorization amount',
            userId,
            payload: { amount }
          })
        );
        return false;
      }
      
      // Get user's current credits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, credits_added: true, credits_used: true, pre_authorized_credits: true }
      });
      
      if (!user) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'pre_authorize_user_not_found',
            errorMessage: 'User not found for pre-authorization',
            userId,
            payload: { amount }
          })
        );
        return false;
      }
      
      // Calculate available credits
      const availableCredits = user.credits_added - user.credits_used - user.pre_authorized_credits;
      
      if (availableCredits < amount) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'pre_authorize_insufficient_credits',
            errorMessage: 'Insufficient credits for pre-authorization',
            userId,
            payload: { amount, availableCredits }
          })
        );
        return false;
      }
      
      // Update pre-authorized credits
      await prisma.user.update({
        where: { id: userId },
        data: { pre_authorized_credits: user.pre_authorized_credits + amount }
      });
      
      // Log the operation
      await this.logCreditOperation(
        userId,
        'pre_authorize',
        amount,
        user.pre_authorized_credits,
        user.pre_authorized_credits + amount,
        'Pre-authorized credits for batch processing'
      );
      
      return true;
    } catch (error: any) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'pre_authorize_credits_error',
          errorMessage: `Failed to pre-authorize credits: ${error.message}`,
          userId,
          payload: { error: error.message }
        })
      );
      
      return false;
    }
  }

  /**
   * Release pre-authorized credits
   */
  public async releasePreAuthorizedCredits(
    userId: string,
    amount: number
  ): Promise<boolean> {
    try {
      // Validate amount parameter
      if (isNaN(amount) || amount <= 0) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'release_pre_authorize_invalid_amount',
            errorMessage: 'Invalid amount for releasing pre-authorized credits',
            userId,
            payload: { amount }
          })
        );
        return false;
      }
      
      // Get user's current credits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, pre_authorized_credits: true }
      });
      
      if (!user) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'release_pre_authorize_user_not_found',
            errorMessage: 'User not found for releasing pre-authorized credits',
            userId,
            payload: { amount }
          })
        );
        return false;
      }
      
      // Calculate new pre-authorized amount
      const newPreAuthorized = Math.max(0, user.pre_authorized_credits - amount);
      
      // Update pre-authorized credits
      await prisma.user.update({
        where: { id: userId },
        data: { pre_authorized_credits: newPreAuthorized }
      });
      
      // Log the operation
      await this.logCreditOperation(
        userId,
        'release_pre_authorize',
        amount,
        user.pre_authorized_credits,
        newPreAuthorized,
        'Released pre-authorized credits'
      );
      
      return true;
    } catch (error: any) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'release_pre_authorized_credits_error',
          errorMessage: `Failed to release pre-authorized credits: ${error.message}`,
          userId,
          payload: { error: error.message }
        })
      );
      
      return false;
    }
  }

  /**
   * Track token usage and deduct credits
   */
  public async trackUsage(
    userId: string,
    agentId: string | undefined,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number },
    model: string
  ): Promise<boolean> {
    try {
      // Validate input parameters
      if (!userId) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'track_usage_missing_user',
            errorMessage: 'User ID is required for tracking usage',
            payload: { usage, model }
          })
        );
        return false;
      }

      if (!usage || typeof usage.totalTokens !== 'number' || usage.totalTokens <= 0) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'track_usage_invalid_usage',
            errorMessage: 'Invalid token usage data',
            userId,
            agentId,
            payload: { usage, model }
          })
        );
        return false;
      }
      
      // Calculate credits used for this usage
      const creditsUsed = this.calculateCreditsUsed(usage, model, userId);
      
      // Get user's current credit usage
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits_used: true }
      });
      
      if (!user) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'track_usage_user_not_found',
            errorMessage: 'User not found for tracking usage',
            userId,
            agentId,
            payload: { usage, model }
          })
        );
        return false;
      }
      
      const currentCreditsUsed = user.credits_used;
      
      // Update user's credits used
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits_used: {
            increment: creditsUsed,
          },
        },
      });
      
      // Log the operation
      await this.logCreditOperation(
        userId,
        'usage',
        creditsUsed,
        currentCreditsUsed,
        currentCreditsUsed + creditsUsed,
        'Token usage',
        { model, tokens: usage.totalTokens, agentId }
      );
      
      return true;
    } catch (error: any) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'track_usage_error',
          errorMessage: `Failed to track token usage: ${error.message}`,
          userId,
          agentId,
          payload: { error: error.message, usage, model }
        })
      );
      
      return false;
    }
  }

  /**
   * Get user's credit summary
   */
  public async getCreditSummary(userId: string): Promise<{
    creditsAdded: number;
    creditsUsed: number;
    preAuthorizedCredits: number;
    creditsAvailable: number;
    planTier: string;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          credits_added: true,
          credits_used: true,
          pre_authorized_credits: true,
          plan_tier: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return {
        creditsAdded: user.credits_added,
        creditsUsed: user.credits_used,
        preAuthorizedCredits: user.pre_authorized_credits,
        creditsAvailable: user.credits_added - user.credits_used - user.pre_authorized_credits,
        planTier: user.plan_tier || 'free',
      };
    } catch (error: any) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'credit_summary_error',
          errorMessage: `Failed to get credit summary: ${error.message}`,
          userId,
          payload: { error: error.message }
        })
      );
      
      return {
        creditsAdded: 0,
        creditsUsed: 0,
        preAuthorizedCredits: 0,
        creditsAvailable: 0,
        planTier: 'free',
      };
    }
  }

  /**
   * Get credit audit logs for a user
   */
  public async getCreditAuditLogs(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      operationType?: CreditOperationType;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ logs: any[]; total: number }> {
    try {
      const limit = options.limit || 10;
      const offset = options.offset || 0;
      
      // Build query conditions
      let conditions = `"user_id" = '${userId}'`;
      
      if (options.operationType) {
        conditions += ` AND "operation_type" = '${options.operationType}'`;
      }
      
      if (options.startDate) {
        conditions += ` AND "created_at" >= '${options.startDate.toISOString()}'`;
      }
      
      if (options.endDate) {
        conditions += ` AND "created_at" <= '${options.endDate.toISOString()}'`;
      }
      
      // Execute query
      const logs = await prisma.$queryRaw`
        SELECT * FROM "CreditAuditLog"
        WHERE ${prisma.$raw(conditions)}
        ORDER BY "created_at" DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      // Get total count
      const totalResult = await prisma.$queryRaw`
        SELECT COUNT(*) as total FROM "CreditAuditLog"
        WHERE ${prisma.$raw(conditions)}
      `;
      
      const total = Array.isArray(totalResult) && totalResult.length > 0
        ? parseInt(totalResult[0].total, 10)
        : 0;
      
      return { logs: Array.isArray(logs) ? logs : [], total };
    } catch (error: any) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'get_credit_audit_logs_error',
          errorMessage: `Failed to get credit audit logs: ${error.message}`,
          userId,
          payload: { error: error.message }
        })
      );
      
      return { logs: [], total: 0 };
    }
  }

  /**
   * Add credits to a user
   */
  public async addCredits(
    userId: string,
    amount: number,
    adminKey?: string,
    source: string = 'manual'
  ): Promise<boolean> {
    try {
      // Verify admin key for adding credits
      // This is a simple check - in production, you'd have more robust authorization
      if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
        // Check if user is adding credits to their own account and has a valid payment
        // This would integrate with your payment processor
        // For now, we'll just allow it for demo purposes
      }
      
      // Get user's current credits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits_added: true }
      });
      
      if (!user) {
        return false;
      }
      
      // Update user credits
      await prisma.user.update({
        where: { id: userId },
        data: { credits_added: { increment: amount } }
      });
      
      // Log the credit operation
      await this.logCreditOperation(
        userId,
        'add',
        amount,
        user.credits_added,
        user.credits_added + amount,
        `Added credits from source: ${source}`,
        { source }
      );
      
      return true;
    } catch (error: any) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'add_credits_error',
          errorMessage: `Failed to add credits: ${error.message}`,
          userId,
          payload: { error: error.message }
        })
      );
      
      return false;
    }
  }
  
  /**
   * Reset monthly credits based on subscription plan
   */
  public async resetMonthlyCredits(
    userId: string,
    creditAmount: number,
    adminKey?: string
  ): Promise<boolean> {
    try {
      // Validate credit amount parameter
      if (isNaN(creditAmount) || creditAmount < 0) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'reset_credits_invalid_amount',
            errorMessage: 'Invalid credit amount for monthly reset',
            userId,
            payload: { creditAmount }
          })
        );
        return false;
      }
      
      // Verify admin key for resetting credits
      if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'reset_credits_unauthorized',
            errorMessage: 'Unauthorized attempt to reset monthly credits',
            userId,
            payload: { creditAmount }
          })
        );
        return false;
      }
      
      // Get user's current credits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          credits_added: true, 
          credits_used: true,
          pre_authorized_credits: true 
        }
      });
      
      if (!user) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'reset_credits_user_not_found',
            errorMessage: 'User not found for monthly credit reset',
            userId,
            payload: { creditAmount }
          })
        );
        return false;
      }
      
      // Calculate remaining credits (add-on credits that shouldn't be reset)
      const remainingCredits = Math.max(0, user.credits_added - user.credits_used - user.pre_authorized_credits);
      
      // Set new credits_added value to be: remaining credits + monthly plan credits
      const newCreditsAdded = remainingCredits + creditAmount;
      
      // Update user credits
      await prisma.user.update({
        where: { id: userId },
        data: { 
          credits_added: newCreditsAdded,
          credits_used: 0 // Reset usage counter
        }
      });
      
      // Log the credit operation
      await this.logCreditOperation(
        userId,
        'add',
        creditAmount,
        user.credits_added,
        newCreditsAdded,
        `Monthly credit reset based on subscription plan`,
        { source: 'subscription_reset', creditAmount }
      );
      
      return true;
    } catch (error: any) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'reset_monthly_credits_error',
          errorMessage: `Failed to reset monthly credits: ${error.message}`,
          userId,
          payload: { error: error.message }
        })
      );
      
      return false;
    }
  }

  /**
   * Refund credits to a user
   */
  public async refundCredits(
    userId: string,
    amount: number,
    reason: string,
    adminKey?: string
  ): Promise<boolean> {
    try {
      // Validate amount parameter
      if (isNaN(amount) || amount <= 0) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'refund_credits_invalid_amount',
            errorMessage: 'Invalid amount for credit refund',
            userId,
            payload: { amount, reason }
          })
        );
        return false;
      }
      
      // Validate reason parameter
      if (!reason || reason.trim() === '') {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'refund_credits_missing_reason',
            errorMessage: 'Refund reason is required',
            userId,
            payload: { amount }
          })
        );
        return false;
      }
      
      // Verify admin key for refunding credits
      if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'refund_credits_unauthorized',
            errorMessage: 'Unauthorized attempt to refund credits',
            userId,
            payload: { amount, reason }
          })
        );
        return false;
      }
      
      // Get user's current credits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits_used: true }
      });
      
      if (!user) {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'refund_credits_user_not_found',
            errorMessage: 'User not found for credit refund',
            userId,
            payload: { amount, reason }
          })
        );
        return false;
      }
      
      // Update user credits used (decrease)
      const newCreditsUsed = Math.max(0, user.credits_used - amount);
      await prisma.user.update({
        where: { id: userId },
        data: { credits_used: newCreditsUsed }
      });
      
      // Log the credit operation
      await this.logCreditOperation(
        userId,
        'refund',
        amount,
        user.credits_used,
        newCreditsUsed,
        `Refunded credits: ${reason}`,
        { reason }
      );
      
      return true;
    } catch (error: any) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'refund_credits_error',
          errorMessage: `Failed to refund credits: ${error.message}`,
          userId,
          payload: { error: error.message }
        })
      );
      
      return false;
    }
  }
  
  /**
   * Log credit operations for audit purposes
   */
  private async logCreditOperation(
    userId: string,
    operationType: CreditOperationType,
    amount: number,
    balanceBefore: number,
    balanceAfter: number,
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO "CreditAuditLog" (
          "id", "user_id", "operation_type", "amount", "balance_before", 
          "balance_after", "description", "metadata", "created_at"
        )
        VALUES (
          ${uuidv4()}, ${userId}, ${operationType}, ${amount}, ${balanceBefore},
          ${balanceAfter}, ${description}, ${JSON.stringify(metadata)}::jsonb, NOW()
        )
      `;
    } catch (error: any) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'credit_audit_log_error',
          errorMessage: `Failed to log credit operation: ${error.message}`,
          userId,
          payload: { error: error.message, operationType, amount }
        })
      );
    }
  }
}

// Singleton instance
export const creditSystem = new CreditSystem();
