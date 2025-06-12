'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { supabase, clearAllAuthCookies } from '@/lib/supabase/client'

export function LogoutButton({ variant = 'ghost', size = 'sm' }: {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleSecureLogout = async () => {
    try {
      setIsLoggingOut(true)
      console.log('🔒 SECURITY: Starting secure logout process...')

      // Step 1: Clear all authentication cookies immediately
      console.log('🔒 Step 1: Clearing all auth cookies')
      clearAllAuthCookies()

      // Step 2: Sign out from Supabase (server-side session termination)
      console.log('🔒 Step 2: Terminating Supabase session')
      const { error } = await supabase.auth.signOut({
        scope: 'global' // Sign out from all sessions
      })

      if (error) {
        console.error('❌ Supabase logout error:', error)
        // Continue with cleanup even if server logout fails
      }

      // Step 3: Clear any remaining client-side data
      console.log('🔒 Step 3: Final cleanup')
      
      // Clear any cached user data
      if (typeof window !== 'undefined') {
        // Clear any cached state in memory
        window.location.href = '/auth/signin?logged_out=true'
      } else {
        router.replace('/auth/signin?logged_out=true')
      }

      console.log('✅ SECURITY: Secure logout completed')

    } catch (error) {
      console.error('❌ CRITICAL: Logout error:', error)
      
      // Emergency cleanup - force clear everything
      clearAllAuthCookies()
      
      // Force redirect even on error
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin?error=logout_failed'
      }
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSecureLogout}
      disabled={isLoggingOut}
      className="flex items-center gap-2"
    >
      <LogOut className="w-4 h-4" />
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </Button>
  )
} 