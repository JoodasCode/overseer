import { useEffect, useCallback } from 'react';
import { Socket, io as createSocket } from 'socket.io-client';
import { WorkflowStatus } from '@prisma/client';

export type WorkflowUpdate = {
  workflowId: string;
  status: WorkflowStatus;
  progress?: number;
  currentTask?: string;
  error?: string;
  timestamp: Date;
};

type WorkflowSocketHandlers = {
  onUpdate?: (update: WorkflowUpdate) => void;
  onError?: (error: { workflowId: string; error: string; timestamp: Date }) => void;
  onProgress?: (progress: { workflowId: string; progress: number; currentTask?: string; timestamp: Date }) => void;
};

export function useWorkflowSocket(workflowId: string, handlers: WorkflowSocketHandlers = {}) {
  const connect = useCallback(() => {
    const socket = createSocket(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      socket.emit('subscribe:workflow', workflowId);
    });

    socket.on('workflow:update', (update: WorkflowUpdate) => {
      handlers.onUpdate?.(update);
    });

    socket.on('workflow:error', (error: { workflowId: string; error: string; timestamp: Date }) => {
      handlers.onError?.(error);
    });

    socket.on('workflow:progress', (progress: { workflowId: string; progress: number; currentTask?: string; timestamp: Date }) => {
      handlers.onProgress?.(progress);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return socket;
  }, [workflowId, handlers]);

  useEffect(() => {
    const socket = connect();

    return () => {
      socket.emit('unsubscribe:workflow', workflowId);
      socket.disconnect();
    };
  }, [connect, workflowId]);
} 