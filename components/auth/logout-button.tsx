'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/supabase-auth-provider'
import { supabase, clearAuthData } from '@/lib/supabase/client'
import { LogOut, Loader2 } from 'lucide-react'

export function LogoutButton() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    
    try {
      // Clear local auth data first
      clearAuthData()
      
      // Sign out through Supabase
      const { error } = await signOut()
      
      if (error) {
        console.error('Logout error:', error)
        // Even if there's an error, we cleared local data, so redirect anyway
      }
      
      // Redirect to sign-in page with logout confirmation
      router.push('/auth/signin?logged_out=true')
      
    } catch (error) {
      console.error('Logout failed:', error)
      
      // Clear auth data even on error and redirect
      clearAuthData()
      router.push('/auth/signin?logged_out=true')
      
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickClear = async () => {
    setIsLoading(true)
    
    try {
      // Emergency clear - just clear everything and redirect
      clearAuthData()
      
      // Try to sign out but don't wait for response
      signOut().catch(() => {}) // Fire and forget
      
      // Immediate redirect
      router.push('/auth/signin?logged_out=true')
      
    } catch (error) {
      console.error('Quick clear failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleLogout}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        Sign Out
      </Button>
    </div>
  )
} 