'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/supabase-auth-provider'
import { AuthModal } from '@/components/auth/auth-modal'
import { Button } from '@/components/ui/button'
import { Loader2, LogIn } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    // Redirect authenticated users to portal
    if (user && !loading) {
      router.push('/portal/dashboard')
    }
  }, [user, loading, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading AGENTS OS...</p>
        </div>
      </div>
    )
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-4xl">🤖</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">AGENTS OS</h1>
              <p className="text-muted-foreground">
                Build your AI team and run your company like a game
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please sign in to access the portal
              </p>
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="w-full max-w-xs mx-auto"
                size="lg"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </div>
          </div>
        </div>
        
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          defaultTab="signin"
        />
      </>
    )
  }

  // This shouldn't be reached due to the redirect above, but just in case
  return null
}
