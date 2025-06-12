"use client"

import { useState, useEffect } from 'react'
import { SharedLayout } from '@/components/shared/SharedLayout'
import { EnhancedWorkflowBuilder } from '@/components/workflow/enhanced-workflow-builder'
import { useAgents } from '@/lib/hooks/use-api'
import { useAuth } from '@/lib/auth/supabase-auth-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'
import type { Agent } from '@/lib/types'

export default function WorkflowBuilderPage() {
  const { user, session, loading: authLoading } = useAuth()
  const { agents, loading: agentsLoading, error: agentsError } = useAgents()
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect to signin if not authenticated (with delay to avoid SSR issues)
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('🔄 No user found, redirecting to signin...')
      const redirectTimer = setTimeout(() => {
        window.location.href = '/auth/signin'
      }, 100)
      return () => clearTimeout(redirectTimer)
    }
  }, [authLoading, user])

  // Fetch user workflows
  useEffect(() => {
    const fetchWorkflows = async () => {
      if (!user?.id || authLoading) return

      try {
        setLoading(true)
        const response = await fetch(`/api/workflows?userId=${user.id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch workflows')
        }
        
        const data = await response.json()
        setWorkflows(data.workflows || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching workflows:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch workflows')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkflows()
  }, [user?.id, authLoading])

  const handleWorkflowSaved = async (workflow: any) => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          workflow
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save workflow')
      }

      const data = await response.json()
      
      // Add the new workflow to the list
      setWorkflows(prev => [data.workflow, ...prev])
      
      console.log('Workflow saved successfully:', data.workflow)
    } catch (err) {
      console.error('Error saving workflow:', err)
      setError(err instanceof Error ? err.message : 'Failed to save workflow')
    }
  }

  // Loading state
  if (authLoading || agentsLoading || loading) {
    return (
      <SharedLayout title="Workflow Manager" description="Create and manage automated workflows with your agents">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="border-pixel">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="font-pixel text-sm text-muted-foreground">
                Loading workflow builder...
              </p>
            </CardContent>
          </Card>
        </div>
      </SharedLayout>
    )
  }

  // Error state
  if (error || agentsError) {
    return (
      <SharedLayout title="Workflow Manager" description="Create and manage automated workflows with your agents">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="border-pixel border-red-500/20">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
              <h3 className="font-pixel text-sm mb-2">Error Loading Workflow Builder</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {error || agentsError}
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-xs text-primary hover:underline"
              >
                Try again
              </button>
            </CardContent>
          </Card>
        </div>
      </SharedLayout>
    )
  }

  // No agents state
  if (!agents || agents.length === 0) {
    return (
      <SharedLayout title="Workflow Manager" description="Create and manage automated workflows with your agents">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="border-pixel">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-4 text-yellow-500" />
              <h3 className="font-pixel text-sm mb-2">No Agents Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Unable to load agents. Please check your connection and try again.
              </p>
              <a 
                href="/agents" 
                className="text-xs text-primary hover:underline font-pixel"
              >
                Go to Agents →
              </a>
            </CardContent>
          </Card>
        </div>
      </SharedLayout>
    )
  }

  return (
    <SharedLayout title="Workflow Manager" description="Create and manage automated workflows with your agents">
      <div className="h-full">
        <EnhancedWorkflowBuilder
          agents={agents}
          workflows={workflows}
          onWorkflowSaved={handleWorkflowSaved}
          onBack={() => window.history.back()}
        />
      </div>
    </SharedLayout>
  )
} 