import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to ensure mock functions are hoisted to the top
const mockBroadcastWorkflowUpdate = vi.hoisted(() => vi.fn());
const mockBroadcastWorkflowProgress = vi.hoisted(() => vi.fn());
const mockBroadcastWorkflowError = vi.hoisted(() => vi.fn());

// Mock WebSocketServer
vi.mock('@/lib/websocket/server', () => ({
  default: {
    getInstance: vi.fn(() => ({
      broadcastWorkflowUpdate: mockBroadcastWorkflowUpdate,
      broadcastWorkflowProgress: mockBroadcastWorkflowProgress,
      broadcastWorkflowError: mockBroadcastWorkflowError,
    })),
  },
}));

import WebSocketServer from '@/lib/websocket/server';

describe('WebSocketServer Workflow Events', () => {
  let wsServer: any;

  beforeEach(() => {
    vi.clearAllMocks();
    wsServer = WebSocketServer.getInstance();
  });

  it('broadcasts workflow update', () => {
    const update = { workflowId: 'wf1', status: 'ACTIVE' as const, timestamp: new Date() };
    
    wsServer.broadcastWorkflowUpdate(update);
    
    expect(mockBroadcastWorkflowUpdate).toHaveBeenCalledWith(update);
  });

  it('broadcasts workflow progress', () => {
    wsServer.broadcastWorkflowProgress('wf2', 0.5, 'Test Node');
    
    expect(mockBroadcastWorkflowProgress).toHaveBeenCalledWith('wf2', 0.5, 'Test Node');
  });

  it('broadcasts workflow error', () => {
    wsServer.broadcastWorkflowError('wf3', 'Something went wrong');
    
    expect(mockBroadcastWorkflowError).toHaveBeenCalledWith('wf3', 'Something went wrong');
  });
}); 