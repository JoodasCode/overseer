import { scheduleWorkflow, pauseWorkflow, resumeWorkflow } from '@/lib/workflow/scheduler';
import { Workflow } from '@/lib/workflow/types';
import { beforeEach, afterEach, describe, it, expect, vi } from '@jest/globals';

describe('Workflow Scheduler', () => {
  const mockWorkflow: Workflow = { id: 'test-workflow', name: 'Test Workflow' };
  const interval = 1000; // 1 second

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should schedule a workflow', () => {
    scheduleWorkflow(mockWorkflow.id, mockWorkflow, interval);
    expect(setInterval).toHaveBeenCalled();
  });

  it('should pause a scheduled workflow', () => {
    scheduleWorkflow(mockWorkflow.id, mockWorkflow, interval);
    pauseWorkflow(mockWorkflow.id);
    expect(clearInterval).toHaveBeenCalled();
  });

  it('should resume a paused workflow', () => {
    resumeWorkflow(mockWorkflow.id, mockWorkflow, interval);
    expect(setInterval).toHaveBeenCalled();
  });
}); 