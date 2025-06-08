import { NextRequest } from 'next/server';
import { POST, DELETE, PATCH } from '@/app/api/workflows/[id]/schedule/route';
import { prisma } from '@/lib/prisma';
import { WorkflowStatus } from '@prisma/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    workflow: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    workflowExecution: {
      create: vi.fn()
    }
  }
}));

vi.mock('@/lib/api-utils/auth', () => ({
  authenticate: vi.fn().mockResolvedValue({
    user: { id: 'test-user-id' },
    errorResponse: null
  })
}));

vi.mock('@/lib/workflow/scheduler', () => ({
  scheduleWorkflow: vi.fn(),
  cancelScheduledWorkflow: vi.fn(),
  pauseScheduledWorkflow: vi.fn(),
  resumeScheduledWorkflow: vi.fn()
}));

describe('Workflow Scheduling API Routes', () => {
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock request
    mockRequest = new NextRequest('http://localhost:3000/api/workflows/123/schedule');
  });
  
  describe('POST /api/workflows/[id]/schedule', () => {
    it('should schedule a workflow successfully', async () => {
      // Mock workflow data
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'A test workflow',
        status: WorkflowStatus.ACTIVE,
        user_id: 'user-1',
        created_at: new Date(),
        updated_at: new Date(),
        triggers: [],
        actions: [],
        config: {},
      };
      
      // Mock Prisma responses
      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow);
      
      // Create request with schedule data
      mockRequest = new NextRequest('http://localhost:3000/api/workflows/123/schedule', {
        method: 'POST',
        body: JSON.stringify({
          cron: '0 0 * * *',
          timezone: 'UTC',
          startDate: '2024-03-20T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z'
        })
      });
      
      // Call the API handler
      const response = await POST(mockRequest, { params: { id: '123' } });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('message', 'Workflow scheduled successfully');
      expect(responseData).toHaveProperty('schedule');
      expect(responseData.schedule).toHaveProperty('cron', '0 0 * * *');
    });
    
    it('should return 400 if cron is missing', async () => {
      // Create request without cron
      mockRequest = new NextRequest('http://localhost:3000/api/workflows/123/schedule', {
        method: 'POST',
        body: JSON.stringify({
          timezone: 'UTC'
        })
      });
      
      // Call the API handler
      const response = await POST(mockRequest, { params: { id: '123' } });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Missing required field: cron');
    });
    
    it('should return 404 if workflow not found', async () => {
      // Mock workflow not found
      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(null);
      
      // Create request with schedule data
      mockRequest = new NextRequest('http://localhost:3000/api/workflows/123/schedule', {
        method: 'POST',
        body: JSON.stringify({
          cron: '0 0 * * *'
        })
      });
      
      // Call the API handler
      const response = await POST(mockRequest, { params: { id: '123' } });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(404);
      expect(responseData).toHaveProperty('error', 'Workflow not found');
    });
  });
  
  describe('DELETE /api/workflows/[id]/schedule', () => {
    it('should cancel a scheduled workflow successfully', async () => {
      // Mock workflow data
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'A test workflow',
        status: WorkflowStatus.ACTIVE,
        user_id: 'user-1',
        created_at: new Date(),
        updated_at: new Date(),
        triggers: [],
        actions: [],
        config: {},
      };
      
      // Mock Prisma responses
      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow);
      
      // Create request
      mockRequest = new NextRequest('http://localhost:3000/api/workflows/123/schedule', {
        method: 'DELETE'
      });
      
      // Call the API handler
      const response = await DELETE(mockRequest, { params: { id: '123' } });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('message', 'Workflow schedule cancelled successfully');
    });
  });
  
  describe('PATCH /api/workflows/[id]/schedule', () => {
    it('should pause a scheduled workflow successfully', async () => {
      // Mock workflow data
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'A test workflow',
        status: WorkflowStatus.ACTIVE,
        user_id: 'user-1',
        created_at: new Date(),
        updated_at: new Date(),
        triggers: [],
        actions: [],
        config: {},
      };
      
      // Mock Prisma responses
      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow);
      
      // Create request
      mockRequest = new NextRequest('http://localhost:3000/api/workflows/123/schedule', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'pause'
        })
      });
      
      // Call the API handler
      const response = await PATCH(mockRequest, { params: { id: '123' } });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('message', 'Workflow schedule paused successfully');
    });
    
    it('should resume a scheduled workflow successfully', async () => {
      // Mock workflow data
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'A test workflow',
        status: WorkflowStatus.DRAFT,
        user_id: 'user-1',
        created_at: new Date(),
        updated_at: new Date(),
        triggers: [],
        actions: [],
        config: {},
      };
      
      // Mock Prisma responses
      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow);
      
      // Create request
      mockRequest = new NextRequest('http://localhost:3000/api/workflows/123/schedule', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'resume'
        })
      });
      
      // Call the API handler
      const response = await PATCH(mockRequest, { params: { id: '123' } });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('message', 'Workflow schedule resumed successfully');
    });
    
    it('should return 400 for invalid action', async () => {
      // Create request with invalid action
      mockRequest = new NextRequest('http://localhost:3000/api/workflows/123/schedule', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'invalid'
        })
      });
      
      // Call the API handler
      const response = await PATCH(mockRequest, { params: { id: '123' } });
      const responseData = await response.json();
      
      // Verify response
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Invalid action. Supported actions: pause, resume');
    });
  });
}); 