"use client"

import { useState, useEffect } from 'react'
import { SharedLayout } from '@/components/shared/SharedLayout'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
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
  Search, 
  MoreVertical, 
  Edit, 
  MessageCircle, 
  Users, 
  Activity, 
  Zap, 
  Star,
  Brain,
  Coins,
  AlertTriangle,
  Info,
  Target,
  Palette,
  BarChart3,
  Headphones,
  Settings,
  ArrowRight,
  Lightbulb
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from '@/lib/supabase/client'
import { AgentChatSheet } from '@/components/chat/AgentChatSheet'
import { useRouter } from 'next/navigation'
import { TokenUsageBar } from '@/components/token-usage-bar'
import { TokenAwareAgentCard } from '@/components/agents/token-aware-agent-card'
import { useTokens } from '@/hooks/use-tokens'

interface Agent {
  id: string
  name: string
  role: string
  description: string
  avatar_url: string
  status: 'active' | 'idle' | 'offline' | 'collaborating'
  personality: string
  tools: string[]
  memory_map?: any
  department_type?: string
  is_system_agent?: boolean
  stats: {
    total_tasks_completed?: number
    efficiency_score?: number
    last_active?: string
  }
  created_at: string
  updated_at: string
}

interface TokenUsage {
  tokensUsed: number
  tokenQuota: number
  tokensRemaining: number
  subscriptionPlan: string
  resetDate: string
}

// 🎯 Strategic Agent System - Enhanced UI Data
const AGENT_ENHANCEMENTS: Record<string, {
  icon: any
  color: string
  solo_value: string
  synergy_partners: string[]
  example_prompts: string[]
  department_color: string
  tools_display: string[]
}> = {
  'Alex': {
    icon: Target,
    color: 'text-purple-600',
    department_color: 'bg-purple-100 text-purple-800 border-purple-200',
    solo_value: 'Transforms vague ideas into clear, structured plans',
    synergy_partners: ['Dana', 'Riley', 'Jamie', 'Toby'],
    example_prompts: [
      'Turn this idea into a 4-week launch plan',
      'Create a project roadmap with milestones',
      'Map team dependencies for this initiative'
    ],
    tools_display: ['Project Planning', 'OKR Creation', 'Timeline Management']
  },
  'Dana': {
    icon: Palette,
    color: 'text-pink-600',
    department_color: 'bg-pink-100 text-pink-800 border-pink-200',
    solo_value: 'Generates compelling copy and creative direction instantly',
    synergy_partners: ['Alex', 'Riley', 'Jamie', 'Toby'],
    example_prompts: [
      'Write 3 ad headline options for this launch',
      'Create a social media campaign strategy',
      'Design visual direction for this brand'
    ],
    tools_display: ['Copywriting', 'Brand Messaging', 'Content Creation']
  },
  'Jamie': {
    icon: Settings,
    color: 'text-blue-600',
    department_color: 'bg-blue-100 text-blue-800 border-blue-200',
    solo_value: 'Keeps everything aligned and moving internally',
    synergy_partners: ['Alex', 'Dana', 'Riley', 'Toby'],
    example_prompts: [
      'Organize this project thread into action items',
      'Create a team communication plan',
      'Track progress across these initiatives'
    ],
    tools_display: ['Task Management', 'Team Communication', 'Progress Tracking']
  },
  'Riley': {
    icon: BarChart3,
    color: 'text-green-600',
    department_color: 'bg-green-100 text-green-800 border-green-200',
    solo_value: 'Turns raw data into smart, actionable insights',
    synergy_partners: ['Alex', 'Dana', 'Jamie', 'Toby'],
    example_prompts: [
      'Analyze this performance report',
      'What do these metrics tell us?',
      'Find growth opportunities in this data'
    ],
    tools_display: ['Data Analysis', 'Performance Metrics', 'Trend Analysis']
  },
  'Toby': {
    icon: Headphones,
    color: 'text-orange-600',
    department_color: 'bg-orange-100 text-orange-800 border-orange-200',
    solo_value: 'Complex technical info into clear user guidance',
    synergy_partners: ['Alex', 'Dana', 'Riley', 'Jamie'],
    example_prompts: [
      'Write an onboarding FAQ for this feature',
      'Create support templates for billing issues',
      'Simplify this technical documentation'
    ],
    tools_display: ['Technical Writing', 'Customer Support', 'User Documentation']
  }
}

export default function AgentsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [chatAgent, setChatAgent] = useState<Agent | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  // Temporarily disable useTokens hook to debug
  const tokenUsage = { tokensUsed: 5, tokenQuota: 20, tokensRemaining: 15, subscriptionPlan: 'FREE', resetDate: '2024-02-01' }
  const tokenLoading = false
  const canChat = true

  // Load agents from database
  useEffect(() => {
    console.log('🚀 useEffect triggered')
    loadAgents()
  }, [])

  const loadAgents = async () => {
    console.log('🔍 Starting to load agents...')
    try {
      console.log('🔍 Supabase client:', !!supabase)
      
      // Load ALL agents (system + user agents)
      const { data, error } = await supabase
        .from('portal_agents')
        .select('*')
        .eq('status', 'active')
        .order('is_system_agent', { ascending: false }) // System agents first
        .order('created_at', { ascending: false })

      console.log('🔍 Supabase response:', { data: data?.length, error })

      if (error) {
        console.error('❌ Error loading agents:', error)
        setAgents([])
        return
      }

      if (data && data.length > 0) {
        console.log('✅ Found agents:', data.length)
        // Transform database agents to match our interface
        const transformedAgents = data.map((agent: any) => ({
          id: agent.id,
          name: agent.name,
          role: agent.role || 'AI Assistant',
          description: agent.description || 'An intelligent AI assistant',
          avatar_url: agent.avatar_url || `https://api.dicebear.com/9.x/croodles/svg?seed=default&backgroundColor=6b7280`,
          status: agent.status as 'active' | 'idle' | 'offline' | 'collaborating',
          personality: agent.persona || 'Helpful and professional assistant',
          tools: Array.isArray(agent.tools) ? agent.tools : ['General Assistance'],
          memory_map: agent.memory_map || {},
          department_type: agent.department_type,
          is_system_agent: agent.is_system_agent || false,
          stats: {
            total_tasks_completed: agent.level_xp || 0,
            efficiency_score: agent.efficiency_score || 100,
            last_active: agent.last_active || agent.updated_at
          },
          created_at: agent.created_at,
          updated_at: agent.updated_at
        }))
        setAgents(transformedAgents)
        console.log('✅ Agents loaded successfully')
      } else {
        console.log('⚠️ No agents found')
        setAgents([])
      }
    } catch (error) {
      console.error('💥 Database error:', error)
      // Fallback: Create mock agents so the page isn't broken
      console.log('🔄 Using fallback mock agents')
      setAgents([
        {
          id: 'mock-1',
          name: 'Alex',
          role: 'Strategic Coordinator',
          description: 'Transforms vague ideas into clear, structured plans',
          avatar_url: 'https://api.dicebear.com/9.x/croodles/svg?seed=alex&backgroundColor=6b7280',
          status: 'active' as const,
          personality: 'Strategic and organized',
          tools: ['Project Planning', 'OKR Creation', 'Timeline Management'],
          department_type: 'coordination',
          is_system_agent: true,
          stats: {
            total_tasks_completed: 150,
            efficiency_score: 95,
            last_active: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'mock-2',
          name: 'Dana',
          role: 'Creative Specialist',
          description: 'Generates compelling copy and creative direction instantly',
          avatar_url: 'https://api.dicebear.com/9.x/croodles/svg?seed=dana&backgroundColor=6b7280',
          status: 'active' as const,
          personality: 'Creative and inspiring',
          tools: ['Copywriting', 'Brand Messaging', 'Content Creation'],
          department_type: 'creative',
          is_system_agent: true,
          stats: {
            total_tasks_completed: 120,
            efficiency_score: 92,
            last_active: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
    } finally {
      console.log('🏁 Setting loading to false')
      setLoading(false)
    }
  }



  const handleEditAgent = (agent: Agent) => {
    if (agent.is_system_agent) {
      toast({
        title: "System Agent",
        description: "System agents can't be edited, but you can create your own custom agents.",
      })
      return
    }
    
    toast({
      title: "Feature Coming Soon", 
      description: "Agent editing will be available in the next update."
    })
  }

  const handleChatWithAgent = (agent: Agent) => {
    // Check tokens before opening chat
    if (tokenUsage && tokenUsage.tokensRemaining <= 0) {
      toast({
        title: "Token Quota Exceeded",
        description: `You've used all ${tokenUsage.tokenQuota} tokens for this month. Upgrade your plan to continue chatting.`,
        variant: "destructive"
      })
      return
    }

    setChatAgent(agent)
    setIsChatOpen(true)
  }

  const handleCloseChatSheet = () => {
    setIsChatOpen(false)
    setChatAgent(null)
    // Token usage will auto-refresh via the useTokens hook
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

  // 🎯 Token Usage Component
  const TokenUsageCard = () => {
    if (!tokenUsage) return null

    const usagePercentage = (tokenUsage.tokensUsed / tokenUsage.tokenQuota) * 100
    const isLow = tokenUsage.tokensRemaining < 50
    const isExhausted = tokenUsage.tokensRemaining <= 0

    return (
      <Card className={`mb-6 ${isExhausted ? 'border-red-200 bg-red-50/50' : isLow ? 'border-yellow-200 bg-yellow-50/50' : ''}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Token Usage</h3>
                <p className="text-sm text-gray-600">
                  {tokenUsage.tokensUsed} / {tokenUsage.tokenQuota} tokens used
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-1">
                {tokenUsage.subscriptionPlan}
              </Badge>
              <p className="text-sm text-gray-500">
                {tokenUsage.tokensRemaining} remaining
              </p>
            </div>
          </div>
          
          <Progress value={usagePercentage} className="mb-3" />
          
          {isExhausted && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Token quota exceeded. Upgrade to continue chatting.</span>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => router.push('/settings?tab=billing')}
                className="ml-auto"
              >
                Upgrade Plan
              </Button>
            </div>
          )}
          
          {isLow && !isExhausted && (
            <div className="flex items-center gap-2 text-yellow-700 text-sm">
              <Info className="h-4 w-4" />
              <span>Running low on tokens. Consider upgrading your plan.</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => router.push('/settings?tab=billing')}
                className="ml-auto"
              >
                View Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // 🎯 Enhanced Agent Card Component
  const EnhancedAgentCard = ({ agent }: { agent: Agent }) => {
    const enhancement = AGENT_ENHANCEMENTS[agent.name]
    const IconComponent = enhancement?.icon || Brain

    return (
      <Card className={`transition-all duration-200 hover:shadow-lg ${!canChat ? 'opacity-60' : ''} ${agent.is_system_agent ? 'ring-1 ring-blue-200' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={agent.avatar_url} alt={agent.name} />
                  <AvatarFallback className={enhancement?.color || 'text-gray-600'}>
                    <IconComponent className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                {agent.is_system_agent && (
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <Star className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <Badge className={`text-xs px-2 py-1 ${getStatusColor(agent.status)}`}>
                    {getStatusIcon(agent.status)} {agent.status}
                  </Badge>
                </div>
                <CardDescription className="text-sm mt-1">
                  {agent.role}
                </CardDescription>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleChatWithAgent(agent)} disabled={!canChat}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditAgent(agent)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {agent.is_system_agent ? 'View Details' : 'Edit Agent'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Department Badge */}
          {agent.department_type && enhancement && (
            <Badge className={`${enhancement.department_color} text-xs`}>
              {agent.department_type.charAt(0).toUpperCase() + agent.department_type.slice(1)} Specialist
            </Badge>
          )}

          {/* Solo Value Proposition */}
          {enhancement && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-1">🎯 Solo Value:</p>
              <p className="text-sm text-gray-600">{enhancement.solo_value}</p>
            </div>
          )}

          {/* Core Tools */}
          <div>
            <p className="text-sm font-medium text-gray-900 mb-2">🔧 Core Tools:</p>
            <div className="flex flex-wrap gap-1">
              {(enhancement?.tools_display || agent.tools.slice(0, 3)).map((tool, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>

          {/* Synergy Partners */}
          {enhancement && enhancement.synergy_partners.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">🤝 Works Great With:</p>
              <div className="flex flex-wrap gap-1">
                {enhancement.synergy_partners.slice(0, 3).map((partner, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {partner}
                  </Badge>
                ))}
                {enhancement.synergy_partners.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{enhancement.synergy_partners.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Example Prompts */}
          {enhancement && enhancement.example_prompts.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">💬 Try These:</p>
              <div className="space-y-1">
                {enhancement.example_prompts.slice(0, 2).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => canChat && handleChatWithAgent(agent)}
                    disabled={!canChat}
                    className="w-full text-left p-2 text-xs bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group"
                  >
                    <span className="text-blue-700">"{prompt}"</span>
                    <ArrowRight className="h-3 w-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={() => handleChatWithAgent(agent)} 
              className="flex-1"
              disabled={!canChat}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {!canChat ? 'No Tokens' : 'Start Chat'}
            </Button>
            {!agent.is_system_agent && (
              <Button variant="outline" size="sm" onClick={() => handleEditAgent(agent)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Token Cost */}
          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              <Coins className="h-3 w-3 mr-1" />
              1 token per chat
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <SharedLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your agent team...</p>
          </div>
        </div>
      </SharedLayout>
    )
  }

  return (
    <SharedLayout>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Strategic Agent Team</h1>
              <p className="text-gray-600 max-w-2xl">
                Meet your specialized AI agents. Each one delivers standalone value, but they're even more powerful when working together. 
                Choose the right specialist for your task or let them collaborate on complex projects.
              </p>
            </div>
            <Button onClick={() => router.push('/agents/create')} className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Create Agent
            </Button>
          </div>

          {/* Token Usage Display */}
          <TokenUsageCard />

          {/* Multi-Agent Info Card */}
          {agents.filter(a => a.is_system_agent).length >= 2 && (
            <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">💡 Pro Tip: Multi-Agent Workflows</h3>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Try: <em>"Plan and execute a product launch"</em> to see Alex coordinate Dana (creative), 
                  Riley (data), Jamie (operations), and Toby (support) automatically.
                </p>
                <Button variant="outline" size="sm" className="text-blue-700 border-blue-300">
                  Learn About Agent Collaboration →
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search agents by name or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
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
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="coordinator">Coordinator</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="specialist">Specialist</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Agents Grid */}
        {filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Agents Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || statusFilter !== 'all' || roleFilter !== 'all' 
                ? "Try adjusting your search or filters."
                : "Create your first AI agent to get started."}
            </p>
            {!searchQuery && statusFilter === 'all' && roleFilter === 'all' && (
              <Button onClick={() => router.push('/agents/create')}>
                Create Your First Agent
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <EnhancedAgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}

        {/* Agent Chat Sheet */}
        {chatAgent && (
          <AgentChatSheet 
            agent={chatAgent}
            isOpen={isChatOpen}
            onClose={handleCloseChatSheet}
          />
        )}
      </div>
    </SharedLayout>
  )
}
