// Global configuration
export const config = {
  // Enable mock mode for demo purposes (disable when OpenAI API key is available)
  MOCK_MODE: false,
  
  // Database configuration
  ENABLE_DATABASE: true,
  
  // Feature flags
  ENABLE_REAL_TIME: true,
  ENABLE_INTEGRATIONS: true,
  
  // Development settings
  DEBUG_MODE: process.env.NODE_ENV === 'development',
} 