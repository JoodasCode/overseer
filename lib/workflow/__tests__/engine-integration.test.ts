import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Workflow, WorkflowNode } from '../types';

// Use vi.hoisted to ensure mock functions are hoisted to the top
const mockBroadcastWorkflowUpdate = vi.hoisted(() => vi.fn());
const mockBroadcastWorkflowProgress = vi.hoisted(() => vi.fn());
const mockBroadcastWorkflowError = vi.hoisted(() => vi.fn());
const mockPrismaUpdate = vi.hoisted(() => vi.fn());
const mockExecuteTaskIntent = vi.hoisted(() => vi.fn());

// Mock WebSocketServer
vi.mock('@/lib/websocket/server', () => ({
  default: {
    getInstance: () => ({
      broadcastWorkflowUpdate: mockBroadcastWorkflowUpdate,
      broadcastWorkflowProgress: mockBroadcastWorkflowProgress,
      broadcastWorkflowError: mockBroadcastWorkflowError,
    }),
  },
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    workflow: {
      update: mockPrismaUpdate,
    },
  },
}));

// Mock PluginEngine
vi.mock('../../plugin-engine', () => ({
  createPluginEngine: vi.fn(() => ({
    executeTaskIntent: mockExecuteTaskIntent,
  })),
}));

import { executeWorkflow } from '../engine';

describe('Workflow Engine Integration', () => {
  const baseWorkflow: Workflow = {
    id: 'wf1',
    name: 'Test Workflow',
    description: 'Integration test',
    nodes: [],
    agent_id: 'agent1',
    user_id: 'user1',
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock timers to speed up retry delays
    vi.useFakeTimers();
    
    // Set up default successful responses
    mockPrismaUpdate.mockResolvedValue({ id: 'wf1' });
    mockExecuteTaskIntent.mockResolvedValue({ success: true, message: 'Task executed', data: {} });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes all nodes successfully', async () => {
    const nodes: WorkflowNode[] = [
      { id: 'n1', name: 'Send Slack', type: 'slack', config: { type: 'send' } },
      { id: 'n2', name: 'Send Gmail', type: 'gmail', config: { type: 'send' } },
    ];
    const workflow = { ...baseWorkflow, nodes };
    
    const result = await executeWorkflow(workflow);
    
    expect(result.success).toBe(true);
    expect(mockExecuteTaskIntent).toHaveBeenCalledTimes(2);
    expect(mockBroadcastWorkflowUpdate).toHaveBeenCalled();
    expect(mockBroadcastWorkflowProgress).toHaveBeenCalledTimes(2);
    expect(mockPrismaUpdate).toHaveBeenCalledTimes(2); // Start and end status updates
  });

  it('retries on failure and fails after max retries', async () => {
    // Mock task execution to always fail
    mockExecuteTaskIntent.mockRejectedValue(new Error('Intent failed'));
    
    const nodes: WorkflowNode[] = [
      { id: 'n1', name: 'Fail Node', type: 'fail', config: { type: 'fail' } },
    ];
    const workflow = { ...baseWorkflow, nodes };
    
    // Start the workflow execution
    const resultPromise = executeWorkflow(workflow);
    
    // Fast-forward through all the retry delays
    await vi.runAllTimersAsync();
    
    const result = await resultPromise;
    
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Intent failed/);
    expect(mockExecuteTaskIntent).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    expect(mockBroadcastWorkflowError).toHaveBeenCalled();
  });
}); 