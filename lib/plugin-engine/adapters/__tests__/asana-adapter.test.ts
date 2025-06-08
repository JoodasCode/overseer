/*
  Asana Adapter Unit Tests
  ------------------------
  - These tests use Vitest mocks to simulate Asana API responses.
  - No real network requests are made; this makes tests fast and safe.
  - We check that our code behaves correctly when the Asana API works or fails.
  - Real API integration tests are in a separate file (asana-adapter.integration.test.ts).

  In plain English:
  - These tests pretend to talk to Asana, so we can check our code quickly and safely.
  - We only talk to the real Asana service in special integration tests.
*/

/**
 * Asana Adapter Tests
 * 
 * This file contains unit tests for the AsanaAdapter class.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to ensure mock functions are hoisted to the top
const mockRedisGet = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockRedisSet = vi.hoisted(() => vi.fn().mockResolvedValue('OK'));
const mockRedisIncr = vi.hoisted(() => vi.fn().mockResolvedValue(1));
const mockRedisExpire = vi.hoisted(() => vi.fn().mockResolvedValue(1));
const mockRedisDel = vi.hoisted(() => vi.fn().mockResolvedValue(1));

// Create hoisted mock functions for IntegrationManager
const mockGetIntegration = vi.hoisted(() => vi.fn());
const mockIsConnected = vi.hoisted(() => vi.fn());
const mockStoreIntegration = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockDisconnect = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockRemoveIntegration = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

// Create hoisted mock functions for fetch
const mockFetch = vi.hoisted(() => vi.fn());

// Create a chainable mock object for Supabase
const createSupabaseChain = () => {
  const chainObj: any = {};
  const methods = ['from', 'insert', 'update', 'select', 'eq', 'in', 'order', 'limit', 'single', 'rpc', 'gte', 'group', 'delete'];
  
  methods.forEach(method => {
    chainObj[method] = vi.fn().mockImplementation(() => chainObj);
  });
  
  return chainObj;
};

// Create hoisted versions of the mock functions
const mockSupabaseFrom = vi.hoisted(() => vi.fn().mockImplementation(() => createSupabaseChain()));

// Mock modules with vi.mock
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => ({
    get: mockRedisGet,
    set: mockRedisSet,
    incr: mockRedisIncr,
    del: mockRedisDel,
    expire: mockRedisExpire
  }))
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockSupabaseFrom
  }))
}));

// Mock global fetch
global.fetch = mockFetch;

// Mock ErrorHandler
vi.mock('../../error-handler', () => ({
  ErrorHandler: {
    getInstance: () => ({
      logError: vi.fn(),
      handleError: vi.fn(),
    }),
  },
}));

// Mock IntegrationManager
vi.mock('../../integration-manager', () => ({
  IntegrationManager: {
    getInstance: () => ({
      getIntegration: mockGetIntegration,
      isConnected: mockIsConnected,
      storeIntegration: mockStoreIntegration,
      disconnect: mockDisconnect,
      removeIntegration: mockRemoveIntegration,
    }),
  },
}));

// Set environment variables for testing
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test-url.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');
vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test-redis-url');
vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');

import { AsanaAdapter } from '../asana-adapter';
import { IntegrationManager } from '../../integration-manager';

describe('AsanaAdapter', () => {
  let adapter: AsanaAdapter;
  let mockIntegrationManager: any;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Get mock integration manager
    mockIntegrationManager = IntegrationManager.getInstance();
    
    // Set up default mocks
    mockGetIntegration.mockResolvedValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      status: 'active',
      scopes: ['default'],
    });
    
    mockIsConnected.mockResolvedValue({ connected: true });
    
    // Create adapter instance
    adapter = new AsanaAdapter();
  });
  
  describe('connect', () => {
    it('should return connected status when integration exists', async () => {
      const result = await adapter.connect('user-123');
      
      expect(result).toEqual({
        connected: true,
        scopes: ['default'],
      });
    });
  });
  
  describe('send', () => {
    it('should create a task successfully', async () => {
      const mockTaskData = { 
        data: { 
          gid: 'task-123', 
          name: 'Test Task',
          notes: 'Test Description' 
        } 
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockTaskData),
        ok: true,
        status: 200,
      });
      
      const result = await adapter.send('agent-123', {
        action: 'create_task',
        name: 'Test Task',
        notes: 'Test Description',
        projectId: 'project-123',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Test Task');
      expect(result.data.notes).toBe('Test Description');
      expect(result.data.projectId).toBe('project-123');
      expect(result.data.gid).toMatch(/^task_\d+$/);
    });
    
    it('should update a task successfully', async () => {
      const mockTaskData = { 
        data: { 
          gid: 'task-123', 
          name: 'Updated Task' 
        } 
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockTaskData),
        ok: true,
        status: 200,
      });
      
      const result = await adapter.send('agent-123', {
        action: 'update_task',
        taskId: 'task-123',
        name: 'Updated Task',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.gid).toBe('task-123');
      expect(result.data.name).toBe('Updated Task');
    });
    
    it('should delete a task successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ data: {} }),
        ok: true,
        status: 204,
      });
      
      const result = await adapter.send('agent-123', {
        action: 'delete_task',
        taskId: 'task-123',
      });
      
      expect(result.success).toBe(true);
    });
    
    it('should handle errors when sending data', async () => {
      // Test with missing required field to trigger validation error
      const result = await adapter.send('agent-123', {
        action: 'create_task',
        name: 'Test Task',
        // Missing projectId to trigger validation error
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required fields');
    });
  });
  
  describe('fetch', () => {
    it('should fetch workspaces successfully', async () => {
      const mockWorkspaces = { 
        data: [
          { gid: 'workspace-1', name: 'Workspace 1' }
        ] 
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockWorkspaces),
        ok: true,
        status: 200,
      });
      
      const result = await adapter.fetch('agent-123', {
        action: 'list_workspaces',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWorkspaces.data);
    });
    
    it('should fetch projects successfully', async () => {
      const mockProjects = { 
        data: [
          { gid: 'project-1', name: 'Project 1' }
        ] 
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockProjects),
        ok: true,
        status: 200,
      });
      
      const result = await adapter.fetch('agent-123', {
        action: 'list_projects',
        workspace: 'workspace-123',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProjects.data);
    });
    
    it('should fetch tasks successfully', async () => {
      const mockTasks = { 
        data: [
          { gid: 'task-1', name: 'Task 1' }
        ] 
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockTasks),
        ok: true,
        status: 200,
      });
      
      const result = await adapter.fetch('agent-123', {
        action: 'list_tasks',
        project: 'project-123',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTasks.data);
    });
    
    it('should fetch a single task successfully', async () => {
      const mockTask = { 
        data: { 
          gid: 'task-123', 
          name: 'Task 123' 
        } 
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockTask),
        ok: true,
        status: 200,
      });
      
      const result = await adapter.fetch('agent-123', {
        action: 'get_task',
        taskId: 'task-123',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask.data);
    });
    
    it('should handle errors when fetching data', async () => {
      // Test with unknown action to trigger validation error
      const result = await adapter.fetch('agent-123', {
        action: 'unknown_action',
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown action');
    });
  });
  
  describe('isConnected', () => {
    it('should return true when integration exists', async () => {
      const result = await adapter.isConnected('user-123');
      expect(result).toBe(true);
    });
  });
  
  describe('getMetadata', () => {
    it('should return adapter metadata', () => {
      const metadata = adapter.getMetadata();
      
      expect(metadata).toEqual({
        id: 'asana',
        name: 'Asana',
        description: 'Create and manage tasks in Asana',
        version: '1.0.0',
        author: 'AgentOS',
        scopes: ['default']
      });
    });
  });
});
