import { OpenAI } from 'openai';

interface PluginConfig {
  name: string;
  description: string;
  systemPrompt: string;
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  maxRetries?: number;
  timeout?: number;
}

interface PluginExecution {
  id: string;
  pluginName: string;
  input: string;
  output?: string;
  error?: string;
  attempts: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
}

class LLMPluginExecutor {
  private openai: OpenAI;
  private executions: Map<string, PluginExecution> = new Map();

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private parseError(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.error?.message) {
      return error.error.message;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'Unknown error occurred';
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executePlugin(
    pluginConfig: PluginConfig,
    input: string,
    context?: Record<string, any>
  ): Promise<PluginExecution> {
    const executionId = this.generateExecutionId();
    const maxRetries = pluginConfig.maxRetries || 3;
    const timeout = pluginConfig.timeout || 30000; // 30 seconds default

    const execution: PluginExecution = {
      id: executionId,
      pluginName: pluginConfig.name,
      input,
      attempts: 0,
      startTime: new Date(),
      status: 'pending',
    };

    this.executions.set(executionId, execution);

    console.log(`🔧 Starting plugin execution: ${pluginConfig.name} (${executionId})`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      execution.attempts = attempt;
      execution.status = 'running';

      try {
        const result = await Promise.race([
          this.runPluginWithOpenAI(pluginConfig, input, context),
          this.createTimeoutPromise(timeout),
        ]);

        execution.output = result;
        execution.status = 'completed';
        execution.endTime = new Date();
        execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

        console.log(`✅ Plugin execution completed: ${pluginConfig.name} (attempt ${attempt})`);
        break;

      } catch (error) {
        const errorMessage = this.parseError(error);
        execution.error = errorMessage;

        console.error(`❌ Plugin execution failed: ${pluginConfig.name} (attempt ${attempt}):`, errorMessage);

        if (attempt === maxRetries) {
          execution.status = 'failed';
          execution.endTime = new Date();
          execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
        } else {
          // Exponential backoff for retries
          const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`⏳ Retrying in ${backoffTime}ms...`);
          await this.sleep(backoffTime);
        }
      }
    }

    this.executions.set(executionId, execution);
    return execution;
  }

  private async createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Plugin execution timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  private async runPluginWithOpenAI(
    pluginConfig: PluginConfig,
    input: string,
    context?: Record<string, any>
  ): Promise<string> {
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [
      {
        role: 'system',
        content: pluginConfig.systemPrompt,
      },
    ];

    // Add context if provided
    if (context && Object.keys(context).length > 0) {
      messages.push({
        role: 'system',
        content: `Context: ${JSON.stringify(context, null, 2)}`,
      });
    }

    messages.push({
      role: 'user',
      content: input,
    });

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 2000,
      temperature: 0.7,
      stream: false,
    });

    const output = response.choices[0]?.message?.content;
    
    if (!output) {
      throw new Error('No output generated from OpenAI');
    }

    return output.trim();
  }

  getExecution(executionId: string): PluginExecution | undefined {
    return this.executions.get(executionId);
  }

  getExecutionHistory(pluginName?: string): PluginExecution[] {
    const executions = Array.from(this.executions.values());
    
    if (pluginName) {
      return executions.filter(exec => exec.pluginName === pluginName);
    }
    
    return executions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  getExecutionStats(pluginName?: string): {
    total: number;
    completed: number;
    failed: number;
    averageDuration: number;
    successRate: number;
  } {
    const executions = pluginName
      ? this.getExecutionHistory(pluginName)
      : this.getExecutionHistory();

    const total = executions.length;
    const completed = executions.filter(exec => exec.status === 'completed').length;
    const failed = executions.filter(exec => exec.status === 'failed').length;
    
    const completedExecutions = executions.filter(exec => exec.status === 'completed' && exec.duration);
    const averageDuration = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, exec) => sum + (exec.duration || 0), 0) / completedExecutions.length
      : 0;
    
    const successRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      failed,
      averageDuration,
      successRate,
    };
  }

  clearExecutionHistory(): void {
    this.executions.clear();
    console.log('🧹 Plugin execution history cleared');
  }
}

// Predefined plugin configurations
export const defaultPlugins: PluginConfig[] = [
  {
    name: 'email_composer',
    description: 'Composes professional emails based on input requirements',
    systemPrompt: `You are an expert email composer. Create professional, clear, and engaging emails based on the user's requirements. Always include:
- Appropriate subject line
- Professional greeting
- Clear and concise body
- Appropriate closing
- Proper formatting`,
    maxRetries: 2,
    timeout: 15000,
  },
  {
    name: 'content_summarizer',
    description: 'Summarizes long content into key points',
    systemPrompt: `You are a content summarization expert. Create concise, accurate summaries that capture the key points and main ideas. Focus on:
- Main themes and arguments
- Important facts and figures
- Key conclusions
- Actionable insights`,
    maxRetries: 2,
    timeout: 20000,
  },
  {
    name: 'task_planner',
    description: 'Creates detailed task plans and project breakdowns',
    systemPrompt: `You are a project planning expert. Break down complex requests into clear, actionable task plans. Include:
- Clear task descriptions
- Priority levels
- Estimated timeframes
- Dependencies between tasks
- Success criteria`,
    maxRetries: 3,
    timeout: 25000,
  },
];

export const llmPluginExecutor = new LLMPluginExecutor();
export type { PluginConfig, PluginExecution }; 