import { initKnowledgeSystem } from '@/lib/knowledge-base/init';

// Initialize systems on server startup
let initialized = false;

export function initSystems() {
  // Prevent multiple initializations
  if (initialized) {
    return;
  }
  
  // Only run in production or when explicitly enabled
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_BACKGROUND_JOBS === 'true') {
    // Initialize knowledge system
    initKnowledgeSystem();
    
    // Mark as initialized
    initialized = true;
    console.log('Server systems initialized');
  } else {
    console.log('Background jobs disabled in development mode. Set ENABLE_BACKGROUND_JOBS=true to enable.');
  }
}
