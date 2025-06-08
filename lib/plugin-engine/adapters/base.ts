import { TaskIntent, TaskResult } from '../types';

export interface Adapter {
  execute(intent: TaskIntent): Promise<TaskResult>;
} 