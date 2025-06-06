/**
 * Utility functions for the Plugin Engine
 */

import { PluginResult } from './types';

/**
 * Create a successful result object
 * @param message Success message
 * @param data Optional data payload
 * @param metadata Optional metadata
 * @returns PluginResult with success flag set to true
 */
export function createSuccessResult<T = any>(
  message: string,
  data?: T,
  metadata?: Record<string, any>
): PluginResult<T> {
  return {
    success: true,
    message,
    data,
    metadata
  };
}

/**
 * Create an error result object
 * @param message Error message
 * @param code Error code
 * @param details Optional error details
 * @returns PluginResult with success flag set to false
 */
export function createErrorResult(
  message: string,
  code: string = 'unknown_error',
  details?: any
): PluginResult {
  return {
    success: false,
    message,
    error: {
      code,
      message,
      details
    }
  };
}

/**
 * Format a date string to ISO format with timezone
 * @param date Date to format
 * @returns ISO string with timezone
 */
export function formatDateISO(date: Date): string {
  return date.toISOString();
}

/**
 * Check if a date is in the past
 * @param dateString ISO date string
 * @returns true if date is in the past
 */
export function isDateInPast(dateString: string): boolean {
  const date = new Date(dateString);
  return date < new Date();
}

/**
 * Check if a date is in the future
 * @param dateString ISO date string
 * @returns true if date is in the future
 */
export function isDateInFuture(dateString: string): boolean {
  const date = new Date(dateString);
  return date > new Date();
}

/**
 * Generate a random string for CSRF tokens
 * @param length Length of the string
 * @returns Random string
 */
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
  }
  
  return result;
}

/**
 * Safely parse JSON with error handling
 * @param jsonString JSON string to parse
 * @param fallback Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    return fallback;
  }
}

/**
 * Safely stringify JSON with error handling
 * @param value Value to stringify
 * @param fallback Fallback string if stringification fails
 * @returns JSON string or fallback
 */
export function safeJsonStringify(value: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return fallback;
  }
}

/**
 * Create a cache key for Redis
 * @param prefix Key prefix
 * @param parts Key parts
 * @returns Formatted cache key
 */
export function createCacheKey(prefix: string, ...parts: string[]): string {
  return [prefix, ...parts].join(':');
}

/**
 * Validate an email address format
 * @param email Email to validate
 * @returns true if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Truncate a string to a maximum length with ellipsis
 * @param str String to truncate
 * @param maxLength Maximum length
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Deep merge two objects
 * @param target Target object
 * @param source Source object
 * @returns Merged object
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
  const output = { ...target } as T;
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const k = key as keyof T;
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[k] = deepMerge(target[k] as Record<string, any>, source[key]) as any;
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

/**
 * Check if a value is an object
 * @param item Value to check
 * @returns true if value is an object
 */
function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Parse a duration string into milliseconds
 * @param duration Duration string (e.g., "1h", "30m", "1d")
 * @returns Milliseconds
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 0;
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

/**
 * Format milliseconds to a human-readable duration
 * @param ms Milliseconds
 * @returns Human-readable duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60 * 1000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 60 * 60 * 1000) return `${Math.floor(ms / (60 * 1000))}m`;
  if (ms < 24 * 60 * 60 * 1000) return `${Math.floor(ms / (60 * 60 * 1000))}h`;
  return `${Math.floor(ms / (24 * 60 * 60 * 1000))}d`;
}
