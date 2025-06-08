/**
 * Plugin Engine for AgentOS
 * Main export file
 */

// Core components
import { PluginEngine } from './plugin-engine';
import { IntegrationManager } from './integration-manager';
import { ErrorHandler } from './error-handler';
import { Scheduler } from './scheduler';
import { ContextMapper } from './context-mapper';

// Adapters
import { GmailAdapter } from './adapters/gmail-adapter';
import { NotionAdapter } from './adapters/notion-adapter';
import { SlackAdapter } from './adapters/slack-adapter';

// Export all components
export { PluginEngine } from './plugin-engine';
export { IntegrationManager } from './integration-manager';
export { ErrorHandler } from './error-handler';
export { Scheduler } from './scheduler';
export { ContextMapper } from './context-mapper';

// Export types
export * from './types';

// Export adapters
export { GmailAdapter } from './adapters/gmail-adapter';
export { NotionAdapter } from './adapters/notion-adapter';
export { SlackAdapter } from './adapters/slack-adapter';

// Factory function to create and initialize the plugin engine
export async function createPluginEngine(): Promise<PluginEngine> {
  const baseEngine = await createBasePluginEngine();
  
  return {
    ...baseEngine,
    async executeTaskIntent(taskIntent: {
      type: string;
      config: Record<string, any>;
      agent_id: string;
      user_id: string;
    }) {
      const { type, config, agent_id, user_id } = taskIntent;
      
      // Create a task intent from the workflow node
      const intent = {
        agentId: agent_id,
        userId: user_id,
        tool: type,
        intent: config.intent || 'execute',
        context: config.context || {},
        scheduledTime: config.scheduled_time
      };
      
      // Execute the task using the base engine
      const result = await baseEngine.processIntent(intent);
      
      if (!result.success) {
        throw new Error(result.message || 'Task execution failed');
      }
      
      return result;
    }
  };
}
