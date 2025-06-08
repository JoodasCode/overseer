import { Server as NetServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { WorkflowStatus } from '@prisma/client';

export type WorkflowUpdate = {
  workflowId: string;
  status: WorkflowStatus;
  progress?: number;
  currentTask?: string;
  error?: string;
  timestamp: Date;
};

class WebSocketServer {
  private io: SocketIOServer;
  private static instance: WebSocketServer;

  private constructor(server: NetServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    this.setupEventHandlers();
  }

  public static getInstance(server?: NetServer): WebSocketServer {
    if (!WebSocketServer.instance && server) {
      WebSocketServer.instance = new WebSocketServer(server);
    }
    return WebSocketServer.instance;
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);

      // Handle workflow subscription
      socket.on('subscribe:workflow', (workflowId: string) => {
        socket.join(`workflow:${workflowId}`);
        console.log(`Client ${socket.id} subscribed to workflow ${workflowId}`);
      });

      // Handle workflow unsubscription
      socket.on('unsubscribe:workflow', (workflowId: string) => {
        socket.leave(`workflow:${workflowId}`);
        console.log(`Client ${socket.id} unsubscribed from workflow ${workflowId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  public broadcastWorkflowUpdate(update: WorkflowUpdate) {
    this.io.to(`workflow:${update.workflowId}`).emit('workflow:update', update);
  }

  public broadcastWorkflowError(workflowId: string, error: string) {
    this.io.to(`workflow:${workflowId}`).emit('workflow:error', {
      workflowId,
      error,
      timestamp: new Date(),
    });
  }

  public broadcastWorkflowProgress(workflowId: string, progress: number, currentTask?: string) {
    this.io.to(`workflow:${workflowId}`).emit('workflow:progress', {
      workflowId,
      progress,
      currentTask,
      timestamp: new Date(),
    });
  }
}

export default WebSocketServer; 