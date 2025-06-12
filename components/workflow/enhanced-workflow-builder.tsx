"use client"

import React, { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MessageSquare,
  Eye,
  Plus,
  Save,
  Play,
  ArrowLeft,
  Zap,
  Settings,
  MoreHorizontal,
  Pause,
  Trash2,
  Copy,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  SortAsc
} from "lucide-react"
import type { Agent } from "@/lib/types"
import { ConversationalWorkflowBuilder } from "./conversational-workflow-builder"
import { WorkflowBuilder } from "../workflow-builder"

interface Workflow {
  id: string
  name: string
  description: string
  nodes: any[]
  status: "draft" | "active" | "paused"
  lastRun?: string
  runCount: number
  successRate: number
  trigger?: any
  agent?: any
  steps?: any[]
  created_at?: string
  updated_at?: string
}

interface EnhancedWorkflowBuilderProps {
  agents: Agent[]
  workflows?: Workflow[]
  onWorkflowSaved?: (workflow: Workflow) => void
  onBack?: () => void
}

export function EnhancedWorkflowBuilder({ 
  agents, 
  workflows = [],
  onWorkflowSaved,
  onBack 
}: EnhancedWorkflowBuilderProps) {
  const [mode, setMode] = useState<'list' | 'conversational' | 'visual'>('list')
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [userWorkflows, setUserWorkflows] = useState<Workflow[]>([
    {
      id: "1",
      name: "Email to Slack Summary",
      description: "Automatically summarize incoming emails and post to Slack when high priority emails arrive",
      nodes: [],
      status: "active",
      lastRun: "2 hours ago",
      runCount: 47,
      successRate: 94,
      created_at: "2024-12-01T10:00:00Z"
    },
    {
      id: "2", 
      name: "Weekly Team Report",
      description: "Generate and send weekly performance reports every Friday at 5 PM",
      nodes: [],
      status: "active",
      lastRun: "1 day ago",
      runCount: 12,
      successRate: 100,
      created_at: "2024-11-28T15:30:00Z"
    },
    {
      id: "3",
      name: "PR Content Pipeline",
      description: "Draft, review, and publish PR content with approval workflow",
      nodes: [],
      status: "draft",
      runCount: 0,
      successRate: 0,
      created_at: "2024-12-01T09:15:00Z"
    },
    ...workflows
  ])

  const handleCreateConversational = () => {
    setMode('conversational')
    setCurrentWorkflow(null)
  }

  const handleWorkflowCreated = (workflow: Workflow) => {
    const newWorkflow = {
      ...workflow,
      id: Date.now().toString(),
      status: 'draft' as const
    }
    setUserWorkflows(prev => [...prev, newWorkflow])
    setCurrentWorkflow(newWorkflow)
    onWorkflowSaved?.(newWorkflow)
    
    // Switch to visual mode for further editing
    setMode('visual')
  }

  const handleSwitchToVisual = (workflow: Workflow) => {
    setCurrentWorkflow(workflow)
    setMode('visual')
  }

  const handleEditWorkflow = (workflow: Workflow) => {
    setCurrentWorkflow(workflow)
    setMode('visual')
  }

  const handleBackToList = () => {
    setMode('list')
    setCurrentWorkflow(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "paused":
        return "secondary"
      case "draft":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "paused":
        return <Pause className="w-4 h-4 text-yellow-500" />
      case "draft":
        return <Clock className="w-4 h-4 text-gray-500" />
      default:
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const filteredWorkflows = userWorkflows.filter((workflow) => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || workflow.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const activeWorkflows = userWorkflows.filter(w => w.status === 'active').length
  const totalRuns = userWorkflows.reduce((sum, w) => sum + w.runCount, 0)
  const avgSuccessRate = userWorkflows.length > 0 
    ? Math.round(userWorkflows.reduce((sum, w) => sum + w.successRate, 0) / userWorkflows.length)
    : 0

  if (mode === 'conversational') {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={handleBackToList} className="h-8 px-2">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Workflows
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <h2 className="text-lg font-semibold">Conversational Workflow Builder</h2>
                  <p className="text-sm text-muted-foreground">Create workflows through guided conversation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <ConversationalWorkflowBuilder
            agents={agents}
            onWorkflowCreated={handleWorkflowCreated}
            onSwitchToVisual={handleSwitchToVisual}
          />
        </div>
      </div>
    )
  }

  if (mode === 'visual') {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={handleBackToList} className="h-8 px-2">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Workflows
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <h2 className="text-lg font-semibold">Visual Workflow Editor</h2>
                  <p className="text-sm text-muted-foreground">
                    {currentWorkflow ? `Editing: ${currentWorkflow.name}` : 'Create and edit workflow visually'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <WorkflowBuilder agents={agents} />
        </div>
      </div>
    )
  }

  // Main Workflow Dashboard
  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <Button variant="outline" onClick={onBack} className="h-9">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button variant="outline" onClick={() => setMode('visual')} className="h-9">
            <Eye className="w-4 h-4 mr-2" />
            Visual Editor
          </Button>
        </div>
        <Button onClick={handleCreateConversational} className="h-9">
          <MessageSquare className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userWorkflows.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((activeWorkflows / userWorkflows.length) * 100)}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRuns}</div>
            <p className="text-xs text-muted-foreground">
              Across all workflows
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSuccessRate}%</div>
            <p className="text-xs text-muted-foreground">
              Average across workflows
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9">
                <Filter className="w-4 h-4 mr-2" />
                Status: {statusFilter === "all" ? "All" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                All Workflows
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("paused")}>
                Paused
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
                Draft
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredWorkflows.length} of {userWorkflows.length} workflows
        </div>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow.id} className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(workflow.status)}
                  <Badge variant={getStatusColor(workflow.status)} className="text-xs">
                    {workflow.status.toUpperCase()}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditWorkflow(workflow)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardTitle className="text-lg leading-6">{workflow.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {workflow.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Executions</p>
                  <p className="font-medium">{workflow.runCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Success Rate</p>
                  <p className="font-medium">{workflow.successRate}%</p>
                </div>
              </div>

              {workflow.lastRun && (
                <div className="text-xs text-muted-foreground">
                  Last run: {workflow.lastRun}
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <Button
                  onClick={() => handleEditWorkflow(workflow)}
                  className="flex-1 h-8"
                  variant="outline"
                >
                  <Settings className="w-3 h-3 mr-2" />
                  Edit
                </Button>
                <Button
                  variant={workflow.status === 'active' ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-3"
                  disabled={workflow.status === 'draft'}
                >
                  <Play className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Create New Workflow Card */}
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer group" 
              onClick={handleCreateConversational}>
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[280px]">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Create New Workflow</h3>
              <p className="text-sm text-muted-foreground max-w-[200px]">
                Use our AI assistant to build workflows through conversation
              </p>
            </div>
            <Button size="sm" className="mt-4">
              <MessageSquare className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {filteredWorkflows.length === 0 && userWorkflows.length > 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Search className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("")
              setStatusFilter("all")
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 