import { executeWorkflow } from '../engine';
import { createPluginEngine } from '../../plugin-engine';
import { Workflow, WorkflowNode } from '../types';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../plugin-engine', () => ({
  createPluginEngine: vi.fn(() => ({
    processIntent: vi.fn(async (intent) => {
      if (intent.type === 'fail') {
        throw new Error('Intent failed');
      }
      return { success: true, message: 'Intent processed', data: {} };
    }),
  })),
}));

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

  it('executes all nodes successfully', async () => {
    const nodes: WorkflowNode[] = [
      { id: 'n1', name: 'Send Slack', type: 'slack', config: { type: 'send' } },
      { id: 'n2', name: 'Send Gmail', type: 'gmail', config: { type: 'send' } },
    ];
    const workflow = { ...baseWorkflow, nodes };
    const result = await executeWorkflow(workflow);
    expect(result.success).toBe(true);
  });

  it('retries on failure and fails after max retries', async () => {
    const nodes: WorkflowNode[] = [
      { id: 'n1', name: 'Fail Node', type: 'fail', config: { type: 'fail' } },
    ];
    const workflow = { ...baseWorkflow, nodes };
    const result = await executeWorkflow(workflow);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Intent failed/);
  });
}); 