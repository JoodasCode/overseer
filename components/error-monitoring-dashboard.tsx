"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  RefreshCw,
  ExternalLink,
  Bug,
  Zap,
  Activity,
  TrendingUp,
  Shield,
  Bell,
} from "lucide-react"

interface ErrorEvent {
  id: string
  timestamp: string
  type: "integration" | "agent" | "task" | "system"
  severity: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  source: string
  status: "open" | "investigating" | "resolved"
  affectedUsers?: number
  resolution?: string
  stackTrace?: string
}

interface SystemHealth {
  overall: number
  integrations: number
  agents: number
  tasks: number
  uptime: string
}

export function ErrorMonitoringDashboard() {
  const [errors] = useState<ErrorEvent[]>([
    {
      id: "1",
      timestamp: "2024-01-20 14:32:15",
      type: "integration",
      severity: "high",
      title: "Notion API Rate Limit Exceeded",
      description: "Multiple agents hitting Notion API rate limits causing task failures",
      source: "Notion Integration",
      status: "investigating",
      affectedUsers: 3,
      stackTrace: "RateLimitError: Too many requests to Notion API\n  at NotionClient.request()",
    },
    {
      id: "2",
      timestamp: "2024-01-20 14:15:42",
      type: "agent",
      severity: "medium",
      title: "Jamie Response Timeout",
      description: "Agent Jamie failed to respond within 30 seconds for newsletter task",
      source: "Agent: Jamie",
      status: "open",
      affectedUsers: 1,
    },
    {
      id: "3",
      timestamp: "2024-01-20 13:58:21",
      type: "task",
      severity: "low",
      title: "Task Retry Limit Reached",
      description: "Social media post task failed after 3 retry attempts",
      source: "Task Engine",
      status: "resolved",
      resolution: "Task manually completed by user",
    },
    {
      id: "4",
      timestamp: "2024-01-20 13:45:33",
      type: "system",
      severity: "critical",
      title: "Database Connection Pool Exhausted",
      description: "All database connections in use, new requests failing",
      source: "Database",
      status: "resolved",
      affectedUsers: 12,
      resolution: "Increased connection pool size from 10 to 20",
    },
    {
      id: "5",
      timestamp: "2024-01-20 12:22:18",
      type: "integration",
      severity: "medium",
      title: "Gmail OAuth Token Expired",
      description: "Gmail integration failing due to expired OAuth token",
      source: "Gmail Integration",
      status: "resolved",
      resolution: "User re-authenticated with Gmail",
    },
  ])

  const [systemHealth] = useState<SystemHealth>({
    overall: 94,
    integrations: 89,
    agents: 97,
    tasks: 92,
    uptime: "99.8%",
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "high":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "medium":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "low":
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "investigating":
        return <Clock className="w-4 h-4 text-blue-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "integration":
        return <Zap className="w-4 h-4" />
      case "agent":
        return <Activity className="w-4 h-4" />
      case "task":
        return <CheckCircle className="w-4 h-4" />
      case "system":
        return <Shield className="w-4 h-4" />
      default:
        return <Bug className="w-4 h-4" />
    }
  }

  const filteredErrors = errors.filter((error) => {
    const matchesSearch =
      error.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      error.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      error.source.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSeverity = selectedSeverity === "all" || error.severity === selectedSeverity
    const matchesType = selectedType === "all" || error.type === selectedType

    return matchesSearch && matchesSeverity && matchesType
  })

  const criticalErrors = errors.filter((e) => e.severity === "critical" && e.status === "open").length
  const openErrors = errors.filter((e) => e.status === "open").length
  const resolvedToday = errors.filter((e) => e.status === "resolved").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-2xl text-primary">Error Monitoring</h1>
          <p className="text-muted-foreground">System health and error tracking</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="font-pixel text-xs">
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="font-pixel text-xs">
            <Bell className="w-4 h-4 mr-1" />
            Alerts
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Overall Health</CardTitle>
            <Shield className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">{systemHealth.overall}%</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +2% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Critical Errors</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">{criticalErrors}</div>
            <p className="text-xs text-muted-foreground">Needs immediate attention</p>
          </CardContent>
        </Card>

        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Open Issues</CardTitle>
            <AlertCircle className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">{openErrors}</div>
            <p className="text-xs text-muted-foreground">Active investigations</p>
          </CardContent>
        </Card>

        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Resolved Today</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">{resolvedToday}</div>
            <p className="text-xs text-muted-foreground">Issues fixed</p>
          </CardContent>
        </Card>

        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Uptime</CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">{systemHealth.uptime}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Component Health */}
      <Card className="border-pixel">
        <CardHeader>
          <CardTitle className="font-pixel text-sm">Component Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Integrations</span>
                <span className="font-pixel">{systemHealth.integrations}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${systemHealth.integrations}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Agents</span>
                <span className="font-pixel">{systemHealth.agents}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${systemHealth.agents}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tasks</span>
                <span className="font-pixel">{systemHealth.tasks}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${systemHealth.tasks}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall</span>
                <span className="font-pixel">{systemHealth.overall}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${systemHealth.overall}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="errors">
        <TabsList className="font-pixel">
          <TabsTrigger value="errors" className="text-xs">
            ERROR LOG
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-xs">
            TRENDS
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">
            ALERTS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search errors..."
                className="pl-10 font-clean border-pixel"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 border border-pixel rounded font-pixel text-xs bg-background"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-pixel rounded font-pixel text-xs bg-background"
              >
                <option value="all">All Types</option>
                <option value="integration">Integration</option>
                <option value="agent">Agent</option>
                <option value="task">Task</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          {/* Error List */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredErrors.map((error) => (
                <Card key={error.id} className="border-pixel">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1">{getSeverityIcon(error.severity)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-pixel text-sm font-medium truncate">{error.title}</h4>
                            <Badge variant={getSeverityColor(error.severity)} className="font-pixel text-xs">
                              {error.severity}
                            </Badge>
                            <Badge variant="outline" className="font-pixel text-xs">
                              {error.type}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">{error.description}</p>

                          <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                            <span className="flex items-center">
                              {getTypeIcon(error.type)}
                              <span className="ml-1">{error.source}</span>
                            </span>
                            <span>{error.timestamp}</span>
                            {error.affectedUsers && <span>{error.affectedUsers} users affected</span>}
                          </div>

                          {error.resolution && (
                            <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
                              <p className="text-xs text-green-700">
                                <strong>Resolution:</strong> {error.resolution}
                              </p>
                            </div>
                          )}

                          {error.stackTrace && (
                            <details className="mt-2">
                              <summary className="text-xs font-pixel cursor-pointer text-primary">
                                View Stack Trace
                              </summary>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                                {error.stackTrace}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {getStatusIcon(error.status)}
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-pixel">
              <CardHeader>
                <CardTitle className="font-pixel text-sm">Error Trends (7 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
                    const errorCount = Math.floor(Math.random() * 10) + 1
                    const maxErrors = 10
                    return (
                      <div key={day} className="flex items-center space-x-3">
                        <div className="w-8 text-xs font-pixel">{day}</div>
                        <div className="flex-1">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-red-500"
                              style={{ width: `${(errorCount / maxErrors) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-8 text-xs font-pixel text-right">{errorCount}</div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-pixel">
              <CardHeader>
                <CardTitle className="font-pixel text-sm">Error Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: "Integration", count: 8, color: "bg-blue-500" },
                    { type: "Agent", count: 5, color: "bg-green-500" },
                    { type: "Task", count: 3, color: "bg-yellow-500" },
                    { type: "System", count: 2, color: "bg-red-500" },
                  ].map((item) => (
                    <div key={item.type} className="flex items-center space-x-3">
                      <div className="w-16 text-xs font-pixel">{item.type}</div>
                      <div className="flex-1">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.count * 10}%` }} />
                        </div>
                      </div>
                      <div className="w-8 text-xs font-pixel text-right">{item.count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="border-pixel">
            <CardHeader>
              <CardTitle className="font-pixel text-sm">Alert Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: "Critical Error Threshold",
                    condition: "More than 3 critical errors in 1 hour",
                    status: "active",
                    lastTriggered: "Never",
                  },
                  {
                    name: "Agent Response Time",
                    condition: "Agent response time > 30 seconds",
                    status: "active",
                    lastTriggered: "2 hours ago",
                  },
                  {
                    name: "Integration Failure Rate",
                    condition: "Integration failure rate > 10%",
                    status: "active",
                    lastTriggered: "1 day ago",
                  },
                  {
                    name: "System Health Drop",
                    condition: "Overall health drops below 90%",
                    status: "paused",
                    lastTriggered: "Never",
                  },
                ].map((rule, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-pixel rounded">
                    <div>
                      <h4 className="font-pixel text-sm">{rule.name}</h4>
                      <p className="text-xs text-muted-foreground">{rule.condition}</p>
                      <p className="text-xs text-muted-foreground">Last triggered: {rule.lastTriggered}</p>
                    </div>
                    <Badge variant={rule.status === "active" ? "default" : "secondary"} className="font-pixel text-xs">
                      {rule.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
