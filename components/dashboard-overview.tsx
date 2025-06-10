"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, ArrowRight, MessageSquare, Users, TrendingUp, Zap } from "lucide-react"
import type { Agent } from "@/lib/types"

interface DashboardOverviewProps {
  agents: Agent[]
  onSelectAgent: (agent: Agent) => void
  onAgentHired: () => void
}

export function DashboardOverview({ agents, onSelectAgent, onAgentHired }: DashboardOverviewProps) {
  const safeAgents = agents || []

  // Calculate stats
  const totalAgents = safeAgents.length
  const activeAgents = safeAgents.filter(agent => 
    agent.status === 'active' || agent.status === 'collaborating'
  ).length
  const totalTasks = safeAgents.reduce((sum, agent) => 
    sum + (agent.stats?.total_tasks_completed || 0), 0
  )

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalAgents}</p>
                <p className="text-sm text-muted-foreground">Total Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{activeAgents}</p>
                <p className="text-sm text-muted-foreground">Active Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{totalTasks}</p>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Your AI Agents</CardTitle>
            <Button onClick={onAgentHired} className="font-pixel text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Hire Agent
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {safeAgents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by hiring your first AI agent
              </p>
              <Button onClick={onAgentHired}>
                <Plus className="w-4 h-4 mr-2" />
                Hire Your First Agent
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeAgents.map((agent) => (
                <Card 
                  key={agent.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onSelectAgent(agent)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="text-2xl">{agent.avatar_url || '🤖'}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{agent.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {agent.preferences?.role || agent.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={agent.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {agent.status || 'idle'}
                      </Badge>
                      
                      <div className="text-xs text-muted-foreground">
                        {agent.stats?.total_tasks_completed || 0} tasks
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 justify-start">
              <MessageSquare className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Start Conversation</div>
                <div className="text-sm text-muted-foreground">Chat with your agents</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 justify-start">
              <TrendingUp className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">View Analytics</div>
                <div className="text-sm text-muted-foreground">Agent performance metrics</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
