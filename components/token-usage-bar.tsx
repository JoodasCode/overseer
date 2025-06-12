'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/supabase-auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Zap, AlertTriangle, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface TokenUsage {
  tokensUsed: number
  tokenQuota: number
  tokensRemaining: number
  resetDate: string
  subscriptionPlan: string
}

export function TokenUsageBar() {
  const { user, loading: authLoading } = useAuth()
  const [usage, setUsage] = useState<TokenUsage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only fetch token usage if user is authenticated
    if (user && !authLoading) {
      fetchTokenUsage()
      
      // Refresh every 30 seconds
      const interval = setInterval(fetchTokenUsage, 30000)
      return () => clearInterval(interval)
    } else if (!authLoading) {
      // User is not authenticated, so don't show token bar
      setLoading(false)
      setUsage(null)
    }
  }, [user, authLoading])

  const fetchTokenUsage = async () => {
    try {
      // Get the current session for authentication
      const { data: { session } } = await createClient().auth.getSession()
      
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
      
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      } else {
        // If unauthorized or any error, don't show the token bar
        console.log('Token usage fetch failed:', response.status)
        setUsage(null)
      }
    } catch (error) {
      console.error('Failed to fetch token usage:', error)
      setUsage(null)
    } finally {
      setLoading(false)
    }
  }

  // Don't render anything if still loading auth or no user
  if (authLoading || loading || !user) {
    return null
  }

  if (!usage) {
    return null // Don't show token bar if no usage data
  }

  const usagePercentage = (usage.tokensUsed / usage.tokenQuota) * 100
  const isLow = usage.tokensRemaining < 50
  const isCritical = usage.tokensRemaining < 10
  const isExhausted = usage.tokensRemaining <= 0

  const getProgressColor = () => {
    if (isExhausted) return 'bg-red-500'
    if (isCritical) return 'bg-red-400'
    if (isLow) return 'bg-yellow-400'
    return 'bg-blue-500'
  }

  const getTextColor = () => {
    if (isExhausted) return 'text-red-600'
    if (isCritical) return 'text-red-500'
    if (isLow) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <div className="flex items-center space-x-3 px-3 py-1.5 bg-white border rounded-lg shadow-sm">
      {/* Icon */}
      <div className="flex-shrink-0">
        {isExhausted ? (
          <AlertTriangle className="w-4 h-4 text-red-500" />
        ) : usage.subscriptionPlan === 'PRO' ? (
          <Crown className="w-4 h-4 text-yellow-500" />
        ) : (
          <Zap className="w-4 h-4 text-blue-500" />
        )}
      </div>

      {/* Progress Bar */}
      <div className="flex-1 min-w-0 max-w-32">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div 
            className={`h-full transition-all ${getProgressColor()}`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Usage Text */}
      <div className={`text-sm font-medium ${getTextColor()}`}>
        {usage.tokensRemaining.toLocaleString()}
      </div>

      {/* Warning Badge */}
      {(isLow && !isExhausted) && (
        <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
          Low
        </Badge>
      )}

      {/* Exhausted State */}
      {isExhausted && (
        <Button 
          size="sm" 
          className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700"
          onClick={() => window.location.href = '/settings?tab=billing'}
        >
          Upgrade
        </Button>
      )}
    </div>
  )
} 