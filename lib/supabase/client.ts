import { createBrowserClient } from '@supabase/ssr'

// Simple, reliable Supabase client without complex cookie management
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Default export for backward compatibility
export const supabase = createClient()

// SECURITY: Clear all auth-related data when needed
export function clearAuthData() {
  if (typeof window === 'undefined') return
  
  console.log('🔒 Clearing authentication data')
  
  // Clear localStorage
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
  
  // Clear sessionStorage
  try {
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        sessionStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('Error clearing sessionStorage:', error)
  }
  
  console.log('✅ Authentication data cleared')
} 