"use client"

import { useState, useEffect } from 'react'
import { SharedLayout } from '@/components/shared/SharedLayout'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  MessageCircle, 
  Users, 
  Activity, 
  Zap, 
  Star,
  Brain
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from '@/lib/supabase/client'
import { AgentChatSheet } from '@/components/chat/AgentChatSheet'

interface Agent {
  id: string
  name: string
  role: string
  description: string
  avatar_url: string
  status: 'active' | 'idle' | 'offline' | 'collaborating'
  personality: string
  tools: string[]
  stats: {
    total_tasks_completed?: number
    efficiency_score?: number
    last_active?: string
  }
  created_at: string
  updated_at: string
}

export default function AgentsPage() {
  const { toast } = useToast()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [chatAgent, setChatAgent] = useState<Agent | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const supabase = createClient()

  // Load agents from database
  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading agents:', error)
        // Use mock data as fallback
        loadMockAgents()
        return
      }

      if (data && data.length > 0) {
        setAgents(data)
      } else {
        // No agents found, use mock data
        loadMockAgents()
      }
    } catch (error) {
      console.error('Database error:', error)
      // Use mock data as fallback
      loadMockAgents()
    } finally {
      setLoading(false)
    }
  }

  const loadMockAgents = () => {
    const mockAgents: Agent[] = [
      {
        id: '1',
        name: 'Alex',
        role: 'Strategic Coordinator',
        description: 'Develops strategic plans and coordinates complex projects with systematic precision.',
        avatar_url: `https://api.dicebear.com/9.x/croodles/svg?seed=alex&size=100`,
        status: 'active',
        personality: 'Strategic, methodical, and analytical. Alex approaches challenges with a systematic mindset.',
        tools: ['Strategy Planning', 'Project Coordination', 'Analytics'],
        stats: {
          total_tasks_completed: 156,
          efficiency_score: 94,
          last_active: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Dana',
        role: 'Creative Assistant',
        description: 'Brings creative flair to projects with innovative solutions and artistic vision.',
        avatar_url: `https://api.dicebear.com/9.x/croodles/svg?seed=dana&size=100`,
        status: 'active',
        personality: 'Creative, intuitive, and expressive. Dana excels at thinking outside the box.',
        tools: ['Creative Design', 'Content Creation', 'Innovation'],
        stats: {
          total_tasks_completed: 189,
          efficiency_score: 91,
          last_active: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Jamie',
        role: 'Team Coordinator',
        description: 'Facilitates smooth team operations and ensures seamless communication across all projects.',
        avatar_url: `https://api.dicebear.com/9.x/croodles/svg?seed=jamie&size=100`,
        status: 'collaborating',
        personality: 'Collaborative, organized, and diplomatic. Jamie ensures everyone works together effectively.',
        tools: ['Team Management', 'Communication', 'Workflow Optimization'],
        stats: {
          total_tasks_completed: 203,
          efficiency_score: 96,
          last_active: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Riley',
        role: 'Data Analyst',
        description: 'Transforms complex data into actionable insights with precision and clarity.',
        avatar_url: `https://api.dicebear.com/9.x/croodles/svg?seed=riley&size=100`,
        status: 'idle',
        personality: 'Analytical, detail-oriented, and logical. Riley finds patterns others miss.',
        tools: ['Data Analysis', 'Reporting', 'Statistical Modeling'],
        stats: {
          total_tasks_completed: 134,
          efficiency_score: 89,
          last_active: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Toby',
        role: 'Support Specialist',
        description: 'Provides rapid response support and maintains system reliability around the clock.',
        avatar_url: `https://api.dicebear.com/9.x/croodles/svg?seed=toby&size=100`,
        status: 'active',
        personality: 'Quick, responsive, and action-oriented. Toby thrives under pressure.',
        tools: ['Rapid Response', 'Support Coordination', 'Crisis Management'],
        stats: {
          total_tasks_completed: 112,
          efficiency_score: 88,
          last_active: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    setAgents(mockAgents)
  }

  const handleAgentHired = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Agent hiring will be available in the next update."
    })
  }

  const handleEditAgent = (agent: Agent) => {
    toast({
      title: "Feature Coming Soon", 
      description: "Agent editing will be available in the next update."
    })
  }

  const handleDeleteAgent = async (agent: Agent) => {
    toast({
      title: "Feature Coming Soon",
      description: "Agent deletion will be available in the next update."
    })
  }

  const handleChatWithAgent = (agent: Agent) => {
    setChatAgent(agent)
    setIsChatOpen(true)
  }

  const handleCloseChatSheet = () => {
    setIsChatOpen(false)
    setChatAgent(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600 border-green-500/20"
      case "idle": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "offline": return "bg-gray-500/10 text-gray-600 border-gray-500/20"
      case "collaborating": return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return "●"
      case "idle": return "◐"
      case "offline": return "○"
      case "collaborating": return "◑"
      default: return "○"
    }
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.role.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter
    const matchesRole = roleFilter === 'all' || agent.role.toLowerCase().includes(roleFilter.toLowerCase())
    
    return matchesSearch && matchesStatus && matchesRole
  })

  const totalAgents = agents.length
  const activeAgents = agents.filter(agent => agent.status === 'active').length
  const totalTasks = agents.reduce((sum, agent) => sum + (agent.stats.total_tasks_completed || 0), 0)
  const avgEfficiency = totalAgents > 0 
    ? Math.round(agents.reduce((sum, agent) => sum + (agent.stats.efficiency_score || 0), 0) / totalAgents)
    : 0

  if (loading) {
    return (
      <SharedLayout title="Your Agents" description="Manage your AI agent team">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading agents...</p>
          </div>
        </div>
      </SharedLayout>
    )
  }

  return (
    <SharedLayout title="Your Agents" description="Manage your AI agent team">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAgents}</div>
              <p className="text-xs text-muted-foreground">In your team</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAgents}</div>
              <p className="text-xs text-muted-foreground">Currently working</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgEfficiency}%</div>
              <p className="text-xs text-muted-foreground">Team performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="collaborating">Collaborating</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="coordinator">Coordinator</SelectItem>
                <SelectItem value="assistant">Assistant</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="specialist">Specialist</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleAgentHired}>
            <Plus className="h-4 w-4 mr-2" />
            Hire Agent
          </Button>
        </div>

        {/* Agents Grid */}
        {filteredAgents.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="space-y-3">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">
                {agents.length === 0 ? "No agents hired yet" : "No agents match your filters"}
              </h3>
              <p className="text-muted-foreground">
                {agents.length === 0 
                  ? "Start building your AI team by hiring your first agent."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {agents.length === 0 && (
                <Button onClick={handleAgentHired}>
                  <Plus className="h-4 w-4 mr-2" />
                  Hire Your First Agent
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="relative group hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={agent.avatar_url} alt={agent.name} />
                        <AvatarFallback>{agent.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <CardDescription className="text-sm">{agent.role}</CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleChatWithAgent(agent)}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditAgent(agent)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteAgent(agent)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className={getStatusColor(agent.status)}>
                      <span className="mr-1">{getStatusIcon(agent.status)}</span>
                      {agent.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {agent.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tasks Completed</span>
                      <span className="font-medium">{agent.stats.total_tasks_completed || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Efficiency Score</span>
                      <span className="font-medium">{agent.stats.efficiency_score || 0}%</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleChatWithAgent(agent)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditAgent(agent)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Chat Sheet */}
      <AgentChatSheet
        agent={chatAgent}
        isOpen={isChatOpen}
        onClose={handleCloseChatSheet}
      />
    </SharedLayout>
  )
}
