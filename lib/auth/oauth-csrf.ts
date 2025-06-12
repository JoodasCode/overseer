import crypto from 'crypto'

// Simple in-memory store for CSRF tokens (in production, use Redis or database)
const csrfTokens = new Map<string, { token: string; expires: number; userId?: string }>()

export interface CSRFTokenData {
  token: string
  expires: number
  userId?: string
}

/**
 * Generate a secure CSRF token for OAuth flows
 */
export function generateCSRFToken(userId?: string): string {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = Date.now() + (10 * 60 * 1000) // 10 minutes
  
  csrfTokens.set(token, {
    token,
    expires,
    userId
  })
  
  // Clean up expired tokens periodically
  if (Math.random() < 0.1) { // 10% chance
    cleanupExpiredTokens()
  }
  
  return token
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string, userId?: string): boolean {
  const tokenData = csrfTokens.get(token)
  
  if (!tokenData) {
    return false
  }
  
  // Check if token is expired
  if (Date.now() > tokenData.expires) {
    csrfTokens.delete(token)
    return false
  }
  
  // Check if userId matches (if provided)
  if (userId && tokenData.userId && tokenData.userId !== userId) {
    return false
  }
  
  return true
}

/**
 * Consume a CSRF token (removes it after validation)
 */
export function consumeCSRFToken(token: string, userId?: string): boolean {
  const isValid = validateCSRFToken(token, userId)
  
  if (isValid) {
    csrfTokens.delete(token)
  }
  
  return isValid
}

/**
 * Create OAuth state parameter with CSRF protection
 * Format: base64(userId:csrfToken:timestamp)
 */
export function createOAuthState(userId: string): string {
  const csrfToken = generateCSRFToken(userId)
  const timestamp = Date.now()
  const stateData = `${userId}:${csrfToken}:${timestamp}`
  
  return Buffer.from(stateData).toString('base64url')
}

/**
 * Parse and validate OAuth state parameter
 */
export function parseOAuthState(state: string): {
  userId: string | null
  isValid: boolean
  error?: string
} {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf-8')
    const [userId, csrfToken, timestampStr] = decoded.split(':')
    
    if (!userId || !csrfToken || !timestampStr) {
      return {
        userId: null,
        isValid: false,
        error: 'Invalid state format'
      }
    }
    
    const timestamp = parseInt(timestampStr, 10)
    const now = Date.now()
    
    // Check if state is too old (max 10 minutes)
    if (now - timestamp > 10 * 60 * 1000) {
      return {
        userId: null,
        isValid: false,
        error: 'State parameter expired'
      }
    }
    
    // Validate CSRF token
    const isValid = consumeCSRFToken(csrfToken, userId)
    
    if (!isValid) {
      return {
        userId: null,
        isValid: false,
        error: 'Invalid or expired CSRF token'
      }
    }
    
    return {
      userId,
      isValid: true
    }
    
  } catch (error) {
    return {
      userId: null,
      isValid: false,
      error: 'Failed to parse state parameter'
    }
  }
}

/**
 * Clean up expired CSRF tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now()
  
  for (const [token, data] of csrfTokens.entries()) {
    if (now > data.expires) {
      csrfTokens.delete(token)
    }
  }
}

/**
 * Get current token count (for monitoring)
 */
export function getTokenCount(): number {
  cleanupExpiredTokens()
  return csrfTokens.size
} 