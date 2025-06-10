'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth/supabase-auth-provider'
import { PortalAgentWidget } from './portal-agent-widget'
import { PortalNeedsAttention } from './portal-needs-attention'
import { PortalRecentActivity } from './portal-recent-activity'
import { PortalTeamStats } from './portal-team-stats'
import { useNotifications } from './animated-notifications'
import { useSoundSystem } from '@/lib/sound-system'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw, Sparkles, Users, Activity, Brain, Zap } from 'lucide-react'

interface Agent {
  id: string
  name: string
  role: string
  avatar: string
  status: 'active' | 'idle' | 'offline'
  last_active: string
  department_type: string | null
  personality_profile: any
  is_active: boolean
}

interface AttentionItem {
  id: string
  type: 'task_failed' | 'task_overdue' | 'agent_error' | 'workflow_failed' | 'approval_needed'
  title: string
  description: string
  agentName?: string
  agentId?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timestamp: string
}

interface ActivityEntry {
  id: string
  actor_type: 'user' | 'agent' | 'system'
  actor_id: string
  actor_name?: string
  action: string
  meta: any
  created_at: string
}

interface TeamStats {
  totalAgents: number
  activeAgents: number
  departmentBreakdown: Array<{
    department: string
    count: number
    color: string
  }>
}

interface DashboardData {
  agents: Agent[]
  teamStats: TeamStats
  recentActivity: ActivityEntry[]
  attentionItems: AttentionItem[]
  departments: any[]
}

// Animation variants for Phase 5
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
}

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
}

export function PortalDashboard() {
  const { user, session } = useAuth()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const { success, info, celebrate } = useNotifications()
  const { playButtonClick, playTaskCompleted, playNewActivity } = useSoundSystem()

  const fetchDashboardData = async (showRefreshFeedback = false) => {
    if (!session?.access_token) return

    try {
      if (showRefreshFeedback) {
        setRefreshing(true)
        info('Refreshing Dashboard', 'Fetching latest data...')
      } else {
        setLoading(true)
      }

      const response = await fetch('/api/portal/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()
      setDashboardData(data)
      setError(null)
      
      if (showRefreshFeedback) {
        success('Dashboard Updated', 'All data refreshed successfully')
        playTaskCompleted()
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [session])

  const handleChatClick = (agentId: string) => {
    playButtonClick()
    const agent = dashboardData?.agents.find(a => a.id === agentId)
    if (agent) {
      info('Starting Chat', `Opening conversation with ${agent.name}...`)
      playNewActivity()
    }
    router.push(`/portal/agents?chat=${agentId}`)
  }

  const handleSettingsClick = (agentId: string) => {
    playButtonClick()
    router.push(`/portal/agents?settings=${agentId}`)
  }

  const handleCreateAgent = () => {
    playButtonClick()
    celebrate('Creating New Agent!', 'Opening agent creation wizard...')
    router.push('/portal/agents?create=true')
  }

  const handleRefresh = () => {
    playButtonClick()
    fetchDashboardData(true)
  }

  const handleAttentionItemClick = (item: AttentionItem) => {
    if (item.agentId) {
      router.push(`/portal/agents?agent=${item.agentId}`)
    }
  }

  const handleResolveAttention = (itemId: string) => {
    // In a real implementation, this would call an API to resolve the item
    console.log('Resolving attention item:', itemId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">No dashboard data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portal Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here's what's happening with your agents.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateAgent}>
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Agent Widgets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Agents */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Your Agents</h2>
            {dashboardData.agents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData.agents.map((agent) => (
                  <PortalAgentWidget
                    key={agent.id}
                    agent={agent}
                    onChatClick={handleChatClick}
                    onSettingsClick={handleSettingsClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-600 mb-4">No agents created yet</p>
                <Button onClick={handleCreateAgent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Agent
                </Button>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <PortalRecentActivity 
            activities={dashboardData.recentActivity}
          />
        </div>

        {/* Right Column - Stats & Attention */}
        <div className="space-y-6">
          {/* Team Stats */}
          <PortalTeamStats stats={dashboardData.teamStats} />

          {/* Needs Attention */}
          <PortalNeedsAttention
            items={dashboardData.attentionItems}
            onItemClick={handleAttentionItemClick}
            onResolveClick={handleResolveAttention}
          />
        </div>
      </div>
    </div>
  )
} 