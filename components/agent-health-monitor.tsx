"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  Heart,
  Cpu,
  Timer,
  Target,
} from "lucide-react"
import type { Agent } from "@/lib/types"

interface AgentHealthMetrics {
  agentId: string
  healthScore: number
  responseTime: number
  successRate: number
  tasksCompleted: number
  errorRate: number
  memoryUsage: number
  lastActive: string
  status: "healthy" | "warning" | "critical" | "offline"
  issues: HealthIssue[]
  trends: {
    responseTime: "up" | "down" | "stable"
    successRate: "up" | "down" | "stable"
    errorRate: "up" | "down" | "stable"
  }
}

interface HealthIssue {
  id: string
  type: "performance" | "error" | "timeout" | "memory"
  severity: "low" | "medium" | "high"
  description: string
  suggestion: string
  timestamp: string
}

interface AgentHealthMonitorProps {
  agents: Agent[]
}

export function AgentHealthMonitor({ agents }: AgentHealthMonitorProps) {
  const [healthMetrics] = useState<AgentHealthMetrics[]>([
    {
      agentId: "jamie",
      healthScore: 92,
      responseTime: 2.3,
      successRate: 94,
      tasksCompleted: 127,
      errorRate: 6,
      memoryUsage: 45,
      lastActive: "2 min ago",
      status: "healthy",
      issues: [],
      trends: {
        responseTime: "stable",
        successRate: "up",
        errorRate: "down",
      },
    },
    {
      agentId: "mel",
      healthScore: 78,
      responseTime: 8.7,
      successRate: 89,
      tasksCompleted: 89,
      errorRate: 11,
      memoryUsage: 72,
      lastActive: "5 min ago",
      status: "warning",
      issues: [
        {
          id: "1",
          type: "performance",
          severity: "medium",
          description: "Response time increased by 40% in last hour",
          suggestion: "Check integration connections and reduce concurrent tasks",
          timestamp: "15 min ago",
        },
        {
          id: "2",
          type: "memory",
          severity: "low",
          description: "Memory usage above 70%",
          suggestion: "Clear old conversation history or restart agent",
          timestamp: "1 hour ago",
        },
      ],
      trends: {
        responseTime: "up",
        successRate: "down",
        errorRate: "up",
      },
    },
    {
      agentId: "tara",
      healthScore: 96,
      responseTime: 1.8,
      successRate: 98,
      tasksCompleted: 45,
      errorRate: 2,
      memoryUsage: 32,
      lastActive: "1 hour ago",
      status: "healthy",
      issues: [],
      trends: {
        responseTime: "stable",
        successRate: "stable",
        errorRate: "stable",
      },
    },
    {
      agentId: "devon",
      healthScore: 65,
      responseTime: 15.2,
      successRate: 76,
      tasksCompleted: 34,
      errorRate: 24,
      memoryUsage: 88,
      lastActive: "15 min ago",
      status: "critical",
      issues: [
        {
          id: "3",
          type: "timeout",
          severity: "high",
          description: "Multiple task timeouts in last 30 minutes",
          suggestion: "Restart agent or check HubSpot integration status",
          timestamp: "10 min ago",
        },
        {
          id: "4",
          type: "error",
          severity: "high",
          description: "High error rate on CRM operations",
          suggestion: "Verify HubSpot API credentials and rate limits",
          timestamp: "20 min ago",
        },
        {
          id: "5",
          type: "memory",
          severity: "medium",
          description: "Memory usage critical (88%)",
          suggestion: "Immediate restart recommended",
          timestamp: "5 min ago",
        },
      ],
      trends: {
        responseTime: "up",
        successRate: "down",
        errorRate: "up",
      },
    },
    {
      agentId: "mira",
      healthScore: 88,
      responseTime: 3.1,
      successRate: 91,
      tasksCompleted: 18,
      errorRate: 9,
      memoryUsage: 38,
      lastActive: "30 min ago",
      status: "healthy",
      issues: [
        {
          id: "6",
          type: "performance",
          severity: "low",
          description: "Slight increase in response time for Zapier tasks",
          suggestion: "Monitor Zapier integration performance",
          timestamp: "45 min ago",
        },
      ],
      trends: {
        responseTime: "up",
        successRate: "stable",
        errorRate: "stable",
      },
    },
  ])

  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-green-500"
    if (score >= 70) return "text-yellow-500"
    return "text-red-500"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "default"
      case "warning":
        return "secondary"
      case "critical":
        return "destructive"
      case "offline":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "offline":
        return <Clock className="w-4 h-4 text-gray-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-red-500" />
      case "down":
        return <TrendingDown className="w-3 h-3 text-green-500" />
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const handleRestartAgent = (agentId: string) => {
    console.log(`Restarting agent: ${agentId}`)
    // Simulate restart
  }

  const handleClearMemory = (agentId: string) => {
    console.log(`Clearing memory for agent: ${agentId}`)
    // Simulate memory clear
  }

  const healthyAgents = healthMetrics.filter((m) => m.status === "healthy").length
  const warningAgents = healthMetrics.filter((m) => m.status === "warning").length
  const criticalAgents = healthMetrics.filter((m) => m.status === "critical").length
  const avgHealthScore = Math.round(healthMetrics.reduce((sum, m) => sum + m.healthScore, 0) / healthMetrics.length)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-2xl text-primary">Agent Health Monitor</h1>
          <p className="text-muted-foreground">Real-time agent performance and diagnostics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="font-pixel text-xs">
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="font-pixel text-xs">
            <Settings className="w-4 h-4 mr-1" />
            Configure
          </Button>
        </div>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Avg Health Score</CardTitle>
            <Heart className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-pixel ${getHealthColor(avgHealthScore)}`}>{avgHealthScore}%</div>
            <p className="text-xs text-muted-foreground">Across all agents</p>
          </CardContent>
        </Card>

        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Healthy Agents</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">{healthyAgents}</div>
            <p className="text-xs text-muted-foreground">Operating normally</p>
          </CardContent>
        </Card>

        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Warnings</CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">{warningAgents}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Critical Issues</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">{criticalAgents}</div>
            <p className="text-xs text-muted-foreground">Immediate action needed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="font-pixel">
          <TabsTrigger value="overview" className="text-xs">
            OVERVIEW
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-xs">
            PERFORMANCE
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="text-xs">
            DIAGNOSTICS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {healthMetrics.map((metrics) => {
              const agent = agents.find((a) => a.id === metrics.agentId)
              if (!agent) return null

              return (
                <Card key={metrics.agentId} className="border-pixel">
                  <CardHeader>
                    <CardTitle className="font-pixel text-sm flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{agent.avatar}</span>
                        <span>{agent.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(metrics.status)}
                        <Badge variant={getStatusColor(metrics.status)} className="font-pixel text-xs">
                          {metrics.status}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Health Score */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Health Score</span>
                        <span className={`font-pixel ${getHealthColor(metrics.healthScore)}`}>
                          {metrics.healthScore}%
                        </span>
                      </div>
                      <Progress value={metrics.healthScore} className="h-2" />
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Timer className="w-3 h-3 mr-1" />
                            Response
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className="font-pixel">{metrics.responseTime}s</span>
                            {getTrendIcon(metrics.trends.responseTime)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Target className="w-3 h-3 mr-1" />
                            Success
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className="font-pixel">{metrics.successRate}%</span>
                            {getTrendIcon(metrics.trends.successRate)}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Errors
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className="font-pixel">{metrics.errorRate}%</span>
                            {getTrendIcon(metrics.trends.errorRate)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Cpu className="w-3 h-3 mr-1" />
                            Memory
                          </span>
                          <span className="font-pixel">{metrics.memoryUsage}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Issues */}
                    {metrics.issues.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-pixel text-xs text-primary">ACTIVE ISSUES</h4>
                        {metrics.issues.slice(0, 2).map((issue) => (
                          <div key={issue.id} className="bg-muted/50 p-2 rounded border-pixel">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant={getSeverityColor(issue.severity)} className="font-pixel text-xs">
                                {issue.severity}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{issue.timestamp}</span>
                            </div>
                            <p className="text-xs mb-1">{issue.description}</p>
                            <p className="text-xs text-primary">💡 {issue.suggestion}</p>
                          </div>
                        ))}
                        {metrics.issues.length > 2 && (
                          <p className="text-xs text-muted-foreground">+{metrics.issues.length - 2} more issues</p>
                        )}
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex space-x-2">
                      {metrics.status === "critical" && (
                        <Button
                          onClick={() => handleRestartAgent(metrics.agentId)}
                          size="sm"
                          className="flex-1 font-pixel text-xs"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Restart
                        </Button>
                      )}
                      {metrics.memoryUsage > 70 && (
                        <Button
                          onClick={() => handleClearMemory(metrics.agentId)}
                          variant="outline"
                          size="sm"
                          className="flex-1 font-pixel text-xs"
                        >
                          <Brain className="w-3 h-3 mr-1" />
                          Clear Memory
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="font-pixel text-xs">
                        <Settings className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-pixel">
              <CardHeader>
                <CardTitle className="font-pixel text-sm">Response Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {healthMetrics.map((metrics) => {
                    const agent = agents.find((a) => a.id === metrics.agentId)
                    if (!agent) return null

                    return (
                      <div key={metrics.agentId} className="flex items-center space-x-3">
                        <span className="text-sm">{agent.avatar}</span>
                        <div className="w-16 text-xs font-pixel">{agent.name}</div>
                        <div className="flex-1">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                metrics.responseTime > 10
                                  ? "bg-red-500"
                                  : metrics.responseTime > 5
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }`}
                              style={{ width: `${Math.min((metrics.responseTime / 20) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-12 text-xs font-pixel text-right">{metrics.responseTime}s</div>
                        {getTrendIcon(metrics.trends.responseTime)}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-pixel">
              <CardHeader>
                <CardTitle className="font-pixel text-sm">Success Rate Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {healthMetrics.map((metrics) => {
                    const agent = agents.find((a) => a.id === metrics.agentId)
                    if (!agent) return null

                    return (
                      <div key={metrics.agentId} className="flex items-center space-x-3">
                        <span className="text-sm">{agent.avatar}</span>
                        <div className="w-16 text-xs font-pixel">{agent.name}</div>
                        <div className="flex-1">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="h-2 rounded-full bg-primary" style={{ width: `${metrics.successRate}%` }} />
                          </div>
                        </div>
                        <div className="w-12 text-xs font-pixel text-right">{metrics.successRate}%</div>
                        {getTrendIcon(metrics.trends.successRate)}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <div className="space-y-4">
            {healthMetrics
              .filter((m) => m.issues.length > 0)
              .map((metrics) => {
                const agent = agents.find((a) => a.id === metrics.agentId)
                if (!agent) return null

                return (
                  <Card key={metrics.agentId} className="border-pixel">
                    <CardHeader>
                      <CardTitle className="font-pixel text-sm flex items-center space-x-2">
                        <span className="text-lg">{agent.avatar}</span>
                        <span>{agent.name} Diagnostics</span>
                        <Badge variant={getStatusColor(metrics.status)} className="font-pixel text-xs">
                          {metrics.issues.length} issues
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {metrics.issues.map((issue) => (
                          <div key={issue.id} className="border border-pixel rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant={getSeverityColor(issue.severity)} className="font-pixel text-xs">
                                  {issue.severity}
                                </Badge>
                                <Badge variant="outline" className="font-pixel text-xs">
                                  {issue.type}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">{issue.timestamp}</span>
                            </div>
                            <p className="text-sm mb-2">{issue.description}</p>
                            <div className="bg-blue-50 border border-blue-200 rounded p-2">
                              <p className="text-xs text-blue-700">
                                <strong>Suggestion:</strong> {issue.suggestion}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
