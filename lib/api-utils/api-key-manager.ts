/**
 * API Key Management Utilities
 * Provides functions for creating, validating, and managing API keys
 */
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

// API key prefix
const API_KEY_PREFIX = 'osk_';

// Default expiration in days (30 days)
const DEFAULT_EXPIRATION_DAYS = 30;

// Available API key scopes
export enum ApiKeyScope {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin',
  ALL = '*'
}

export interface ApiKeyMetadata {
  id: string;
  name: string;
  created_at: string;
  expires_at?: string;
  last_used?: string;
  key_preview: string;
  scopes: ApiKeyScope[];
  description?: string;
}

/**
 * Generates a new API key with the osk_ prefix
 * @returns A new API key string
 */
export function generateApiKey(): string {
  const randomPart = randomUUID().replace(/-/g, '').substring(0, 32);
  return `${API_KEY_PREFIX}${randomPart}`;
}

/**
 * Creates API key metadata
 * @param name Name of the API key
 * @param options Additional options for the API key
 * @returns API key metadata object
 */
export function createApiKeyMetadata(
  name: string,
  options: {
    scopes?: ApiKeyScope[];
    expirationDays?: number;
    description?: string;
  } = {}
): ApiKeyMetadata {
  const now = new Date();
  const expirationDays = options.expirationDays || DEFAULT_EXPIRATION_DAYS;
  
  // Calculate expiration date if provided
  const expiresAt = expirationDays > 0 
    ? new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
    : undefined;
  
  return {
    id: randomUUID(),
    name,
    created_at: now.toISOString(),
    expires_at: expiresAt,
    key_preview: '', // Will be filled when key is generated
    scopes: options.scopes || [ApiKeyScope.ALL],
    description: options.description
  };
}

/**
 * Validates if an API key has the required scope
 * @param userScopes The scopes associated with the API key
 * @param requiredScope The scope required for the operation
 * @returns Whether the API key has the required scope
 */
export function hasScope(userScopes: ApiKeyScope[], requiredScope: ApiKeyScope): boolean {
  // ALL scope grants access to everything
  if (userScopes.includes(ApiKeyScope.ALL)) {
    return true;
  }
  
  // ADMIN scope grants access to everything except ALL
  if (requiredScope !== ApiKeyScope.ALL && userScopes.includes(ApiKeyScope.ADMIN)) {
    return true;
  }
  
  // Direct match
  return userScopes.includes(requiredScope);
}

/**
 * Checks if an API key is expired
 * @param expiresAt Expiration date string
 * @returns Whether the API key is expired
 */
export function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false; // No expiration date means never expires
  
  const expirationDate = new Date(expiresAt);
  const now = new Date();
  
  return expirationDate < now;
}

/**
 * Updates the last used timestamp for an API key
 * @param userId The user ID
 * @param apiKeyId The API key ID
 */
export async function updateApiKeyUsage(userId: string, apiKeyId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { api_key_metadata: true }
    });
    
    if (!user) return;
    
    const metadata = user.api_key_metadata as ApiKeyMetadata[] || [];
    const updatedMetadata = metadata.map(meta => 
      meta.id === apiKeyId 
        ? { ...meta, last_used: new Date().toISOString() }
        : meta
    );
    
    await prisma.user.update({
      where: { id: userId },
      data: { api_key_metadata: updatedMetadata }
    });
  } catch (error) {
    console.error('Failed to update API key usage:', error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Validates an API key format
 * @param apiKey The API key to validate
 * @returns Whether the API key format is valid
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  return apiKey.startsWith(API_KEY_PREFIX) && apiKey.length >= 36;
}
