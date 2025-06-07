/**
 * Asana Adapter Tests
 * 
 * This file contains unit tests for the AsanaAdapter class.
 */

import { AsanaAdapter } from '../asana-adapter';
import { ErrorHandler } from '../../error-handler';
import axios from 'axios';

// Import Jest types
import type { Mock } from 'jest';

// Make Jest globals available
declare global {
  const describe: (name: string, fn: () => void) => void;
  const beforeEach: (fn: () => void) => void;
  const it: (name: string, fn: () => Promise<void> | void) => void;
  const expect: any;
  namespace jest {
    function spyOn(object: any, methodName: string): Mock;
  }
}

// Mock dependencies
jest.mock('axios');
jest.mock('../../error-handler');
jest.mock('../../integration-manager', () => ({
  IntegrationManager: {
    getInstance: () => ({
      getIntegration: jest.fn().mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        status: 'active',
      }),
    }),
  },
}));

describe('AsanaAdapter', () => {
  let adapter: AsanaAdapter;
  let mockErrorHandler: any;
  
  beforeEach(() => {
    mockErrorHandler = ErrorHandler.getInstance();
    adapter = new AsanaAdapter();
    
    // Reset axios mock
    jest.spyOn(axios, 'get').mockReset();
    jest.spyOn(axios, 'post').mockReset();
    jest.spyOn(axios, 'put').mockReset();
    jest.spyOn(axios, 'delete').mockReset();
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
      (axios.post as jest.Mock).mockResolvedValueOnce({ data: mockTaskData });
      
      const result = await adapter.send('agent-123', {
        action: 'create_task',
        name: 'Test Task',
        notes: 'Test Description',
        workspace: 'workspace-123',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTaskData.data);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/tasks'),
        expect.any(Object),
        expect.any(Object)
      );
    });
    
    it('should update a task successfully', async () => {
      const mockTaskData = { 
        data: { 
          gid: 'task-123', 
          name: 'Updated Task' 
        } 
      };
      (axios.put as jest.Mock).mockResolvedValueOnce({ data: mockTaskData });
      
      const result = await adapter.send('agent-123', {
        action: 'update_task',
        taskId: 'task-123',
        name: 'Updated Task',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTaskData.data);
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/tasks/task-123'),
        expect.any(Object),
        expect.any(Object)
      );
    });
    
    it('should delete a task successfully', async () => {
      (axios.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
      
      const result = await adapter.send('agent-123', {
        action: 'delete_task',
        taskId: 'task-123',
      });
      
      expect(result.success).toBe(true);
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/tasks/task-123'),
        expect.any(Object)
      );
    });
    
    it('should handle errors when sending data', async () => {
      const mockError = new Error('API Error');
      (axios.post as jest.Mock).mockRejectedValueOnce(mockError);
      
      const result = await adapter.send('agent-123', {
        action: 'create_task',
        name: 'Test Task',
        workspace: 'workspace-123',
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to send data to Asana');
    });
  });
  
  describe('fetch', () => {
    it('should fetch workspaces successfully', async () => {
      const mockWorkspaces = { 
        data: [
          { gid: 'workspace-1', name: 'Workspace 1' }
        ] 
      };
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockWorkspaces });
      
      const result = await adapter.fetch('agent-123', {
        action: 'get_workspaces',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWorkspaces.data);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/workspaces'),
        expect.any(Object)
      );
    });
    
    it('should fetch projects successfully', async () => {
      const mockProjects = { 
        data: [
          { gid: 'project-1', name: 'Project 1' }
        ] 
      };
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockProjects });
      
      const result = await adapter.fetch('agent-123', {
        action: 'get_projects',
        workspace: 'workspace-123',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProjects.data);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/projects'),
        expect.any(Object)
      );
    });
    
    it('should fetch tasks successfully', async () => {
      const mockTasks = { 
        data: [
          { gid: 'task-1', name: 'Task 1' }
        ] 
      };
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockTasks });
      
      const result = await adapter.fetch('agent-123', {
        action: 'get_tasks',
        project: 'project-123',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTasks.data);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/projects/project-123/tasks'),
        expect.any(Object)
      );
    });
    
    it('should fetch a single task successfully', async () => {
      const mockTask = { 
        data: { 
          gid: 'task-123', 
          name: 'Task 123' 
        } 
      };
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockTask });
      
      const result = await adapter.fetch('agent-123', {
        action: 'get_task',
        taskId: 'task-123',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask.data);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/tasks/task-123'),
        expect.any(Object)
      );
    });
    
    it('should handle errors when fetching data', async () => {
      const mockError = new Error('API Error');
      (axios.get as jest.Mock).mockRejectedValueOnce(mockError);
      
      const result = await adapter.fetch('agent-123', {
        action: 'get_workspaces',
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to fetch data from Asana');
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
