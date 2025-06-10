"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Plus, 
  Users, 
  Settings, 
  MessageSquare,
  Activity,
  TrendingUp,
  Filter
} from "lucide-react"
import { DashboardOverview } from "./dashboard-overview"
import { AgentProfile } from "./agent-profile"
import { HireAgentModal } from "./hire-agent-modal"
import { AgentChatInterface } from "./agent-chat-interface"
import { useAgents } from "@/lib/hooks/use-api"
import { useToast } from "@/lib/hooks/use-toast"
import type { Agent } from "@/lib/types"

type CurrentPage = 
  | "dashboard" 
  | "agents" 
  | "agent-profile" 
  | "agent-chat"

interface AgentsDashboardProps {
  onNavigate?: (page: string) => void
}

export function AgentsDashboard({ onNavigate }: AgentsDashboardProps) {
  const [currentPage, setCurrentPage] = useState<CurrentPage>("dashboard")
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showHireModal, setShowHireModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  
  const { agents, loading, error, refetch } = useAgents()
  const { toast } = useToast()

  const handleViewAgentProfile = (agent: Agent) => {
    setSelectedAgent(agent)
    setCurrentPage("agent-profile")
  }

  const handleChatWithAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setCurrentPage("agent-chat")
  }

  const handleAgentHired = () => {
    setShowHireModal(false)
    refetch()
    toast({
      variant: "success",
      title: "🎉 Agent Hired Successfully!",
      description: "Your new agent is ready to help you achieve your goals.",
    })
  }

  const handleBackToDashboard = () => {
    setCurrentPage("dashboard")
    setSelectedAgent(null)
  }

  const handleBackToAgents = () => {
    setCurrentPage("agents")
    setSelectedAgent(null)
  }

  // Filter agents based on search and status
  const filteredAgents = agents?.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || agent.status === filterStatus
    return matchesSearch && matchesStatus
  }) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">Error loading agents: {error}</p>
        <Button onClick={refetch}>Try Again</Button>
      </div>
    )
  }

  // Render different pages
  switch (currentPage) {
    case "dashboard":
      return <DashboardOverview agents={agents || []} onSelectAgent={handleViewAgentProfile} onAgentHired={() => setShowHireModal(true)} />
    
    case "agent-profile":
      return selectedAgent ? (
        <AgentProfile 
          agent={selectedAgent} 
          onBack={handleBackToDashboard}
        />
      ) : null

    case "agent-chat":
      return selectedAgent ? (
        <AgentChatInterface 
          agent={selectedAgent}
          isOpen={true}
          onClose={handleBackToDashboard}
        />
      ) : null

    case "agents":
    default:
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">AI Agents</h1>
              <p className="text-muted-foreground">Manage your AI team</p>
            </div>
            <Button onClick={() => setShowHireModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Hire Agent
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-3xl">{agent.avatar_url || '🤖'}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {agent.preferences?.role || agent.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                      {agent.status || 'idle'}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {agent.stats?.total_tasks_completed || 0} tasks completed
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChatWithAgent(agent)}
                      className="flex-1"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Chat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAgentProfile(agent)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || filterStatus !== "all" ? "No agents found" : "No agents yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterStatus !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Get started by hiring your first AI agent"
                }
              </p>
              {!searchQuery && filterStatus === "all" && (
                <Button onClick={() => setShowHireModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Hire Your First Agent
                </Button>
              )}
            </div>
          )}

          {/* Hire Agent Modal */}
          <HireAgentModal
            isOpen={showHireModal}
            onClose={() => setShowHireModal(false)}
            onAgentHired={handleAgentHired}
          />
        </div>
      )
  }
}
