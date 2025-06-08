declare module '@/lib/error-handler' {
  export interface ErrorContext {
    userId?: string;
    requestId?: string;
    path?: string;
    additionalData?: Record<string, any>;
  }

  // Extend the global Error interface to include additional properties used in the application
  export interface ExtendedError extends Error {
    errorCode?: string;
    errorMessage?: string;
    userId?: string;
    agentId?: string;
    payload?: Record<string, any>;
  }
  
  // Custom error constructor interface for creating errors in a consistent way
  export interface CustomErrorOptions {
    errorCode?: string;
    errorMessage?: string;
    userId?: string;
    agentId?: string;
    payload?: Record<string, any>;
    name?: string;
    message?: string;
  }
  
  /**
   * Creates a custom error with extended properties
   * @param options Options for creating the custom error
   * @returns An Error object with extended properties
   */
  export function createCustomError(options: CustomErrorOptions): ExtendedError;

  export class ErrorHandler {
    /**
     * Log an error with context
     */
    logError(error: Error | ExtendedError, context?: ErrorContext): void;

    /**
     * Log a warning with context
     */
    logWarning(message: string, context?: ErrorContext): void;

    /**
     * Log an informational message with context
     */
    logInfo(message: string, context?: ErrorContext): void;

    /**
     * Logs an error with context
     * 
     * @param error - The error object or error options
     * @param context - Optional context information
     */
    logError(error: Error | CustomErrorOptions, context?: string): void;
    
    /**
     * Create a standardized error response
     */
    createErrorResponse(
      status: number,
      message: string,
      error?: Error | ExtendedError
    ): Response;
    
    /**
     * Creates a custom error with extended properties
     * 
     * @param options - Options for creating the custom error
     * @returns An Error object with extended properties
     */
    createCustomError(options: CustomErrorOptions): ExtendedError;

    /**
     * Static method to log an error with context
     * 
     * @param error - The error object or error options
     * @param context - Optional context information
     */
    static logError(error: Error | CustomErrorOptions, context?: string): void;

    /**
     * Static method to log a warning with context
     */
    static logWarning(message: string, context?: ErrorContext): void;

    /**
     * Static method to log an informational message with context
     */
    static logInfo(message: string, context?: ErrorContext): void;

    /**
     * Static method to create a standardized error response
     */
    static createErrorResponse(
      status: number,
      message: string,
      error?: Error | ExtendedError
    ): Response;
    
    /**
     * Static method to create a custom error with extended properties
     * @param options Options for creating the custom error
     * @returns An Error object with extended properties
     */
    static createCustomError(options: CustomErrorOptions): ExtendedError;
  }

  const errorHandler: ErrorHandler;
  
  // Add static methods to make ErrorHandler work both as instance and static class
  namespace errorHandler {
    export function logError(error: Error | CustomErrorOptions, context?: string): void;
    export function logWarning(message: string, context?: ErrorContext): void;
    export function logInfo(message: string, context?: ErrorContext): void;
    export function createErrorResponse(
      status: number,
      message: string,
      error?: Error
    ): Response;
  }
  
  export default errorHandler;
}
