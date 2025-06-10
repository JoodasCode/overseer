'use client'

import React, { useState } from 'react'
import { AgentPage } from '@/components/agent-page'
import { useAgents } from '@/lib/hooks/use-api'
import type { Agent } from '@/lib/types'
import { Loader2 } from 'lucide-react'

export default function PortalAgentsPage() {
  const { agents, loading, error, refetch } = useAgents()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const agentsData = agents || []
  
  // Set first agent as selected if none selected and agents exist
  React.useEffect(() => {
    if (!selectedAgent && agentsData.length > 0) {
      setSelectedAgent(agentsData[0])
    }
  }, [agentsData, selectedAgent])

  const handleAgentHired = async () => {
    await refetch()
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (agentsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-4xl">🤖</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">No Agents Yet</h3>
            <p className="text-muted-foreground">
              Get started by hiring your first AI agent to help automate your workflows.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Only render AgentPage when we have a selected agent
  if (!selectedAgent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Preparing agent view...</p>
        </div>
      </div>
    )
  }

  return (
    <AgentPage 
      agents={agentsData}
      selectedAgent={selectedAgent}
      onSelectAgent={setSelectedAgent}
      onAgentHired={handleAgentHired}
    />
  )
} 