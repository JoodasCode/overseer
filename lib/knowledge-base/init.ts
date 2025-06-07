import { JobProcessor } from './job-processor';

/**
 * Initialize the knowledge base system
 * This should be called when the server starts
 */
export function initKnowledgeSystem(): void {
  console.log('Initializing knowledge system...');
  
  // Start the job processor with a 30-second interval
  JobProcessor.start(30000);
  
  console.log('Knowledge system initialized successfully');
}
