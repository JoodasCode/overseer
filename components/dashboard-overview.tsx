"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HireAgentModal } from "./hire-agent-modal"
import { ConfirmDeleteModal } from "./confirm-delete-modal"
import { DepartmentOverview } from "./communications-dept/department-overview"
import { Users, CheckCircle, Clock, TrendingUp, Star, Zap, AlertCircle, Plus, Activity, Trash2, MessageSquare, Eye, ArrowRight } from "lucide-react"
import { useToast } from "@/lib/hooks/use-toast"
import { useAgents } from "@/lib/hooks/use-api"
import type { Agent } from "@/lib/types"

interface DashboardOverviewProps {
  agents: Agent[]
  onSelectAgent: (agent: Agent) => void
  onAgentHired?: () => void
  onShowCommunicationsDept?: () => void
}

export function DashboardOverview({ agents, onSelectAgent, onAgentHired, onShowCommunicationsDept }: DashboardOverviewProps) {
  const [showHireAgent, setShowHireAgent] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteAgent } = useAgents()
  const { toast } = useToast()

  // Ensure agents is always an array to prevent undefined errors
  const safeAgents = agents || []

  // Filter agents by department
  const communicationsAgents = safeAgents.filter(agent => 
    agent.metadata?.department === 'communications' || 
    agent.preferences?.department === 'communications'
  )

  const totalTasks = safeAgents.reduce((sum, agent) => sum + (agent.tasks?.length || 0), 0)
  const completedTasks = safeAgents.reduce(
    (sum, agent) => sum + (agent.tasks?.filter((t) => t.status === "completed").length || 0),
    0,
  )
  const activeAgents = safeAgents.filter((agent) => agent.status === "active").length
  const totalXP = safeAgents.reduce((sum, agent) => sum + (agent.level || 0) * 250, 0)

  const recentActivity = safeAgents
    .flatMap((agent) =>
      (agent.tasks || [])
        .filter((task) => task.status === "completed")
        .map((task) => ({
          agent,
          task,
          timestamp: "2 hours ago",
        })),
    )
    .slice(0, 5)

  // Random agent quotes for vibes
  const agentQuotes = [
    { agent: "Mel", quote: "Press release ready for blast off 🚀" },
    { agent: "Tara", quote: "Need approval on onboarding kit." },
    { agent: "Jamie", quote: "Newsletter CTR up 15% this week! 📈" },
  ]

  const handleDeleteAgent = (agent: Agent) => {
    setAgentToDelete(agent)
    setShowDeleteModal(true)
  }

  const confirmDeleteAgent = async () => {
    if (!agentToDelete) return

    setIsDeleting(true)
    try {
      await deleteAgent(agentToDelete.id)
      toast({
        variant: "success",
        title: "🗑️ Agent Removed",
        description: `${agentToDelete.name} has been successfully removed from your team.`,
      })
      
      // Trigger refresh if callback provided
      if (onAgentHired) {
        onAgentHired()
      }
    } catch (error) {
      console.error('❌ Failed to delete agent:', error)
      toast({
        variant: "destructive",
        title: "❌ Failed to Remove Agent",
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setAgentToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-2xl text-primary">Mission Control</h1>
          <p className="text-muted-foreground font-clean text-sm">Your AI team dashboard</p>
        </div>
        <Button className="pixel-button font-pixel text-xs px-4 py-2 flex items-center" onClick={() => setShowHireAgent(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Hire Agent
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="pixel-card p-4">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="font-pixel text-xs text-primary">Active Agents</h3>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-pixel text-foreground">{activeAgents}</div>
          <p className="text-xs text-muted-foreground font-clean">of {safeAgents.length} total</p>
        </div>

        <div className="pixel-card p-4">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="font-pixel text-xs text-primary">Tasks Complete</h3>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-pixel text-foreground">{completedTasks}</div>
          <p className="text-xs text-muted-foreground font-clean">of {totalTasks} total</p>
        </div>

        <div className="pixel-card p-4">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="font-pixel text-xs text-primary">Team XP</h3>
            <Star className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-pixel text-foreground">{totalXP.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground font-clean">+250 today</p>
        </div>

        <div className="pixel-card p-4">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="font-pixel text-xs text-primary">Efficiency</h3>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-pixel text-foreground">94%</div>
          <p className="text-xs text-muted-foreground font-clean">+5% from last week</p>
        </div>
      </div>

      {/* Communications Department Showcase */}
      {communicationsAgents.length > 0 && (
        <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle className="text-xl">Communications Department</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {communicationsAgents.length} specialized agents working together
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onShowCommunicationsDept}
                className="font-pixel text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                View Department
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              {communicationsAgents.map((agent) => (
                <div key={agent.id} className="text-center">
                  <div 
                    className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => onSelectAgent(agent)}
                  >
                    <span className="text-2xl">{agent.avatar_url}</span>
                  </div>
                  <div className="text-xs font-medium">{agent.name}</div>
                  <div className="text-xs text-muted-foreground">{agent.preferences?.role || 'Agent'}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-bold text-blue-600">{communicationsAgents.length}</div>
                <div className="text-xs text-muted-foreground">Active Agents</div>
              </div>
              <div>
                <div className="font-bold text-green-600">
                  {communicationsAgents.reduce((sum, agent) => sum + (agent.tasks?.length || 0), 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Tasks</div>
              </div>
              <div>
                <div className="font-bold text-purple-600">94%</div>
                <div className="text-xs text-muted-foreground">Efficiency</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Status */}
        <div className="lg:col-span-2 space-y-4">
          <div className="pixel-card p-6">
            <h3 className="font-pixel text-sm text-primary mb-4">Agent Status</h3>
            <div className="space-y-4">
              {safeAgents.map((agent) => {
                const completedToday = (agent.tasks || []).filter((t) => t.status === "completed").length
                const inProgress = (agent.tasks || []).filter((t) => t.status === "in-progress").length
                const pending = (agent.tasks || []).filter((t) => t.status === "pending").length
                const totalTasks = (agent.tasks || []).length
                const progress = totalTasks > 0 ? (completedToday / totalTasks) * 100 : 0

                return (
                  <div
                    key={agent.id}
                    className="agent-card-pixel p-4 cursor-pointer"
                    onClick={() => onSelectAgent(agent)}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{agent.avatar}</span>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-pixel text-sm text-foreground">{agent.name}</h4>
                            <p className="text-xs text-muted-foreground font-clean">{agent.role}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={agent.status === "active" ? "default" : "secondary"}
                              className="font-pixel text-xs"
                            >
                              {agent.status}
                            </Badge>
                            <Badge variant="outline" className="font-pixel text-xs">
                              Lv.{agent.level}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteAgent(agent)
                              }}
                              className="font-pixel text-xs px-2 h-6 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-clean">
                            <span>Efficiency: {Math.round(progress)}%</span>
                            <span>
                              {completedToday}/{totalTasks} tasks
                            </span>
                          </div>
                          <div className="xp-bar-pixel">
                            <div className="xp-progress-pixel" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="efficiency-breakdown">
                            <div className="efficiency-item">
                              <div className="efficiency-dot completed"></div>
                              <span>{completedToday} Completed</span>
                            </div>
                            <div className="efficiency-item">
                              <div className="efficiency-dot in-progress"></div>
                              <span>{inProgress} In Progress</span>
                            </div>
                            <div className="efficiency-item">
                              <div className="efficiency-dot pending"></div>
                              <span>{pending} Pending</span>
                            </div>
                          </div>
                        </div>

                        {/* Random agent quote */}
                        {agentQuotes.find((q) => q.agent === agent.name) && (
                          <div className="agent-quote font-clean">
                            "{agentQuotes.find((q) => q.agent === agent.name)?.quote}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="pixel-card p-6">
            <h3 className="font-pixel text-sm text-primary flex items-center mb-4">
              <Activity className="w-4 h-4 mr-2" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 text-xs">
                  <span className="text-lg">{activity.agent.avatar}</span>
                  <div className="flex-1">
                    <p className="font-clean text-sm">
                      <span className="font-pixel text-primary text-xs">{activity.agent.name}</span> completed
                    </p>
                    <p className="text-muted-foreground font-clean">{activity.task.title}</p>
                    <p className="text-muted-foreground font-clean text-xs">{activity.timestamp}</p>
                  </div>
                  {activity.task.xpReward && (
                    <Badge variant="outline" className="font-pixel text-xs">
                      +{activity.task.xpReward} XP
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pixel-card p-6">
            <h3 className="font-pixel text-sm text-primary flex items-center mb-4">
              <AlertCircle className="w-4 h-4 mr-2" />
              Needs Attention
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 text-yellow-500" />
                <span className="font-clean">Jamie waiting on event materials</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-3 h-3 text-red-500" />
                <span className="font-clean">Tara needs interview feedback</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-3 h-3 text-blue-500 pixel-bounce" />
                <span className="font-clean">Mel ready for level up</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <HireAgentModal isOpen={showHireAgent} onClose={() => setShowHireAgent(false)} onAgentHired={onAgentHired} />
      <ConfirmDeleteModal 
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setAgentToDelete(null)
        }}
        onConfirm={confirmDeleteAgent}
        agent={agentToDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
