"use client"

import { SharedLayout } from '@/components/shared/SharedLayout'
import { Users, Activity, TrendingUp, AlertTriangle, Plus, Filter, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const agents = [
  {
    id: 1,
    name: "Alex",
    role: "Strategic Coordinator",
    department: "Analytics",
    status: "Active",
    performance: 94,
    tasks: 12,
    lastActivity: "2 minutes ago",
    avatar: "🧑‍💼",
    avatarUrl: "/avatars/alex.jpg"
  },
  {
    id: 2,
    name: "Toby",
    role: "Customer Success Agent",
    department: "Support",
    status: "Active",
    performance: 89,
    tasks: 8,
    lastActivity: "5 minutes ago",
    avatar: "👨‍💻",
    avatarUrl: "/avatars/toby.jpg"
  },
  {
    id: 3,
    name: "Riley",
    role: "Content Creator",
    department: "Marketing",
    status: "Idle",
    performance: 76,
    tasks: 3,
    lastActivity: "1 hour ago",
    avatar: "✍️",
    avatarUrl: "/avatars/riley.jpg"
  },
  {
    id: 4,
    name: "Jamie",
    role: "Security Specialist",
    department: "Security",
    status: "Active",
    performance: 98,
    tasks: 15,
    lastActivity: "30 seconds ago",
    avatar: "🛡️",
    avatarUrl: "/avatars/jamie.jpg"
  },
  {
    id: 5,
    name: "Dana",
    role: "Integration Manager",
    department: "Operations",
    status: "Error",
    performance: 45,
    tasks: 0,
    lastActivity: "15 minutes ago",
    avatar: "⚙️",
    avatarUrl: "/avatars/dana.jpg"
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "bg-green-500/10 text-green-600 border-green-500/20"
    case "Idle": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
    case "Error": return "bg-red-500/10 text-red-600 border-red-500/20"
    default: return "bg-gray-500/10 text-gray-600 border-gray-500/20"
  }
}

export default function DashboardPage() {
  const activeAgents = agents.filter(agent => agent.status === "Active").length
  const totalTasks = agents.reduce((sum, agent) => sum + agent.tasks, 0)
  const avgPerformance = Math.round(agents.reduce((sum, agent) => sum + agent.performance, 0) / agents.length)
  const errorRate = Math.round((agents.filter(agent => agent.status === "Error").length / agents.length) * 100)

  return (
    <SharedLayout title="Overseer Dashboard" description="Here's a snapshot of your AI operations today.">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, John</h2>
          <p className="text-muted-foreground">
            Here's a snapshot of your AI operations today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAgents}</div>
              <p className="text-xs text-muted-foreground">+2 from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgPerformance}%</div>
              <p className="text-xs text-muted-foreground">+5% from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{errorRate}%</div>
              <p className="text-xs text-muted-foreground">-2% from yesterday</p>
            </CardContent>
          </Card>
        </div>

        {/* Agent Status Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Agent Status</CardTitle>
                <CardDescription>
                  Overview of all AI agents and their current status
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Agent
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={agent.avatarUrl} alt={agent.name} />
                          <AvatarFallback>
                            {agent.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-sm text-muted-foreground">{agent.role}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{agent.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${agent.performance}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{agent.performance}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{agent.tasks}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{agent.lastActivity}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Start Chat</DropdownMenuItem>
                          <DropdownMenuItem>Configure</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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