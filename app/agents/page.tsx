"use client"

import { SharedLayout } from '@/components/shared/SharedLayout'
import { Plus, Search, Filter, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const agents = [
  {
    id: 1,
    name: "Alex",
    role: "Strategic Coordinator",
    department: "Analytics",
    status: "Active",
    performance: 94,
    tasks: 12,
    description: "Specializes in data analysis and strategic planning. Helps with complex decision-making and trend analysis.",
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
    description: "Expert in customer support and relationship management. Handles inquiries with empathy and efficiency.",
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
    description: "Creative content generator specializing in marketing copy, blogs, and social media content.",
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
    description: "Cybersecurity expert focused on threat detection, vulnerability assessment, and security protocols.",
    lastActivity: "30 seconds ago",
    avatar: "🛡️",
    avatarUrl: "/avatars/jamie.jpg"
  },
  {
    id: 5,
    name: "Dana",
    role: "Integration Manager",
    department: "Operations",
    status: "Offline",
    performance: 67,
    tasks: 2,
    description: "Manages API integrations and system connections. Ensures smooth data flow between platforms.",
    lastActivity: "2 hours ago",
    avatar: "⚙️",
    avatarUrl: "/avatars/dana.jpg"
  },
  {
    id: 6,
    name: "Sam",
    role: "Research Assistant",
    department: "Analytics",
    status: "Active",
    performance: 82,
    tasks: 6,
    description: "AI-powered research specialist who gathers, analyzes, and synthesizes information from multiple sources.",
    lastActivity: "15 minutes ago",
    avatar: "🔍",
    avatarUrl: null
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

export default function AgentsPage() {
  const totalAgents = agents.length
  const activeAgents = agents.filter(agent => agent.status === "Active").length
  const avgPerformance = Math.round(agents.reduce((sum, agent) => sum + agent.performance, 0) / agents.length)

  return (
    <SharedLayout title="Agents" description="Manage and monitor your AI agent team">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAgents}</div>
              <p className="text-xs text-muted-foreground">Active team members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAgents}</div>
              <p className="text-xs text-muted-foreground">Currently online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgPerformance}%</div>
              <p className="text-xs text-muted-foreground">Team efficiency</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search agents by name, role, or department..."
                className="pl-10"
              />
            </div>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>

        {/* Agents Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} alt={agent.name} />}
                      <AvatarFallback>
                        {agent.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription>{agent.role}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Start Chat</DropdownMenuItem>
                      <DropdownMenuItem>Edit Agent</DropdownMenuItem>
                      <DropdownMenuItem>Delete Agent</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusColor(agent.status)}>
                    {agent.status}
                  </Badge>
                  <Badge variant="outline">{agent.department}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {agent.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Performance</span>
                      <span className="font-medium">{agent.performance}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${agent.performance}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active tasks</span>
                    <span className="font-medium">{agent.tasks}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last activity</span>
                    <span className="font-medium">{agent.lastActivity}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SharedLayout>
  )
} 