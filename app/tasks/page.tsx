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
import { getAgentAvatarUrl } from '@/lib/dicebear-avatar'

const tasks = [
  {
    id: 1,
    title: "Strategic Planning Session",
    description: "Quarterly planning and goal setting",
    status: "in-progress",
    priority: "high",
    dueDate: "2024-01-20",
    assignedAgent: "Alex",
    avatarUrl: "https://api.dicebear.com/9.x/croodles/svg?seed=alex&backgroundColor=8b5cf6",
    completedSubtasks: 3,
    totalSubtasks: 5
  },
  {
    id: 2, 
    title: "Brand Identity Refresh",
    description: "Update visual branding guidelines",
    status: "pending",
    priority: "medium",
    dueDate: "2024-01-25",
    assignedAgent: "Dana",
    avatarUrl: "https://api.dicebear.com/9.x/croodles/svg?seed=dana&backgroundColor=ec4899",
    completedSubtasks: 0,
    totalSubtasks: 8
  },
  {
    id: 3,
    title: "Team Sync Meeting",
    description: "Weekly coordination and updates", 
    status: "completed",
    priority: "medium",
    dueDate: "2024-01-18",
    assignedAgent: "Jamie",
    avatarUrl: "https://api.dicebear.com/9.x/croodles/svg?seed=jamie&backgroundColor=3b82f6",
    completedSubtasks: 4,
    totalSubtasks: 4
  },
  {
    id: 4,
    title: "Performance Analytics",
    description: "Monthly metrics analysis and reporting",
    status: "in-progress", 
    priority: "high",
    dueDate: "2024-01-22",
    assignedAgent: "Riley",
    avatarUrl: "https://api.dicebear.com/9.x/croodles/svg?seed=riley&backgroundColor=10b981",
    completedSubtasks: 2,
    totalSubtasks: 6
  },
  {
    id: 5,
    title: "Documentation Update", 
    description: "Update support documentation",
    status: "pending",
    priority: "low",
    dueDate: "2024-01-30",
    assignedAgent: "Toby",
    avatarUrl: "https://api.dicebear.com/9.x/croodles/svg?seed=toby&backgroundColor=f59e0b",
    completedSubtasks: 0, 
    totalSubtasks: 3
  },
  {
    id: 6,
    title: "Process Optimization",
    description: "Streamline internal workflows",
    status: "completed",
    priority: "medium", 
    dueDate: "2024-01-16",
    assignedAgent: "Jamie",
    avatarUrl: "https://api.dicebear.com/9.x/croodles/svg?seed=jamie&backgroundColor=3b82f6",
    completedSubtasks: 7,
    totalSubtasks: 7
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
                          <AvatarImage 
                            src={task.avatarUrl}
                            alt={task.assignedAgent} 
                          />
                          <AvatarFallback>{task.assignedAgent}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{task.assignedAgent}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={task.completedSubtasks / task.totalSubtasks * 100} className="w-16" />
                        <div className="text-xs text-muted-foreground">
                          {task.completedSubtasks} / {task.totalSubtasks}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{task.dueDate}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{task.completedSubtasks}h / {task.totalSubtasks}h</div>
                        <div className="text-xs text-muted-foreground">
                          {task.completedSubtasks <= task.totalSubtasks ? "On track" : "Over budget"}
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