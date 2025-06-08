/**
 * Batch Processing Manager for LLM Operations
 * Handles large document processing tasks with credit pre-authorization
 */

import { v4 as uuidv4 } from 'uuid';
import { aiService } from './service';
import { creditSystem } from './credit-system';
import { prisma } from '../db/prisma';
import { ErrorHandler } from '../error-handler';

export interface BatchJob {
  id: string;
  userId: string;
  agentId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalItems: number;
  processedItems: number;
  estimatedTokens: number;
  actualTokens: number;
  creditsPreAuthorized: number;
  creditsUsed: number;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface BatchProcessItem {
  id: string;
  content: string;
  metadata?: Record<string, any>;
}

export class BatchProcessor {
  private activeJobs: Map<string, BatchJob> = new Map();
  
  /**
   * Create a new batch processing job
   */
  public async createJob(
    userId: string,
    items: BatchProcessItem[],
    options: {
      agentId?: string;
      model?: string;
      tokenEstimateMultiplier?: number;
    }
  ): Promise<BatchJob | null> {
    try {
      const model = options.model || 'gpt-4o';
      const tokenEstimateMultiplier = options.tokenEstimateMultiplier || 1.2;
      
      // Estimate total tokens needed
      let estimatedTokens = 0;
      for (const item of items) {
        const itemTokens = aiService.estimateTokenCount(item.content);
        // Multiply by 2 to account for both input and output tokens
        estimatedTokens += itemTokens * 2;
      }
      
      // Apply safety multiplier
      estimatedTokens = Math.ceil(estimatedTokens * tokenEstimateMultiplier);
      
      // Calculate estimated credits
      const estimatedCredits = creditSystem.calculateCreditsForTokens(estimatedTokens, model);
      
      // Check if user has enough credits
      const hasEnoughCredits = await creditSystem.hasEnoughCredits(userId, estimatedTokens, model);
      
      if (!hasEnoughCredits) {
        return null;
      }
      
      // Pre-authorize credits
      await creditSystem.preAuthorizeCredits(userId, estimatedCredits);
      
      // Create job record
      const jobId = uuidv4();
      const newJob: BatchJob = {
        id: jobId,
        userId,
        agentId: options.agentId,
        status: 'pending',
        progress: 0,
        totalItems: items.length,
        processedItems: 0,
        estimatedTokens,
        actualTokens: 0,
        creditsPreAuthorized: estimatedCredits,
        creditsUsed: 0,
        model,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Store in memory and database
      this.activeJobs.set(jobId, newJob);
      
      // Store in database
      await prisma.$executeRaw`
        INSERT INTO "BatchJob" (
          "id", "user_id", "agent_id", "status", "progress", "total_items", 
          "processed_items", "estimated_tokens", "actual_tokens", 
          "credits_pre_authorized", "credits_used", "model", 
          "created_at", "updated_at"
        )
        VALUES (
          ${jobId}, ${userId}, ${options.agentId || null}, 'pending', 0, ${items.length},
          0, ${estimatedTokens}, 0,
          ${estimatedCredits}, 0, ${model},
          NOW(), NOW()
        )
      `;
      
      // Start processing asynchronously
      this.processJob(jobId, items, options).catch(error => {
        ErrorHandler.logError(
          ErrorHandler.createCustomError({
            errorCode: 'batch_process_error',
            errorMessage: `Failed to process batch job: ${error.message}`,
            userId,
            agentId: options.agentId,
            payload: { jobId, error: error.message }
          })
        );
      });
      
      return newJob;
    } catch (error: any) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'create_batch_job_error',
          errorMessage: `Failed to create batch job: ${error.message}`,
          userId,
          agentId: options.agentId,
          payload: { error: error.message }
        })
      );
      
      return null;
    }
  }
  
  /**
   * Process a batch job
   */
  private async processJob(
    jobId: string,
    items: BatchProcessItem[],
    options: {
      agentId?: string;
      model?: string;
    }
  ): Promise<void> {
    const job = this.activeJobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    
    try {
      // Update job status
      job.status = 'processing';
      job.updatedAt = new Date();
      
      await prisma.$executeRaw`
        UPDATE "BatchJob"
        SET "status" = 'processing', "updated_at" = NOW()
        WHERE "id" = ${jobId}
      `;
      
      let totalTokensUsed = 0;
      let totalCreditsUsed = 0;
      
      // Process each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        try {
          // Process the item with AI service
          const response = await aiService.generateChatCompletion(
            [{ role: 'user', content: item.content }],
            { model: job.model }
          );
          
          // Track token usage
          if (response.usage) {
            totalTokensUsed += response.usage.totalTokens;
            
            // Calculate credits used for this item
            const itemCredits = creditSystem.calculateCreditsForTokens(
              response.usage.totalTokens,
              job.model
            );
            
            totalCreditsUsed += itemCredits;
            
            // Track usage in the database
            await creditSystem.trackUsage(
              job.userId,
              job.agentId,
              {
                promptTokens: response.usage.promptTokens,
                completionTokens: response.usage.completionTokens,
                totalTokens: response.usage.totalTokens
              },
              job.model
            );
          }
          
          // Store the processed result
          await prisma.$executeRaw`
            INSERT INTO "BatchProcessResult" (
              "id", "job_id", "item_id", "input", "output", "tokens_used", 
              "created_at"
            )
            VALUES (
              ${uuidv4()}, ${jobId}, ${item.id}, ${item.content}, 
              ${response.content || ''}, ${response.usage?.totalTokens || 0},
              NOW()
            )
          `;
          
          // Update job progress
          job.processedItems = i + 1;
          job.progress = Math.floor((job.processedItems / job.totalItems) * 100);
          job.actualTokens = totalTokensUsed;
          job.creditsUsed = totalCreditsUsed;
          job.updatedAt = new Date();
          
          await prisma.$executeRaw`
            UPDATE "BatchJob"
            SET 
              "processed_items" = ${job.processedItems},
              "progress" = ${job.progress},
              "actual_tokens" = ${totalTokensUsed},
              "credits_used" = ${totalCreditsUsed},
              "updated_at" = NOW()
            WHERE "id" = ${jobId}
          `;
        } catch (itemError: any) {
          // Log item processing error but continue with other items
          ErrorHandler.logError({
            errorCode: 'batch_item_process_error',
            errorMessage: `Failed to process batch item: ${itemError.message}`,
            userId: job.userId,
            agentId: job.agentId,
            payload: { jobId, itemId: item.id, error: itemError.message }
          });
        }
      }
      
      // Complete the job
      job.status = 'completed';
      job.progress = 100;
      job.completedAt = new Date();
      job.updatedAt = new Date();
      
      // Release any excess pre-authorized credits
      if (job.creditsPreAuthorized > totalCreditsUsed) {
        const excessCredits = job.creditsPreAuthorized - totalCreditsUsed;
        await creditSystem.releasePreAuthorizedCredits(job.userId, excessCredits);
      }
      
      await prisma.$executeRaw`
        UPDATE "BatchJob"
        SET 
          "status" = 'completed',
          "progress" = 100,
          "completed_at" = NOW(),
          "updated_at" = NOW()
        WHERE "id" = ${jobId}
      `;
    } catch (error: any) {
      // Handle job failure
      job.status = 'failed';
      job.error = error.message;
      job.updatedAt = new Date();
      
      // Release all pre-authorized credits on failure
      await creditSystem.releasePreAuthorizedCredits(job.userId, job.creditsPreAuthorized);
      
      await prisma.$executeRaw`
        UPDATE "BatchJob"
        SET 
          "status" = 'failed',
          "error" = ${error.message},
          "updated_at" = NOW()
        WHERE "id" = ${jobId}
      `;
      
      ErrorHandler.logError({
        errorCode: 'batch_job_failed',
        errorMessage: `Batch job failed: ${error.message}`,
        userId: job.userId,
        agentId: job.agentId,
        payload: { jobId, error: error.message }
      });
    }
  }
  
  /**
   * Get job status
   */
  public async getJobStatus(jobId: string): Promise<BatchJob | null> {
    try {
      // Check in-memory cache first
      if (this.activeJobs.has(jobId)) {
        return this.activeJobs.get(jobId) || null;
      }
      
      // Fetch from database
      const job = await prisma.$queryRaw`
        SELECT * FROM "BatchJob" WHERE "id" = ${jobId}
      `;
      
      if (!job || !Array.isArray(job) || job.length === 0) {
        return null;
      }
      
      return job[0] as BatchJob;
    } catch (error: any) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'get_job_status_error',
          errorMessage: `Failed to get job status: ${error.message}`,
          payload: { jobId, error: error.message }
        })
      );
      
      return null;
    }
  }
  
  /**
   * Cancel a job
   */
  public async cancelJob(jobId: string, userId: string): Promise<boolean> {
    try {
      // Get job
      const job = await this.getJobStatus(jobId);
      
      if (!job) {
        return false;
      }
      
      // Verify ownership
      if (job.userId !== userId) {
        return false;
      }
      
      // Only pending or processing jobs can be canceled
      if (job.status !== 'pending' && job.status !== 'processing') {
        return false;
      }
      
      // Update job status
      job.status = 'failed';
      job.error = 'Job canceled by user';
      job.updatedAt = new Date();
      
      // Release pre-authorized credits
      const creditsToRelease = job.creditsPreAuthorized - job.creditsUsed;
      if (creditsToRelease > 0) {
        await creditSystem.releasePreAuthorizedCredits(userId, creditsToRelease);
      }
      
      // Update in database
      await prisma.$executeRaw`
        UPDATE "BatchJob"
        SET 
          "status" = 'failed',
          "error" = 'Job canceled by user',
          "updated_at" = NOW()
        WHERE "id" = ${jobId}
      `;
      
      // Remove from active jobs
      this.activeJobs.delete(jobId);
      
      return true;
    } catch (error: any) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'cancel_job_error',
          errorMessage: `Failed to cancel job: ${error.message}`,
          userId,
          payload: { jobId, error: error.message }
        })
      );
      
      return false;
    }
  }
  
  /**
   * List jobs for a user
   */
  public async listJobs(
    userId: string,
    options: {
      status?: 'pending' | 'processing' | 'completed' | 'failed';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ jobs: BatchJob[]; total: number }> {
    try {
      const limit = options.limit || 10;
      const offset = options.offset || 0;
      
      // Build query
      let query = `
        SELECT * FROM "BatchJob"
        WHERE "user_id" = '${userId}'
      `;
      
      if (options.status) {
        query += ` AND "status" = '${options.status}'`;
      }
      
      query += ` ORDER BY "created_at" DESC LIMIT ${limit} OFFSET ${offset}`;
      
      // Execute query
      const jobs = await prisma.$queryRaw(query);
      
      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total FROM "BatchJob"
        WHERE "user_id" = '${userId}'
      `;
      
      if (options.status) {
        countQuery += ` AND "status" = '${options.status}'`;
      }
      
      const totalResult = await prisma.$queryRaw(countQuery);
      const total = Array.isArray(totalResult) && totalResult.length > 0
        ? parseInt(totalResult[0].total, 10)
        : 0;
      
      return {
        jobs: Array.isArray(jobs) ? jobs as BatchJob[] : [],
        total,
      };
    } catch (error: any) {
      ErrorHandler.logError(
        ErrorHandler.createCustomError({
          errorCode: 'list_jobs_error',
          errorMessage: `Failed to list jobs: ${error.message}`,
          userId,
          payload: { error: error.message }
        })
      );
      
      return { jobs: [], total: 0 };
    }
  }
}

// Singleton instance
export const batchProcessor = new BatchProcessor();
