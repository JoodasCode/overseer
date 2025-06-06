"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Play,
  Save,
  Download,
  Upload,
  Settings,
  Plus,
  Trash2,
  Copy,
  Zap,
  Users,
  Clock,
  Mail,
  MessageSquare,
  Database,
  Globe,
  GitBranch,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import type { Agent } from "@/lib/types"

interface WorkflowNode {
  id: string
  type: "trigger" | "agent" | "action" | "condition" | "delay"
  position: { x: number; y: number }
  data: {
    title: string
    description?: string
    icon: React.ReactNode
    config?: Record<string, any>
    agentId?: string
  }
  connections: string[]
}

interface Workflow {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  status: "draft" | "active" | "paused"
  lastRun?: string
  runCount: number
  successRate: number
}

interface WorkflowBuilderProps {
  agents: Agent[]
}

const nodeTypes = {
  triggers: [
    {
      type: "trigger",
      title: "Email Received",
      description: "Triggers when a new email arrives",
      icon: <Mail className="w-4 h-4" />,
      category: "communication",
    },
    {
      type: "trigger",
      title: "Schedule",
      description: "Triggers at specific times or intervals",
      icon: <Clock className="w-4 h-4" />,
      category: "time",
    },
    {
      type: "trigger",
      title: "Webhook",
      description: "Triggers when webhook receives data",
      icon: <Globe className="w-4 h-4" />,
      category: "integration",
    },
    {
      type: "trigger",
      title: "Task Completed",
      description: "Triggers when an agent completes a task",
      icon: <CheckCircle className="w-4 h-4" />,
      category: "agent",
    },
  ],
  actions: [
    {
      type: "action",
      title: "Send Email",
      description: "Send an email via Gmail or Outlook",
      icon: <Mail className="w-4 h-4" />,
      category: "communication",
    },
    {
      type: "action",
      title: "Post to Slack",
      description: "Send a message to Slack channel",
      icon: <MessageSquare className="w-4 h-4" />,
      category: "communication",
    },
    {
      type: "action",
      title: "Update Database",
      description: "Add or update records in database",
      icon: <Database className="w-4 h-4" />,
      category: "data",
    },
    {
      type: "action",
      title: "Create Task",
      description: "Assign a new task to an agent",
      icon: <Plus className="w-4 h-4" />,
      category: "agent",
    },
  ],
  conditions: [
    {
      type: "condition",
      title: "If/Then",
      description: "Branch workflow based on conditions",
      icon: <GitBranch className="w-4 h-4" />,
      category: "logic",
    },
    {
      type: "condition",
      title: "Filter",
      description: "Filter data based on criteria",
      icon: <AlertCircle className="w-4 h-4" />,
      category: "logic",
    },
  ],
  utilities: [
    {
      type: "delay",
      title: "Delay",
      description: "Wait for a specified amount of time",
      icon: <Clock className="w-4 h-4" />,
      category: "utility",
    },
  ],
}

export function WorkflowBuilder({ agents }: WorkflowBuilderProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: "1",
      name: "New Customer Onboarding",
      description: "Automatically onboard new customers with welcome email and task assignment",
      nodes: [],
      status: "active",
      lastRun: "2 hours ago",
      runCount: 47,
      successRate: 94,
    },
    {
      id: "2",
      name: "Weekly Team Report",
      description: "Generate and send weekly performance reports every Friday",
      nodes: [],
      status: "active",
      lastRun: "1 day ago",
      runCount: 12,
      successRate: 100,
    },
    {
      id: "3",
      name: "PR Content Pipeline",
      description: "Draft, review, and publish PR content with approval workflow",
      nodes: [],
      status: "draft",
      runCount: 0,
      successRate: 0,
    },
  ])

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [canvasNodes, setCanvasNodes] = useState<WorkflowNode[]>([])
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [draggedNodeType, setDraggedNodeType] = useState<any>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (nodeType: any) => {
    setDraggedNodeType(nodeType)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!draggedNodeType || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const newNode: WorkflowNode = {
        id: `node-${Date.now()}`,
        type: draggedNodeType.type,
        position: { x, y },
        data: {
          title: draggedNodeType.title,
          description: draggedNodeType.description,
          icon: draggedNodeType.icon,
          config: {},
        },
        connections: [],
      }

      setCanvasNodes((prev) => [...prev, newNode])
      setDraggedNodeType(null)
    },
    [draggedNodeType],
  )

  const handleNodeClick = (node: WorkflowNode) => {
    if (isConnecting && connectionStart && connectionStart !== node.id) {
      // Create connection
      setCanvasNodes((prev) =>
        prev.map((n) => (n.id === connectionStart ? { ...n, connections: [...n.connections, node.id] } : n)),
      )
      setIsConnecting(false)
      setConnectionStart(null)
    } else {
      setSelectedNode(node)
    }
  }

  const handleStartConnection = (nodeId: string) => {
    setIsConnecting(true)
    setConnectionStart(nodeId)
  }

  const handleDeleteNode = (nodeId: string) => {
    setCanvasNodes((prev) => prev.filter((n) => n.id !== nodeId))
    // Remove connections to this node
    setCanvasNodes((prev) =>
      prev.map((n) => ({
        ...n,
        connections: n.connections.filter((id) => id !== nodeId),
      })),
    )
    setSelectedNode(null)
  }

  const handleSaveWorkflow = () => {
    if (!selectedWorkflow) return

    const updatedWorkflow = {
      ...selectedWorkflow,
      nodes: canvasNodes,
    }

    setWorkflows((prev) => prev.map((w) => (w.id === selectedWorkflow.id ? updatedWorkflow : w)))
    console.log("Workflow saved:", updatedWorkflow)
  }

  const handleRunWorkflow = () => {
    console.log("Running workflow with nodes:", canvasNodes)
    // Simulate workflow execution
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

  const renderConnections = () => {
    return canvasNodes.map((node) =>
      node.connections.map((targetId) => {
        const targetNode = canvasNodes.find((n) => n.id === targetId)
        if (!targetNode) return null

        const startX = node.position.x + 100 // Node width / 2
        const startY = node.position.y + 40 // Node height / 2
        const endX = targetNode.position.x + 100
        const endY = targetNode.position.y + 40

        return (
          <svg key={`${node.id}-${targetId}`} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
                className="fill-primary"
              >
                <polygon points="0 0, 10 3.5, 0 7" />
              </marker>
            </defs>
            <path
              d={`M ${startX} ${startY} Q ${(startX + endX) / 2} ${startY - 50} ${endX} ${endY}`}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
            />
          </svg>
        )
      }),
    )
  }

  if (selectedWorkflow) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-pixel">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => setSelectedWorkflow(null)} className="font-pixel text-xs">
              ← Back
            </Button>
            <div>
              <h2 className="font-pixel text-lg">{selectedWorkflow.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedWorkflow.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleSaveWorkflow} className="font-pixel text-xs">
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
            <Button onClick={handleRunWorkflow} className="font-pixel text-xs">
              <Play className="w-4 h-4 mr-1" />
              Test Run
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Node Library */}
          <div className="w-64 border-r border-pixel bg-muted/30">
            <div className="p-4">
              <h3 className="font-pixel text-sm mb-4">Node Library</h3>
              <Tabs defaultValue="triggers">
                <TabsList className="grid w-full grid-cols-2 font-pixel">
                  <TabsTrigger value="triggers" className="text-xs">
                    TRIGGERS
                  </TabsTrigger>
                  <TabsTrigger value="actions" className="text-xs">
                    ACTIONS
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="triggers" className="space-y-2 mt-4">
                  {nodeTypes.triggers.map((nodeType, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleDragStart(nodeType)}
                      className="p-2 border border-pixel rounded cursor-move hover:bg-background transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        {nodeType.icon}
                        <div className="min-w-0">
                          <div className="font-pixel text-xs">{nodeType.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{nodeType.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4">
                    <h4 className="font-pixel text-xs mb-2">AGENTS</h4>
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        draggable
                        onDragStart={() =>
                          handleDragStart({
                            type: "agent",
                            title: agent.name,
                            description: `Execute task with ${agent.name}`,
                            icon: <Users className="w-4 h-4" />,
                            agentId: agent.id,
                          })
                        }
                        className="p-2 border border-pixel rounded cursor-move hover:bg-background transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <span>{agent.avatar}</span>
                          <div className="min-w-0">
                            <div className="font-pixel text-xs">{agent.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{agent.role}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-2 mt-4">
                  {nodeTypes.actions.map((nodeType, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleDragStart(nodeType)}
                      className="p-2 border border-pixel rounded cursor-move hover:bg-background transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        {nodeType.icon}
                        <div className="min-w-0">
                          <div className="font-pixel text-xs">{nodeType.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{nodeType.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4">
                    <h4 className="font-pixel text-xs mb-2">CONDITIONS</h4>
                    {nodeTypes.conditions.map((nodeType, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleDragStart(nodeType)}
                        className="p-2 border border-pixel rounded cursor-move hover:bg-background transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {nodeType.icon}
                          <div className="min-w-0">
                            <div className="font-pixel text-xs">{nodeType.title}</div>
                            <div className="text-xs text-muted-foreground truncate">{nodeType.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <h4 className="font-pixel text-xs mb-2">UTILITIES</h4>
                    {nodeTypes.utilities.map((nodeType, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleDragStart(nodeType)}
                        className="p-2 border border-pixel rounded cursor-move hover:bg-background transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {nodeType.icon}
                          <div className="min-w-0">
                            <div className="font-pixel text-xs">{nodeType.title}</div>
                            <div className="text-xs text-muted-foreground truncate">{nodeType.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative">
            <div
              ref={canvasRef}
              className="w-full h-full bg-grid-pattern relative overflow-auto"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                backgroundImage: `radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            >
              {renderConnections()}

              {canvasNodes.map((node) => (
                <div
                  key={node.id}
                  className={`absolute w-48 bg-background border-2 rounded-lg p-3 cursor-pointer transition-all ${
                    selectedNode?.id === node.id ? "border-primary shadow-lg" : "border-pixel hover:border-primary/50"
                  }`}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                    zIndex: 2,
                  }}
                  onClick={() => handleNodeClick(node)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {node.data.icon}
                      <span className="font-pixel text-xs">{node.data.title}</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartConnection(node.id)
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Zap className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNode(node.id)
                        }}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {node.data.description && <p className="text-xs text-muted-foreground">{node.data.description}</p>}
                  {node.data.agentId && (
                    <div className="mt-2">
                      <Badge variant="outline" className="font-pixel text-xs">
                        {agents.find((a) => a.id === node.data.agentId)?.name}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}

              {canvasNodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-pixel text-sm mb-2">Start Building Your Workflow</h3>
                    <p className="text-xs">Drag nodes from the library to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Configuration Panel */}
          {selectedNode && (
            <div className="w-80 border-l border-pixel bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-pixel text-sm">Configure Node</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="font-pixel text-xs">Node Title</Label>
                  <Input
                    value={selectedNode.data.title}
                    onChange={(e) =>
                      setSelectedNode({
                        ...selectedNode,
                        data: { ...selectedNode.data, title: e.target.value },
                      })
                    }
                    className="mt-1 font-clean border-pixel"
                  />
                </div>

                <div>
                  <Label className="font-pixel text-xs">Description</Label>
                  <Input
                    value={selectedNode.data.description || ""}
                    onChange={(e) =>
                      setSelectedNode({
                        ...selectedNode,
                        data: { ...selectedNode.data, description: e.target.value },
                      })
                    }
                    className="mt-1 font-clean border-pixel"
                  />
                </div>

                {selectedNode.type === "agent" && (
                  <div>
                    <Label className="font-pixel text-xs">Agent</Label>
                    <select
                      value={selectedNode.data.agentId || ""}
                      onChange={(e) =>
                        setSelectedNode({
                          ...selectedNode,
                          data: { ...selectedNode.data, agentId: e.target.value },
                        })
                      }
                      className="w-full mt-1 p-2 border border-pixel rounded font-clean text-sm bg-background"
                    >
                      <option value="">Select an agent...</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.avatar} {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedNode.type === "trigger" && selectedNode.data.title === "Schedule" && (
                  <div>
                    <Label className="font-pixel text-xs">Schedule</Label>
                    <select className="w-full mt-1 p-2 border border-pixel rounded font-clean text-sm bg-background">
                      <option>Every hour</option>
                      <option>Daily at 9 AM</option>
                      <option>Weekly on Monday</option>
                      <option>Monthly on 1st</option>
                    </select>
                  </div>
                )}

                {selectedNode.type === "action" && selectedNode.data.title === "Send Email" && (
                  <div className="space-y-3">
                    <div>
                      <Label className="font-pixel text-xs">To</Label>
                      <Input placeholder="recipient@example.com" className="mt-1 font-clean border-pixel" />
                    </div>
                    <div>
                      <Label className="font-pixel text-xs">Subject</Label>
                      <Input placeholder="Email subject" className="mt-1 font-clean border-pixel" />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-pixel">
                  <h4 className="font-pixel text-xs mb-2">Connections</h4>
                  <p className="text-xs text-muted-foreground">
                    Connected to {selectedNode.connections.length} node(s)
                  </p>
                  {selectedNode.connections.map((connId) => {
                    const connectedNode = canvasNodes.find((n) => n.id === connId)
                    return (
                      <div key={connId} className="flex items-center space-x-2 mt-1">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-xs">{connectedNode?.data.title}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-2xl text-primary">Workflow Builder</h1>
          <p className="text-muted-foreground">Create and manage automated workflows</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="font-pixel text-xs">
            <Upload className="w-4 h-4 mr-1" />
            Import
          </Button>
          <Button
            className="font-pixel text-xs"
            onClick={() =>
              setSelectedWorkflow({
                id: "new",
                name: "New Workflow",
                description: "",
                nodes: [],
                status: "draft",
                runCount: 0,
                successRate: 0,
              })
            }
          >
            <Plus className="w-4 h-4 mr-1" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Workflow List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="border-pixel cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="font-pixel text-sm flex items-center justify-between">
                <span>{workflow.name}</span>
                <Badge variant={getStatusColor(workflow.status)} className="font-pixel text-xs">
                  {workflow.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{workflow.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-pixel text-xs text-muted-foreground">Runs</div>
                  <div className="font-pixel">{workflow.runCount}</div>
                </div>
                <div>
                  <div className="font-pixel text-xs text-muted-foreground">Success Rate</div>
                  <div className="font-pixel">{workflow.successRate}%</div>
                </div>
              </div>

              {workflow.lastRun && <div className="text-xs text-muted-foreground">Last run: {workflow.lastRun}</div>}

              <div className="flex space-x-2">
                <Button
                  onClick={() => setSelectedWorkflow(workflow)}
                  className="flex-1 font-pixel text-xs"
                  variant="outline"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="font-pixel text-xs">
                  <Copy className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="sm" className="font-pixel text-xs">
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
