/**
 * Error Handler Utility
 * Handles error logging with context and optional database storage
 * Updated to use Supabase instead of Prisma to avoid connection conflicts
 */

import { createClient } from '@supabase/supabase-js';

// Create Supabase client for error logging
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
   * Static method to log an error with context
   * 
   * @param error - The error object or error options
   * @param context - Optional context information
   */
  static logError(error: Error | {
    errorCode?: string;
    errorMessage?: string;
    userId?: string;
    agentId?: string;
    payload?: Record<string, any>;
    name?: string;
    message?: string;
  }, context?: string): void {
    // If it's not an Error instance, convert it to one
    if (!(error instanceof Error)) {
      error = ErrorHandler.createCustomError(error);
    }
    
    // Now error is guaranteed to be an Error instance
    const errorObj = error as Error;
    
    console.error(`[ERROR] ${errorObj.message}`, {
      name: errorObj.name,
      stack: errorObj.stack,
      context,
      // Include extended properties if they exist
      ...(errorObj as any).errorCode && { errorCode: (errorObj as any).errorCode },
      ...(errorObj as any).errorMessage && { errorMessage: (errorObj as any).errorMessage },
      ...(errorObj as any).userId && { userId: (errorObj as any).userId },
      ...(errorObj as any).agentId && { agentId: (errorObj as any).agentId },
      ...(errorObj as any).payload && { payload: (errorObj as any).payload },
    });
    
    // Additional error logging logic can be added here
    // For example, sending to an error monitoring service
  }
  
  /**
   * Creates a custom error with extended properties
   * 
   * @param options - Options for creating the custom error
   * @returns An Error object with extended properties
   */
  static createCustomError(options: {
    errorCode?: string;
    errorMessage?: string;
    userId?: string;
    agentId?: string;
    payload?: Record<string, any>;
    name?: string;
    message?: string;
  }): Error {
    const error = new Error(options.message || options.errorMessage || 'Unknown error');
    error.name = options.name || 'CustomError';
    
    // Add extended properties
    Object.assign(error, {
      errorCode: options.errorCode,
      errorMessage: options.errorMessage || options.message,
      userId: options.userId,
      agentId: options.agentId,
      payload: options.payload || {}
    });
    
    return error;
  }
  
  /**
   * Handle an error by logging it and optionally reporting it to Supabase
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
      // Log to Supabase database if userId is provided
      if (userId) {
        const { data: errorLog, error: logError } = await supabase
          .from('ErrorLog')
          .insert({
            user_id: userId,
            agent_id: agentId,
            error_type: error.name || 'Error',
            error_message: message || error.message,
            stack_trace: error.stack,
            context: {
              source,
              ...metadata,
            },
          })
          .select('id')
          .single();

        if (logError) {
          throw logError;
        }

        return errorLog?.id || '';
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
  
  /**
   * Instance method to log an error with context
   * 
   * @param error - The error object or error options
   * @param context - Optional context information
   */
  logError(error: Error | {
    errorCode?: string;
    errorMessage?: string;
    userId?: string;
    agentId?: string;
    payload?: Record<string, any>;
    name?: string;
    message?: string;
  }, context?: string): void {
    ErrorHandler.logError(error, context);
  }

  /**
   * Instance method to create a custom error with extended properties
   * 
   * @param options - Options for creating the custom error
   * @returns An Error object with extended properties
   */
  createCustomError(options: {
    errorCode?: string;
    errorMessage?: string;
    userId?: string;
    agentId?: string;
    payload?: Record<string, any>;
    name?: string;
    message?: string;
  }): Error {
    return ErrorHandler.createCustomError(options);
  }
}
