/**
 * Validation utilities for API routes
 */
import { NextResponse } from 'next/server';

/**
 * Validates a UUID string
 * @param id The UUID string to validate
 * @returns Boolean indicating if the string is a valid UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validates required fields in a request body
 * @param body The request body object
 * @param requiredFields Array of field names that are required
 * @returns Object with validation result and error response if invalid
 */
export function validateRequiredFields(body: any, requiredFields: string[]): { 
  isValid: boolean; 
  errorResponse?: NextResponse 
} {
  const missingFields = requiredFields.filter(field => !body[field]);
  
  if (missingFields.length > 0) {
    return {
      isValid: false,
      errorResponse: NextResponse.json(
        { 
          error: 'Missing required fields', 
          missingFields 
        },
        { status: 400 }
      )
    };
  }
  
  return { isValid: true };
}

/**
 * Validates a date string
 * @param dateStr The date string to validate
 * @returns Object with validation result and parsed date if valid
 */
export function validateDate(dateStr: string): { 
  isValid: boolean; 
  date?: Date;
  errorResponse?: NextResponse 
} {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        errorResponse: NextResponse.json(
          { error: 'Invalid date format. Please use ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)' },
          { status: 400 }
        )
      };
    }
    return { isValid: true, date };
  } catch (e) {
    return {
      isValid: false,
      errorResponse: NextResponse.json(
        { error: 'Invalid date format. Please use ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)' },
        { status: 400 }
      )
    };
  }
}

/**
 * Validates an enum value
 * @param value The value to validate
 * @param enumObject The enum object to validate against
 * @returns Object with validation result and error response if invalid
 */
export function validateEnum<T extends object>(value: any, enumObject: T): {
  isValid: boolean;
  validValue?: T[keyof T];
  errorResponse?: NextResponse
} {
  const validValues = Object.values(enumObject);
  
  if (validValues.includes(value)) {
    return { isValid: true, validValue: value };
  }
  
  return {
    isValid: false,
    errorResponse: NextResponse.json(
      { error: 'Invalid enum value', validValues },
      { status: 400 }
    )
  };
}

/**
 * Creates a standardized error response
 * @param message Error message
 * @param status HTTP status code
 * @param details Additional error details
 * @returns NextResponse with formatted error
 */
export function createErrorResponse(message: string, status: number, details?: any): NextResponse {
  return NextResponse.json(
    { 
      error: message, 
      ...(details ? { details } : {})
    },
    { status }
  );
}
