"use client"

import { SharedLayout } from '@/components/shared/SharedLayout'
import { Plus, Search, Play, Pause, Settings, Copy, Eye, Edit, Trash2, GitMerge } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const workflows = [
  {
    id: 1,
    name: "Daily Standup Automation",
    description: "Automatically collect team updates and generate daily reports",
    status: "Active",
    lastRun: "2 hours ago",
    nextRun: "Tomorrow 9:00 AM",
    successRate: 98,
    totalRuns: 145,
    creator: "Alex",
    creatorAvatar: "🧑‍💼",
    creatorAvatarUrl: "/avatars/alex.jpg",
    agents: ["Alex", "Riley", "Toby"],
    category: "Automation"
  },
  {
    id: 2,
    name: "Customer Support Escalation",
    description: "Route high-priority tickets to appropriate agents",
    status: "Active",
    lastRun: "30 minutes ago",
    nextRun: "On demand",
    successRate: 94,
    totalRuns: 89,
    creator: "Toby",
    creatorAvatar: "👨‍💻",
    creatorAvatarUrl: "/avatars/toby.jpg",
    agents: ["Toby", "Jamie"],
    category: "Support"
  },
  {
    id: 3,
    name: "Content Generation Pipeline",
    description: "Generate, review, and publish marketing content",
    status: "Draft",
    lastRun: "Never",
    nextRun: "Not scheduled",
    successRate: 0,
    totalRuns: 0,
    creator: "Riley",
    creatorAvatar: "✍️",
    creatorAvatarUrl: "/avatars/riley.jpg",
    agents: ["Riley", "Alex"],
    category: "Marketing"
  },
  {
    id: 4,
    name: "Security Monitoring",
    description: "Monitor system security and generate alerts",
    status: "Paused",
    lastRun: "1 day ago",
    nextRun: "Paused",
    successRate: 100,
    totalRuns: 24,
    creator: "Jamie",
    creatorAvatar: "🛡️",
    creatorAvatarUrl: "/avatars/jamie.jpg",
    agents: ["Jamie", "Dana"],
    category: "Security"
  },
  {
    id: 5,
    name: "Data Analysis Workflow",
    description: "Process and analyze business metrics automatically",
    status: "Active",
    lastRun: "1 hour ago",
    nextRun: "Every 4 hours",
    successRate: 87,
    totalRuns: 234,
    creator: "Dana",
    creatorAvatar: "⚙️",
    creatorAvatarUrl: "/avatars/dana.jpg",
    agents: ["Dana", "Riley"],
    category: "Analytics"
  }
]

const templates = [
  {
    id: 1,
    name: "Agent Collaboration",
    description: "Template for multi-agent collaboration workflows",
    category: "Collaboration",
    usageCount: 23
  },
  {
    id: 2,
    name: "Data Processing",
    description: "Template for automated data processing and analysis",
    category: "Analytics",
    usageCount: 18
  },
  {
    id: 3,
    name: "Customer Service",
    description: "Template for customer support automation",
    category: "Support",
    usageCount: 31
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "bg-green-500/10 text-green-600 border-green-500/20"
    case "Paused": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
    case "Draft": return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    case "Error": return "bg-red-500/10 text-red-600 border-red-500/20"
    default: return "bg-gray-500/10 text-gray-600 border-gray-500/20"
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Automation": return "bg-blue-500/10 text-blue-600 border-blue-500/20"
    case "Support": return "bg-green-500/10 text-green-600 border-green-500/20"
    case "Marketing": return "bg-purple-500/10 text-purple-600 border-purple-500/20"
    case "Security": return "bg-red-500/10 text-red-600 border-red-500/20"
    case "Analytics": return "bg-orange-500/10 text-orange-600 border-orange-500/20"
    case "Collaboration": return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
    default: return "bg-gray-500/10 text-gray-600 border-gray-500/20"
  }
}

export default function WorkflowBuilderPage() {
  const totalWorkflows = workflows.length
  const activeWorkflows = workflows.filter(w => w.status === "Active").length
  const draftWorkflows = workflows.filter(w => w.status === "Draft").length
  const avgSuccessRate = Math.round(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length)

  return (
    <SharedLayout title="Workflow Builder" description="Create and manage automated agent workflows">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
              <GitMerge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWorkflows}</div>
              <p className="text-xs text-muted-foreground">All workflows</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Play className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeWorkflows}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <Edit className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{draftWorkflows}</div>
              <p className="text-xs text-muted-foreground">In development</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Badge variant="secondary">{avgSuccessRate}%</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgSuccessRate}%</div>
              <p className="text-xs text-muted-foreground">Average performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search workflows..."
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
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="automation">Automation</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Workflows List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Workflows</CardTitle>
                <CardDescription>
                  Manage and monitor your automated agent workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <div key={workflow.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{workflow.name}</h3>
                            <Badge className={getStatusColor(workflow.status)}>
                              {workflow.status}
                            </Badge>
                            <Badge variant="outline" className={getCategoryColor(workflow.category)}>
                              {workflow.category}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {workflow.description}
                          </p>

                          <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Last run:</span>
                              <div className="font-medium">{workflow.lastRun}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Next run:</span>
                              <div className="font-medium">{workflow.nextRun}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Success rate:</span>
                              <div className="font-medium">{workflow.successRate}%</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total runs:</span>
                              <div className="font-medium">{workflow.totalRuns}</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Created by:</span>
                              <div className="flex items-center gap-1">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={workflow.creatorAvatarUrl} alt={workflow.creator} />
                                  <AvatarFallback>{workflow.creatorAvatar}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{workflow.creator}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-muted-foreground">Agents:</span>
                              <div className="flex -space-x-1">
                                {workflow.agents.slice(0, 3).map((agent, index) => {
                                  // Map agent names to emojis and avatar URLs
                                  const agentAvatars: Record<string, string> = {
                                    "Alex": "🧑‍💼",
                                    "Toby": "👨‍💻", 
                                    "Riley": "✍️",
                                    "Jamie": "🛡️",
                                    "Dana": "⚙️"
                                  };
                                  const agentAvatarUrls: Record<string, string> = {
                                    "Alex": "/avatars/alex.jpg",
                                    "Toby": "/avatars/toby.jpg", 
                                    "Riley": "/avatars/riley.jpg",
                                    "Jamie": "/avatars/jamie.jpg",
                                    "Dana": "/avatars/dana.jpg"
                                  };
                                  return (
                                    <Avatar key={index} className="h-6 w-6 border-2 border-background">
                                      <AvatarImage src={agentAvatarUrls[agent]} alt={agent} />
                                      <AvatarFallback className="text-xs">{agentAvatars[agent] || agent[0]}</AvatarFallback>
                                    </Avatar>
                                  );
                                })}
                                {workflow.agents.length > 3 && (
                                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                    <span className="text-xs">+{workflow.agents.length - 3}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1 ml-4">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            {workflow.status === "Active" ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Templates Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Templates</CardTitle>
                <CardDescription>
                  Start with pre-built workflow templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {template.usageCount} uses
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      <Badge variant="outline" className={getCategoryColor(template.category)}>
                        {template.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Create from Template
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <GitMerge className="h-4 w-4 mr-2" />
                    Import Workflow
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Workflow Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SharedLayout>
  )
} 