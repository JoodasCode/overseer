'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/supabase-auth-provider'
import { ModernAuthModal } from '@/components/auth/modern-auth-modal'
import { Button } from '@/components/ui/button'
import { Loader2, LogIn } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    // Redirect authenticated users to the new Shadcn portal dashboard
    if (user && !loading) {
      console.log('🏠 Homepage: Redirecting authenticated user to dashboard:', { 
        userId: user.id, 
        email: user.email 
      });
      
      // Use replace instead of push to avoid back button issues
      router.replace('/dashboard');
    } else if (!loading) {
      console.log('🏠 Homepage: User not authenticated, showing landing page');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground">
              Build Your <span className="text-primary">AI Team</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Run your company like a game with AI agents that work together
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => setShowAuthModal(true)}
                className="text-lg px-8 py-6"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign In / Sign Up
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              New user? Create your account • Existing user? Sign in
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4 p-6 rounded-lg bg-card border">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-semibold">AI Agent Collaboration</h3>
            <p className="text-muted-foreground">
              Create AI agents that work together on complex tasks and learn from each interaction
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-lg bg-card border">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🧠</span>
            </div>
            <h3 className="text-xl font-semibold">Persistent Memory</h3>
            <p className="text-muted-foreground">
              Agents remember your preferences, past conversations, and improve over time
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-lg bg-card border">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-semibold">Workflow Automation</h3>
            <p className="text-muted-foreground">
              Build automated workflows that connect your tools and streamline operations
            </p>
          </div>
        </div>
      </div>

      {/* Modern Auth Modal */}
      <ModernAuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        defaultTab="signin"
      />
    </div>
  )
}
