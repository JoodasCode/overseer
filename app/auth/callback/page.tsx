'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient()
        
        // First check if we have the auth code in the URL
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        
        if (!code) {
          console.log('❌ No OAuth code found in URL')
          setError('No authentication code found')
          setTimeout(() => router.push('/auth/signin?error=missing_code'), 2000)
          return
        }

        console.log('🔑 Processing OAuth callback with code:', code.substring(0, 10) + '...')
        
        // Exchange the code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.search)
        
        if (exchangeError) {
          console.error('❌ OAuth code exchange failed:', exchangeError)
          setError('Authentication failed: ' + exchangeError.message)
          setTimeout(() => router.push('/auth/signin?error=oauth_failed'), 2000)
          return
        }

        if (data.session && data.user) {
          console.log('✅ OAuth authentication successful:', { 
            userId: data.user.id, 
            email: data.user.email 
          })
          
          // Wait a moment for the auth state to propagate
          setTimeout(() => {
            console.log('🚀 Redirecting to dashboard')
            router.replace('/dashboard')
          }, 1000)
        } else {
          console.log('❌ No session created from OAuth exchange')
          setError('No session created')
          setTimeout(() => router.push('/auth/signin?error=no_session'), 2000)
        }
      } catch (error: any) {
        console.error('❌ OAuth callback exception:', error)
        setError('Authentication error: ' + error.message)
        setTimeout(() => router.push('/auth/signin?error=callback_failed'), 2000)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        {!error ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Completing sign in...</p>
            <p className="text-sm text-muted-foreground">Please wait while we verify your account</p>
          </>
        ) : (
          <>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-red-600 text-sm">✕</span>
            </div>
            <p className="text-red-600 font-medium">Authentication Error</p>
            <p className="text-sm text-red-500">{error}</p>
            <p className="text-xs text-muted-foreground">Redirecting back to sign in...</p>
          </>
        )}
      </div>
    </div>
  )
} 