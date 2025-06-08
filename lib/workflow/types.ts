import { WorkflowStatus } from '@prisma/client';

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  next?: string[];
  previous?: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  agent_id: string;
  user_id: string;
  status: WorkflowStatus;
  config?: Record<string, any>;
  triggers?: Record<string, any>;
  actions?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface WorkflowWithNodes extends Omit<Workflow, 'nodes'> {
  nodes: WorkflowNode[];
} 