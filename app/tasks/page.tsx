"use client"

import { SharedLayout } from '@/components/shared/SharedLayout'
import { Plus, Search, Filter, Clock, CheckCircle, AlertCircle, XCircle, Eye, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

const tasks = [
  {
    id: 1,
    title: "Analyze Q4 Revenue Report",
    description: "Review quarterly revenue data and generate insights",
    status: "In Progress",
    priority: "High",
    assignedAgent: "Alex",
    avatar: "🧑‍💼",
    avatarUrl: "/avatars/alex.jpg",
    dueDate: "2024-01-20",
    progress: 75,
    estimatedHours: 4,
    actualHours: 3
  },
  {
    id: 2,
    title: "Customer Support Ticket #4829",
    description: "Resolve billing inquiry for enterprise client",
    status: "Review",
    priority: "Medium",
    assignedAgent: "Toby",
    avatar: "👨‍💻",
    avatarUrl: "/avatars/toby.jpg",
    dueDate: "2024-01-18",
    progress: 100,
    estimatedHours: 2,
    actualHours: 1.5
  },
  {
    id: 3,
    title: "Blog Content Generation",
    description: "Create 5 blog posts for marketing campaign",
    status: "Assigned",
    priority: "Low",
    assignedAgent: "Riley",
    avatar: "✍️",
    avatarUrl: "/avatars/riley.jpg",
    dueDate: "2024-01-25",
    progress: 20,
    estimatedHours: 8,
    actualHours: 1.5
  },
  {
    id: 4,
    title: "Security Audit",
    description: "Conduct weekly security system audit",
    status: "Complete",
    priority: "High",
    assignedAgent: "Jamie",
    avatar: "🛡️",
    avatarUrl: "/avatars/jamie.jpg",
    dueDate: "2024-01-16",
    progress: 100,
    estimatedHours: 3,
    actualHours: 2.5
  },
  {
    id: 5,
    title: "API Integration Setup",
    description: "Configure new CRM integration pipeline",
    status: "Failed",
    priority: "High",
    assignedAgent: "Dana",
    avatar: "⚙️",
    avatarUrl: "/avatars/dana.jpg",
    dueDate: "2024-01-17",
    progress: 60,
    estimatedHours: 6,
    actualHours: 4
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Complete": return "bg-green-500/10 text-green-600 border-green-500/20"
    case "In Progress": return "bg-blue-500/10 text-blue-600 border-blue-500/20"
    case "Review": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
    case "Assigned": return "bg-purple-500/10 text-purple-600 border-purple-500/20"
    case "Failed": return "bg-red-500/10 text-red-600 border-red-500/20"
    default: return "bg-gray-500/10 text-gray-600 border-gray-500/20"
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High": return "bg-red-500/10 text-red-600 border-red-500/20"
    case "Medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
    case "Low": return "bg-green-500/10 text-green-600 border-green-500/20"
    default: return "bg-gray-500/10 text-gray-600 border-gray-500/20"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Complete": return <CheckCircle className="h-4 w-4" />
    case "In Progress": return <Clock className="h-4 w-4" />
    case "Review": return <Eye className="h-4 w-4" />
    case "Assigned": return <Play className="h-4 w-4" />
    case "Failed": return <XCircle className="h-4 w-4" />
    default: return <AlertCircle className="h-4 w-4" />
  }
}

export default function TasksPage() {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === "Complete").length
  const inProgressTasks = tasks.filter(t => t.status === "In Progress").length
  const failedTasks = tasks.filter(t => t.status === "Failed").length

  return (
    <SharedLayout title="Tasks" description="Manage and monitor agent tasks">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks}</div>
              <p className="text-xs text-muted-foreground">Successfully finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressTasks}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{failedTasks}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-10"
              />
            </div>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Tasks</CardTitle>
            <CardDescription>
              A complete list of all tasks assigned to your agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {task.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(task.status)}
                          {task.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.avatarUrl} alt={task.assignedAgent} />
                          <AvatarFallback>{task.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{task.assignedAgent}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={task.progress} className="w-16" />
                        <div className="text-xs text-muted-foreground">
                          {task.progress}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{task.dueDate}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{task.actualHours}h / {task.estimatedHours}h</div>
                        <div className="text-xs text-muted-foreground">
                          {task.actualHours <= task.estimatedHours ? "On track" : "Over budget"}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SharedLayout>
  )
} 