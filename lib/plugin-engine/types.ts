/**
 * Core types for the Agent Plugin Engine
 */

// Base types for plugin system
export interface PluginMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  scopes: string[];
  configSchema?: Record<string, any>;
}

export interface AuthStatus {
  connected: boolean;
  expiresAt?: string;
  error?: string;
  scopes?: string[];
}

export interface PluginResult<T = any> {
  success: boolean;
  message: string;
  data?: T;
  externalId?: string;
  metadata?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Core plugin adapter interface
export interface PluginAdapter {
  connect(userId: string): Promise<AuthStatus>;
  isConnected(userId: string): Promise<boolean>;
  send(agentId: string, payload: any): Promise<PluginResult>;
  fetch(agentId: string, query?: any): Promise<PluginResult>;
  disconnect(userId: string): Promise<void>;
  getMetadata(): PluginMetadata;
}

// Task intent payload
export interface TaskIntent {
  agentId: string;
  userId: string;
  tool: string;
  intent: string;
  context: Record<string, any>;
  scheduledTime?: Date;
}

// Integration record
export interface Integration {
  id: string;
  userId: string;
  agentId?: string;
  toolName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked' | 'error';
  scopes: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Scheduled task
export interface ScheduledTask {
  id: string;
  agentId: string;
  userId: string;
  tool: string;
  action: string;
  payload: Record<string, any>;
  executeAt: string;
  status: 'scheduled' | 'processing' | 'completed' | 'failed';
  attempts: number;
  result?: PluginResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// Error log
export interface ErrorLog {
  id: string;
  agentId: string;
  userId: string;
  tool: string;
  action: string;
  errorCode: string;
  errorMessage: string;
  payload?: Record<string, any>;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

// Context mapping
export interface ContextMapping {
  id: string;
  agentId: string;
  userId: string;
  tool: string;
  contextKey: string;
  friendlyName?: string;
  externalId: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskResult {
  success: boolean;
  message?: string;
  data?: any;
}

export interface PluginEngine {
  registerAdapter(name: string, adapter: any): void;
  processIntent(intent: TaskIntent): Promise<TaskResult>;
  executeTaskIntent?(taskIntent: {
    type: string;
    config: Record<string, any>;
    agent_id: string;
    user_id: string;
  }): Promise<TaskResult>;
}
