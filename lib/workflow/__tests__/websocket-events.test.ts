import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WebSocketServer from '@/lib/websocket/server';

describe('WebSocketServer Workflow Events', () => {
  let wsServer: WebSocketServer;
  let mockEmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    wsServer = WebSocketServer.getInstance();
    mockEmit = vi.fn();
    (wsServer as any).emit = mockEmit;
  });

  it('broadcasts workflow update', () => {
    wsServer.broadcastWorkflowUpdate({ workflowId: 'wf1', status: 'ACTIVE', timestamp: new Date() });
    expect(mockEmit).toHaveBeenCalledWith('workflow:update', expect.objectContaining({ workflowId: 'wf1', status: 'ACTIVE' }));
  });

  it('broadcasts workflow progress', () => {
    wsServer.broadcastWorkflowProgress('wf2', 0.5, 'Test Node');
    expect(mockEmit).toHaveBeenCalledWith('workflow:progress', expect.objectContaining({ workflowId: 'wf2', progress: 0.5, currentTask: 'Test Node' }));
  });

  it('broadcasts workflow error', () => {
    wsServer.broadcastWorkflowError('wf3', 'Something went wrong');
    expect(mockEmit).toHaveBeenCalledWith('workflow:error', expect.objectContaining({ workflowId: 'wf3', error: 'Something went wrong' }));
  });
}); 