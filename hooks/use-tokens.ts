'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TokenUsage {
  tokensUsed: number
  tokenQuota: number
  tokensRemaining: number
  resetDate: string
  subscriptionPlan: string
}

interface UseTokensReturn {
  usage: TokenUsage | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  isLow: boolean
  isCritical: boolean
  isExhausted: boolean
  canChat: boolean
}

export function useTokens(): UseTokensReturn {
  const [usage, setUsage] = useState<TokenUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    try {
      setError(null)
      
      // Get the current session for authentication
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Add Bearer token if available
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch('/api/tokens/usage', {
        headers,
        credentials: 'include' // Include cookies as fallback
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch token usage: ${response.status}`)
      }
      
      const data = await response.json()
      setUsage(data)
    } catch (err) {
      console.error('Token usage fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch token usage')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  // Real-time updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchUsage, 30000)
    return () => clearInterval(interval)
  }, [fetchUsage])

  // Listen for token updates via Supabase realtime
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('token-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_tokens'
      }, () => {
        // Refresh token usage when database changes
        fetchUsage()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchUsage])

  // Listen for page visibility changes to refresh data
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUsage()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchUsage])

  const refresh = useCallback(async () => {
    setLoading(true)
    await fetchUsage()
  }, [fetchUsage])

  // Computed values
  const isLow = usage ? usage.tokensRemaining < 50 : false
  const isCritical = usage ? usage.tokensRemaining < 10 : false
  const isExhausted = usage ? usage.tokensRemaining <= 0 : false
  const canChat = usage ? usage.tokensRemaining > 0 : false

  return {
    usage,
    loading,
    error,
    refresh,
    isLow,
    isCritical,
    isExhausted,
    canChat
  }
} 