'use client'

import React from 'react'
import { WorkflowBuilder } from '@/components/workflow-builder'
import { useAgents } from '@/lib/hooks/use-api'

export default function WorkflowBuilderPage() {
  const { agents } = useAgents()
  
  return <WorkflowBuilder agents={agents || []} />
} 