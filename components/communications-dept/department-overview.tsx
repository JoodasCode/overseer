"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  MessageSquare, 
  Users, 
  Activity, 
  TrendingUp, 
  Calendar,
  Zap,
  Target,
  Brain,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  BarChart3
} from 'lucide-react'
import type { Agent } from '@/lib/types'
import { supabase } from '@/lib/supabase-client'

interface DepartmentOverviewProps {
  onViewAgent?: (agent: Agent) => void
  onStartCollaboration?: (agents: Agent[]) => void
}

interface DepartmentStats {
  totalTasks: number
  completedTasks: number
  collaborationsToday: number
  activeAgents: number
  avgResponseTime: string
  weeklyProductivity: number
}

interface AgentCollaboration {
  agentId: string
  collaboratingWith: string[]
  currentTask: string
  status: 'active' | 'available' | 'busy'
}

const AGENT_COLORS = {
  'Alex': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'Dana': 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  'Jamie': 'bg-green-500/10 text-green-600 border-green-500/20',
  'Riley': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Toby': 'bg-orange-500/10 text-orange-600 border-orange-500/20'
}

const AGENT_DESCRIPTIONS = {
  'Alex': 'Strategic lead who coordinates campaigns and delegates tasks',
  'Dana': 'Creative visual assistant who designs engaging content',
  'Jamie': 'Internal liaison who maintains team morale and clarity',
  'Riley': 'Analytical expert who tracks metrics and performance',
  'Toby': 'Rapid response coordinator for crisis management'
}

export function DepartmentOverview({ onViewAgent, onStartCollaboration }: DepartmentOverviewProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats>({
    totalTasks: 0,
    completedTasks: 0,
    collaborationsToday: 0,
    activeAgents: 0,
    avgResponseTime: '0s',
    weeklyProductivity: 0
  })
  const [collaborations, setCollaborations] = useState<AgentCollaboration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCommunicationsDepartment()
  }, [])

  const loadCommunicationsDepartment = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Authentication required')
        return
      }

      // Load communications department agents
      const response = await fetch('/api/agents/communications-dept', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load agents: ${response.statusText}`)
      }

      const data = await response.json()
      setAgents(data.agents || [])

      // Calculate department stats
      const stats = calculateDepartmentStats(data.agents || [])
      setDepartmentStats(stats)

      // Mock collaboration data (would come from real-time system)
      setCollaborations(generateMockCollaborations(data.agents || []))

    } catch (err) {
      console.error('Error loading communications department:', err)
      setError(err instanceof Error ? err.message : 'Failed to load department')
    } finally {
      setLoading(false)
    }
  }

  const calculateDepartmentStats = (agentList: Agent[]): DepartmentStats => {
    return {
      totalTasks: agentList.length * 8, // Mock calculation
      completedTasks: agentList.length * 6,
      collaborationsToday: Math.floor(agentList.length * 1.5),
      activeAgents: agentList.length,
      avgResponseTime: '1.2s',
      weeklyProductivity: 87
    }
  }

  const generateMockCollaborations = (agentList: Agent[]): AgentCollaboration[] => {
    return agentList.map(agent => ({
      agentId: agent.id,
      collaboratingWith: agentList
        .filter(a => a.id !== agent.id)
        .slice(0, Math.floor(Math.random() * 2))
        .map(a => a.name),
      currentTask: `Working on ${agent.preferences?.role || 'communication'} tasks`,
      status: Math.random() > 0.7 ? 'busy' : Math.random() > 0.3 ? 'active' : 'available'
    }))
  }

  const getAgentCollaboration = (agentId: string) => {
    return collaborations.find(c => c.agentId === agentId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'busy': return 'bg-yellow-500'
      case 'available': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Department</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadCommunicationsDepartment} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Department Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div>
              <CardTitle className="text-2xl font-bold">Communications Department</CardTitle>
              <p className="text-muted-foreground">5 specialized AI agents working together</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{departmentStats.activeAgents}</div>
              <div className="text-xs text-muted-foreground">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{departmentStats.completedTasks}</div>
              <div className="text-xs text-muted-foreground">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{departmentStats.collaborationsToday}</div>
              <div className="text-xs text-muted-foreground">Collaborations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{departmentStats.avgResponseTime}</div>
              <div className="text-xs text-muted-foreground">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{departmentStats.weeklyProductivity}%</div>
              <div className="text-xs text-muted-foreground">Productivity</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const collaboration = getAgentCollaboration(agent.id)
          const agentColor = AGENT_COLORS[agent.name as keyof typeof AGENT_COLORS] || AGENT_COLORS.Alex
          const agentDescription = AGENT_DESCRIPTIONS[agent.name as keyof typeof AGENT_DESCRIPTIONS] || 'AI Assistant'
          
          return (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <span className="text-3xl">{agent.avatar_url}</span>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(collaboration?.status || 'available')}`}></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{agent.name}</h3>
                      <Badge className={`text-xs ${agentColor}`}>
                        {agent.preferences?.role || 'Agent'}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onViewAgent?.(agent)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{agentDescription}</p>
                  <p className="text-xs italic text-muted-foreground">{agent.personality}</p>
                </div>

                {/* Personality Traits */}
                <div className="flex flex-wrap gap-1">
                  {agent.preferences?.tone && (
                    <Badge variant="outline" className="text-xs">
                      {agent.preferences.tone}
                    </Badge>
                  )}
                  {agent.preferences?.voice_style && (
                    <Badge variant="outline" className="text-xs">
                      {agent.preferences.voice_style}
                    </Badge>
                  )}
                </div>

                {/* Tools */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Preferred Tools:</div>
                  <div className="flex flex-wrap gap-1">
                    {agent.tools?.slice(0, 3).map((tool, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                    {agent.tools?.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{agent.tools.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Collaboration Status */}
                {collaboration && collaboration.collaboratingWith.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium">Collaborating with:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {collaboration.collaboratingWith.map((name, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs"
                    onClick={() => onViewAgent?.(agent)}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Chat
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs"
                    onClick={() => onViewAgent?.(agent)}
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Stats
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Department Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-3">
              {[
                { agent: 'Alex', action: 'Delegated visual task to Dana', time: '2 minutes ago', type: 'delegation' },
                { agent: 'Riley', action: 'Flagged campaign performance metrics', time: '15 minutes ago', type: 'alert' },
                { agent: 'Dana', action: 'Completed campaign visual assets', time: '23 minutes ago', type: 'completion' },
                { agent: 'Jamie', action: 'Posted team morale update', time: '45 minutes ago', type: 'communication' },
                { agent: 'Toby', action: 'Resolved customer inquiry', time: '1 hour ago', type: 'resolution' }
              ].map((activity, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/30">
                  <span className="text-lg">{agents.find(a => a.name === activity.agent)?.avatar_url || '🤖'}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{activity.agent}</div>
                    <div className="text-xs text-muted-foreground">{activity.action}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{activity.time}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Department Actions */}
      <div className="flex space-x-4">
        <Button 
          onClick={() => onStartCollaboration?.(agents)}
          className="flex-1"
        >
          <Users className="h-4 w-4 mr-2" />
          Start Team Collaboration
        </Button>
        <Button 
          variant="outline"
          onClick={loadCommunicationsDepartment}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          View Analytics
        </Button>
      </div>
    </div>
  )
} 