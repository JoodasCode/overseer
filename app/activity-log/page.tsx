"use client"

import { SharedLayout } from '@/components/shared/SharedLayout'
import { Filter, Search, CheckCircle, AlertCircle, XCircle, Clock, User, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const activities = [
  {
    id: 1,
    type: "task_completed",
    title: "Task Completed",
    description: "Security audit completed successfully",
    agent: "Jamie",
    avatar: "🛡️",
    avatarUrl: "/avatars/jamie.jpg",
    timestamp: "2024-01-15T14:30:00Z",
    status: "success",
    details: "Weekly security system audit finished on schedule"
  },
  {
    id: 2,
    type: "agent_started",
    title: "Agent Started",
    description: "Alex began working on Q4 revenue analysis",
    agent: "Alex",
    avatar: "🧑‍💼",
    avatarUrl: "/avatars/alex.jpg",
    timestamp: "2024-01-15T13:45:00Z",
    status: "info",
    details: "Strategic analysis phase initiated"
  },
  {
    id: 3,
    type: "task_failed",
    title: "Task Failed",
    description: "API integration setup encountered errors",
    agent: "Dana",
    avatar: "⚙️",
    avatarUrl: "/avatars/dana.jpg",
    timestamp: "2024-01-15T12:20:00Z",
    status: "error",
    details: "Connection timeout during CRM integration"
  },
  {
    id: 4,
    type: "collaboration",
    title: "Agent Collaboration",
    description: "Toby requested assistance from Riley",
    agent: "Toby",
    avatar: "👨‍💻",
    avatarUrl: "/avatars/toby.jpg",
    timestamp: "2024-01-15T11:15:00Z",
    status: "info",
    details: "Customer support case escalated for content review"
  },
  {
    id: 5,
    type: "task_assigned",
    title: "Task Assigned",
    description: "Blog content generation assigned to Riley",
    agent: "System",
    avatar: "🤖",
    avatarUrl: null,
    timestamp: "2024-01-15T10:30:00Z",
    status: "info",
    details: "Marketing campaign content creation"
  },
  {
    id: 6,
    type: "agent_offline",
    title: "Agent Offline",
    description: "Dana went offline unexpectedly",
    agent: "Dana",
    avatar: "⚙️",
    avatarUrl: "/avatars/dana.jpg",
    timestamp: "2024-01-15T09:45:00Z",
    status: "warning",
    details: "System connection lost during active task"
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "success": return "bg-green-500/10 text-green-600 border-green-500/20"
    case "error": return "bg-red-500/10 text-red-600 border-red-500/20"
    case "warning": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
    case "info": return "bg-blue-500/10 text-blue-600 border-blue-500/20"
    default: return "bg-gray-500/10 text-gray-600 border-gray-500/20"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "success": return <CheckCircle className="h-4 w-4" />
    case "error": return <XCircle className="h-4 w-4" />
    case "warning": return <AlertCircle className="h-4 w-4" />
    case "info": return <Clock className="h-4 w-4" />
    default: return <Clock className="h-4 w-4" />
  }
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return "Just now"
  if (diffInHours < 24) return `${diffInHours}h ago`
  return date.toLocaleDateString()
}

export default function ActivityLogPage() {
  const totalActivities = activities.length
  const successCount = activities.filter(a => a.status === "success").length
  const errorCount = activities.filter(a => a.status === "error").length
  const warningCount = activities.filter(a => a.status === "warning").length

  return (
    <SharedLayout title="Activity Log" description="Monitor all agent activities and system events">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalActivities}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successCount}</div>
              <p className="text-xs text-muted-foreground">Completed tasks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{warningCount}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{errorCount}</div>
              <p className="text-xs text-muted-foreground">Failed activities</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                className="pl-10"
              />
            </div>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="task_completed">Task Completed</SelectItem>
                <SelectItem value="task_failed">Task Failed</SelectItem>
                <SelectItem value="agent_started">Agent Started</SelectItem>
                <SelectItem value="collaboration">Collaboration</SelectItem>
                <SelectItem value="task_assigned">Task Assigned</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                <SelectItem value="alex">Alex</SelectItem>
                <SelectItem value="toby">Toby</SelectItem>
                <SelectItem value="riley">Riley</SelectItem>
                <SelectItem value="jamie">Jamie</SelectItem>
                <SelectItem value="dana">Dana</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Real-time feed of all agent activities and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {getStatusIcon(activity.status)}
                    </div>
                    {activity.avatar ? (
                      <Avatar className="h-8 w-8">
                        {activity.avatarUrl && <AvatarImage src={activity.avatarUrl} alt={activity.agent} />}
                        <AvatarFallback>{activity.avatar}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{activity.title}</h4>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        by <span className="font-medium">{activity.agent}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SharedLayout>
  )
} 