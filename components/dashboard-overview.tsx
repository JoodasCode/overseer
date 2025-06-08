"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HireAgentModal } from "./hire-agent-modal"
import { Users, CheckCircle, Clock, TrendingUp, Star, Zap, AlertCircle, Plus, Activity } from "lucide-react"
import type { Agent } from "@/lib/types"

interface DashboardOverviewProps {
  agents: Agent[]
  onSelectAgent: (agent: Agent) => void
}

export function DashboardOverview({ agents, onSelectAgent }: DashboardOverviewProps) {
  const [showHireAgent, setShowHireAgent] = useState(false)

  const totalTasks = agents.reduce((sum, agent) => sum + agent.tasks.length, 0)
  const completedTasks = agents.reduce(
    (sum, agent) => sum + agent.tasks.filter((t) => t.status === "completed").length,
    0,
  )
  const activeAgents = agents.filter((agent) => agent.status === "active").length
  const totalXP = agents.reduce((sum, agent) => sum + agent.level * 250, 0)

  const recentActivity = agents
    .flatMap((agent) =>
      agent.tasks
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
          <p className="text-xs text-muted-foreground font-clean">of {agents.length} total</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Status */}
        <div className="lg:col-span-2 space-y-4">
          <div className="pixel-card p-6">
            <h3 className="font-pixel text-sm text-primary mb-4">Agent Status</h3>
            <div className="space-y-4">
              {agents.map((agent) => {
                const completedToday = agent.tasks.filter((t) => t.status === "completed").length
                const inProgress = agent.tasks.filter((t) => t.status === "in-progress").length
                const pending = agent.tasks.filter((t) => t.status === "pending").length
                const totalTasks = agent.tasks.length
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

      <HireAgentModal isOpen={showHireAgent} onClose={() => setShowHireAgent(false)} />
    </div>
  )
}
