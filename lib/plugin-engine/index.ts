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
export function createPluginEngine() {
  const pluginEngine = PluginEngine.getInstance();
  
  // Register adapters
  pluginEngine.registerAdapter('gmail', new GmailAdapter());
  pluginEngine.registerAdapter('notion', new NotionAdapter());
  pluginEngine.registerAdapter('slack', new SlackAdapter());
  
  return pluginEngine;
}
