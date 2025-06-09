"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NewTaskModal } from "./new-task-modal"
import { HireAgentModal } from "./hire-agent-modal"
import { ConfirmDeleteModal } from "./confirm-delete-modal"
import { LevelUpModal } from "./level-up-modal"
import { AgentChatInterface } from "./agent-chat-interface"
import { KnowledgeUpload } from "./knowledge-upload"
import { useToast } from "@/lib/hooks/use-toast"
import { useAgents } from "@/lib/hooks/use-api"
import { supabase } from "@/lib/supabase-client"
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Star,
  ChevronRight,
  ChevronLeft,
  Users,
  Zap,
  Brain,
  Settings,
  MessageSquare,
  Trash2,
} from "lucide-react"
import type { Agent } from "@/lib/types"

interface AgentPageProps {
  agents: Agent[]
  selectedAgent: Agent
  onSelectAgent: (agent: Agent) => void
  onAgentHired?: () => void
}

// Helper function to safely convert tools to array format
const getToolsArray = (tools: any): string[] => {
  if (Array.isArray(tools)) {
    return tools
  }
  if (tools && typeof tools === 'object') {
    // If tools is an object, extract the keys or values
    return Object.keys(tools).length > 0 ? Object.keys(tools) : []
  }
  return []
}

// Helper function to safely get tasks array
const getTasksArray = (tasks: any): any[] => {
  if (Array.isArray(tasks)) {
    return tasks
  }
  return []
}

// Helper function to safely get memory learnings array
const getMemoryLearningsArray = (memory: any): string[] => {
  if (memory && Array.isArray(memory.recentLearnings)) {
    return memory.recentLearnings
  }
  return []
}

export function AgentPage({ agents, selectedAgent, onSelectAgent, onAgentHired }: AgentPageProps) {
  const [activeTab, setActiveTab] = useState("tasks")
  const [showNewTask, setShowNewTask] = useState(false)
  const [showHireAgent, setShowHireAgent] = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [agentTasks, setAgentTasks] = useState<any[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const { deleteAgent } = useAgents()
  const { toast } = useToast()

  // Safely get arrays from selectedAgent
  const agentTools = getToolsArray(selectedAgent.tools)
  const agentLearnings = getMemoryLearningsArray(selectedAgent.memory)

  // Function to fetch tasks for the selected agent
  const fetchTasks = async () => {
    if (!selectedAgent?.id) return
    
    setLoadingTasks(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const { tasks } = await response.json()
        // Filter tasks for the selected agent
        const agentSpecificTasks = tasks.filter((task: any) => task.agent_id === selectedAgent.id)
        setAgentTasks(agentSpecificTasks)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoadingTasks(false)
    }
  }

  // Fetch tasks when the selected agent changes
  useEffect(() => {
    fetchTasks()
  }, [selectedAgent.id])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-500" />
      case "waiting":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const handleCreateTask = async (taskData: {
    title: string
    details: string
    priority: "low" | "medium" | "high"
    agentId: string
    xpReward: number
    category: string
  }) => {
    try {
      console.log("Creating task:", taskData)

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create tasks",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }

      const { task } = await response.json()
      
      toast({
        title: "Task Created",
        description: `Successfully created task: ${task.title}`,
      })

      setShowNewTask(false)
      
      // Refresh the task list to show the new task
      fetchTasks()
      
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAgent = (agent: Agent) => {
    setAgentToDelete(agent)
    setShowDeleteModal(true)
  }

  const confirmDeleteAgent = async () => {
    if (!agentToDelete) return

    setIsDeleting(true)
    try {
      await deleteAgent(agentToDelete.id)
      toast({
        variant: "success",
        title: "🗑️ Agent Removed",
        description: `${agentToDelete.name} has been successfully removed from your team.`,
      })

      // If we deleted the selected agent, select another one
      if (agentToDelete.id === selectedAgent.id && agents.length > 1) {
        const remainingAgents = agents.filter(a => a.id !== agentToDelete.id)
        if (remainingAgents.length > 0) {
          onSelectAgent(remainingAgents[0])
        }
      }
      
      // Trigger refresh if callback provided
      if (onAgentHired) {
        onAgentHired()
      }
    } catch (error) {
      console.error('❌ Failed to delete agent:', error)
      toast({
        variant: "destructive",
        title: "❌ Failed to Remove Agent",
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setAgentToDelete(null)
    }
  }

  // Calculate XP progress
  const currentXP = selectedAgent.level * 250
  const maxXP = 1000
  const xpProgress = (currentXP / maxXP) * 100
  const isNearLevelUp = currentXP >= 900

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-2xl text-primary">Agent Command</h1>
          <p className="text-muted-foreground">Manage your AI team members</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="font-pixel text-xs" onClick={() => setShowChat(true)}>
            <MessageSquare className="w-4 h-4 mr-1" />
            Chat with {selectedAgent.name}
          </Button>
          <Button className="font-pixel text-xs" onClick={() => setShowHireAgent(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Hire Agent
          </Button>
        </div>
      </div>

      {/* Agent Selection */}
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const currentIndex = agents.findIndex((a) => a.id === selectedAgent.id)
              const prevIndex = (currentIndex - 1 + agents.length) % agents.length
              onSelectAgent(agents[prevIndex])
            }}
            className="h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const currentIndex = agents.findIndex((a) => a.id === selectedAgent.id)
              const nextIndex = (currentIndex + 1) % agents.length
              onSelectAgent(agents[nextIndex])
            }}
            className="h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Card className="border-pixel">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="text-5xl">{selectedAgent.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-pixel text-xl">{selectedAgent.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedAgent.role}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={selectedAgent.status === "active" ? "default" : "secondary"}
                      className="font-pixel text-xs"
                    >
                      {selectedAgent.status}
                    </Badge>
                    <Badge variant="outline" className="font-pixel text-xs">
                      Lv.{selectedAgent.level}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAgent(selectedAgent)}
                      className="font-pixel text-xs px-2 h-6 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>XP Progress</span>
                    <span>
                      {currentXP}/{maxXP}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isNearLevelUp ? "bg-gradient-to-r from-primary to-yellow-500 animate-pulse" : "bg-primary"
                      }`}
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(selectedAgent.memory?.skillsUnlocked || []).slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="outline" className="font-pixel text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {(selectedAgent.memory?.skillsUnlocked || []).length > 3 && (
                    <Badge variant="outline" className="font-pixel text-xs">
                      +{(selectedAgent.memory?.skillsUnlocked || []).length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Selector Pills */}
      <div className="flex overflow-x-auto pb-2 scrollbar-hide">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onSelectAgent(agent)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-full mr-2 transition-colors flex-shrink-0 ${
              selectedAgent.id === agent.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            }`}
          >
            <span>{agent.avatar}</span>
            <span className="font-pixel text-xs">{agent.name}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 font-pixel">
          <TabsTrigger value="tasks" className="text-xs">
            TASKS
          </TabsTrigger>
          <TabsTrigger value="memory" className="text-xs">
            MEMORY
          </TabsTrigger>
          <TabsTrigger value="tools" className="text-xs">
            TOOLS
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="text-xs">
            KNOWLEDGE
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-pixel text-sm">Active Tasks</h3>
            <Button size="sm" className="font-pixel text-xs" onClick={() => setShowNewTask(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New Task
            </Button>
          </div>

          {agentTasks.length === 0 ? (
            <Card className="border-pixel">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No active tasks for {selectedAgent.name}</p>
                <Button className="mt-4 font-pixel text-xs" onClick={() => setShowNewTask(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Create First Task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {agentTasks.map((task) => (
                <Card key={task.id} className="border-pixel">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-3 min-w-0 flex-1">
                        {getStatusIcon(task.status)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-pixel text-sm font-medium truncate">{task.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.details}</p>
                          {task.xpReward && (
                            <div className="flex items-center mt-2 text-xs text-primary">
                              <Star className="w-3 h-3 mr-1" />+{task.xpReward} XP
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant={getPriorityColor(task.priority)} className="font-pixel text-xs flex-shrink-0">
                        {task.priority}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <Card className="border-pixel">
            <CardHeader>
              <CardTitle className="font-pixel text-sm flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                Memory & Learning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-pixel text-xs mb-2">WEEKLY GOALS</h4>
                <p className="text-sm">{selectedAgent.memory?.weeklyGoals || 'No weekly goals set'}</p>
              </div>
              <div>
                <h4 className="font-pixel text-xs mb-2">RECENT LEARNINGS</h4>
                <div className="space-y-2">
                  {agentLearnings.map((learning, index) => (
                    <div key={index} className="flex items-start text-sm">
                      <span className="text-primary mr-2">•</span>
                      <span>{learning}</span>
                    </div>
                  ))}
                  {agentLearnings.length === 0 && (
                    <p className="text-sm text-muted-foreground">No recent learnings</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-pixel text-xs mb-2">PERSONA</h4>
                <p className="text-sm">{selectedAgent.persona || 'No persona defined'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {agentTools.map((tool, index) => (
              <Card key={index} className="border-pixel">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 bg-primary/10 rounded-sm flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-pixel text-sm truncate">{tool}</h4>
                        <p className="text-xs text-muted-foreground">Connected</p>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card className="border-pixel border-dashed">
              <CardContent className="p-4 flex items-center justify-center">
                <Button variant="ghost" className="font-pixel text-xs">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Tool
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <KnowledgeUpload agent={selectedAgent} />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-pixel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="font-pixel text-xs">Team Actions</h3>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="w-3 h-3" />
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full font-pixel text-xs"
                onClick={() => setShowNewTask(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Assign Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full font-pixel text-xs"
                onClick={() => setShowChat(true)}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Start Chat
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-pixel">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="font-pixel text-xs">Recent Activity</h3>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="flex-1 truncate">Completed newsletter draft</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 text-blue-500" />
                <span className="flex-1 truncate">Scheduled social posts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-pixel">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              <h3 className="font-pixel text-xs">Needs Attention</h3>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-3 h-3 text-yellow-500" />
                <span className="flex-1 truncate">Waiting on event materials</span>
              </div>
              {agentTasks.filter((t) => t.status === "pending").length > 0 && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span className="flex-1 truncate">
                    {agentTasks.filter((t) => t.status === "pending").length} pending tasks
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <NewTaskModal
        isOpen={showNewTask}
        onClose={() => setShowNewTask(false)}
        agents={agents}
        selectedAgentId={selectedAgent.id}
        onCreateTask={handleCreateTask}
      />

      <HireAgentModal isOpen={showHireAgent} onClose={() => setShowHireAgent(false)} onAgentHired={onAgentHired} />

      <LevelUpModal
        isOpen={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        agent={selectedAgent}
        newSkill="Advanced Analytics Tracking"
      />

      <AgentChatInterface agent={selectedAgent} isOpen={showChat} onClose={() => setShowChat(false)} />

      <ConfirmDeleteModal 
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setAgentToDelete(null)
        }}
        onConfirm={confirmDeleteAgent}
        agent={agentToDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
