import { PluginEngine, TaskIntent, TaskResult } from './types';
import { GmailAdapter } from './adapters/gmail';
import { NotionAdapter } from './adapters/notion';
import { SlackAdapter } from './adapters/slack';

class BasePluginEngine implements PluginEngine {
  private static instance: BasePluginEngine;
  private adapters: Map<string, any>;

  private constructor() {
    this.adapters = new Map();
    this.registerDefaultAdapters();
  }

  public static getInstance(): BasePluginEngine {
    if (!BasePluginEngine.instance) {
      BasePluginEngine.instance = new BasePluginEngine();
    }
    return BasePluginEngine.instance;
  }

  private registerDefaultAdapters() {
    this.registerAdapter('gmail', new GmailAdapter());
    this.registerAdapter('notion', new NotionAdapter());
    this.registerAdapter('slack', new SlackAdapter());
  }

  public registerAdapter(name: string, adapter: any) {
    this.adapters.set(name, adapter);
  }

  public async processIntent(intent: TaskIntent): Promise<TaskResult> {
    const adapter = this.adapters.get(intent.tool);
    
    if (!adapter) {
      return {
        success: false,
        message: `No adapter found for tool: ${intent.tool}`
      };
    }

    try {
      const result = await adapter.execute(intent);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export async function createBasePluginEngine(): Promise<PluginEngine> {
  return BasePluginEngine.getInstance();
} 