/**
 * LLM API Key Manager for Overseer
 * Handles secure storage and retrieval of API keys for BYO-LLM
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { prisma } from '../db/prisma';

// Supported LLM providers
export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'mistral';

/**
 * LLM API Key Manager class
 * Handles encryption, storage, and retrieval of API keys
 */
export class LLMKeyManager {
  private encryptionKey: Buffer;
  
  constructor() {
    // In production, this should be loaded from environment variables
    // For now, we'll use a placeholder that gets regenerated on server restart
    // IMPORTANT: In production, use a persistent key stored securely!
    const envKey = process.env.API_KEY_ENCRYPTION_KEY;
    
    if (envKey) {
      // Use the environment variable if available
      this.encryptionKey = Buffer.from(envKey, 'hex');
    } else {
      // Generate a random key (this is just for development)
      // WARNING: This will cause all encrypted keys to be invalid after server restart
      this.encryptionKey = randomBytes(32);
      console.warn('WARNING: Using temporary encryption key. API keys will be invalidated on server restart.');
    }
  }
  
  /**
   * Encrypt an API key
   */
  private encryptKey(apiKey: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Store IV with the encrypted data
    return `${iv.toString('hex')}:${encrypted}`;
  }
  
  /**
   * Decrypt an API key
   */
  private decryptKey(encryptedKey: string): string {
    const [ivHex, encryptedData] = encryptedKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * Store a new API key
   */
  public async storeApiKey(
    userId: string,
    provider: LLMProvider,
    keyName: string,
    apiKey: string,
    isDefault: boolean = false
  ): Promise<string> {
    // Encrypt the API key
    const encryptedKey = this.encryptKey(apiKey);
    
    // If this is set as default, unset any existing default keys for this provider
    if (isDefault) {
      await prisma.lLMApiKey.updateMany({
        where: {
          user_id: userId,
          provider,
          is_default: true,
        },
        data: {
          is_default: false,
        },
      });
    }
    
    // Store in database
    const keyRecord = await prisma.lLMApiKey.create({
      data: {
        user_id: userId,
        provider,
        key_name: keyName,
        encrypted_key: encryptedKey,
        is_default: isDefault,
      },
    });
    
    return keyRecord.id;
  }
  
  /**
   * Retrieve an API key
   */
  public async getApiKey(keyId: string, userId: string): Promise<string | null> {
    // Get the encrypted key from database
    const keyRecord = await prisma.lLMApiKey.findFirst({
      where: {
        id: keyId,
        user_id: userId, // Ensure user owns this key
      },
    });
    
    if (!keyRecord) {
      return null;
    }
    
    // Decrypt and return
    return this.decryptKey(keyRecord.encrypted_key);
  }
  
  /**
   * Get default API key for a provider
   */
  public async getDefaultApiKey(userId: string, provider: LLMProvider): Promise<string | null> {
    // Get the default key for this provider
    const keyRecord = await prisma.lLMApiKey.findFirst({
      where: {
        user_id: userId,
        provider,
        is_default: true,
      },
    });
    
    if (!keyRecord) {
      return null;
    }
    
    // Decrypt and return
    return this.decryptKey(keyRecord.encrypted_key);
  }
  
  /**
   * List all API keys for a user (without the actual keys)
   */
  public async listApiKeys(userId: string): Promise<any[]> {
    const keys = await prisma.lLMApiKey.findMany({
      where: {
        user_id: userId,
      },
      select: {
        id: true,
        provider: true,
        key_name: true,
        is_default: true,
        created_at: true,
        updated_at: true,
      },
    });
    
    return keys;
  }
  
  /**
   * Delete an API key
   */
  public async deleteApiKey(keyId: string, userId: string): Promise<boolean> {
    try {
      await prisma.lLMApiKey.delete({
        where: {
          id: keyId,
          user_id: userId, // Ensure user owns this key
        },
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Set a key as the default for its provider
   */
  public async setDefaultKey(keyId: string, userId: string): Promise<boolean> {
    try {
      // Get the key to find its provider
      const key = await prisma.lLMApiKey.findFirst({
        where: {
          id: keyId,
          user_id: userId,
        },
      });
      
      if (!key) {
        return false;
      }
      
      // Unset any existing default keys for this provider
      await prisma.lLMApiKey.updateMany({
        where: {
          user_id: userId,
          provider: key.provider,
          is_default: true,
        },
        data: {
          is_default: false,
        },
      });
      
      // Set this key as default
      await prisma.lLMApiKey.update({
        where: {
          id: keyId,
        },
        data: {
          is_default: true,
        },
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
export const llmKeyManager = new LLMKeyManager();
