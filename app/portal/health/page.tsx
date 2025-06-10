'use client'

import React from 'react'
import { AgentHealthMonitor } from '@/components/agent-health-monitor'
import { useAgents } from '@/lib/hooks/use-api'

export default function HealthPage() {
  const { agents } = useAgents()
  
  return <AgentHealthMonitor agents={agents || []} />
} 