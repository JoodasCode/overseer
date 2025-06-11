// Global configuration
export const config = {
  // Disable mock mode since OpenAI API key is available
  MOCK_MODE: false,
  
  // Database configuration
  ENABLE_DATABASE: false,
  
  // Feature flags
  ENABLE_REAL_TIME: false,
  ENABLE_INTEGRATIONS: false,
  
  // Development settings
  DEBUG_MODE: process.env.NODE_ENV === 'development',
} 