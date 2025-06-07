/**
 * Error Handler
 * 
 * Centralized error handling and logging utility for the Overseer platform.
 * Following Airbnb Style Guide for code formatting.
 */

import prisma from './db/prisma';

export interface ErrorDetails {
  error: Error;
  source: string;
  message?: string;
  userId?: string;
  agentId?: string;
  metadata?: Record<string, any>;
}

export class ErrorHandler {
  /**
   * Handle an error by logging it and optionally reporting it
   * 
   * @param details - Error details including the error object, source, and optional metadata
   * @returns The created error log ID
   */
  async handle(details: ErrorDetails): Promise<string> {
    const {
      error,
      source,
      message = error.message,
      userId,
      agentId,
      metadata = {},
    } = details;

    console.error(`[${source}] ${message}`, {
      error: error.message,
      stack: error.stack,
      userId,
      agentId,
    });

    try {
      // Log to database if userId is provided
      if (userId) {
        const errorLog = await prisma.errorLog.create({
          data: {
            user_id: userId,
            agent_id: agentId,
            error_type: error.name || 'Error',
            error_message: message || error.message,
            stack_trace: error.stack,
            context: {
              source,
              ...metadata,
            },
          },
        });

        return errorLog.id;
      }
    } catch (logError) {
      // If logging to the database fails, just log to console
      console.error('Failed to log error to database', logError);
    }

    return '';
  }

  /**
   * Log an audit event (non-error)
   * 
   * @param source - Source of the audit event
   * @param action - Action being performed
   * @param userId - User ID
   * @param metadata - Additional metadata
   */
  async audit(
    source: string,
    action: string,
    userId: string,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    console.log(`[AUDIT] [${source}] ${action}`, {
      userId,
      ...metadata,
    });

    // Additional audit logging logic can be added here
    // For example, logging to a separate audit log table
  }
}
