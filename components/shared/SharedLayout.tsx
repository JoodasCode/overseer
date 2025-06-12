"use client"

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  FileText,
  Activity,
  Workflow,
  MessageSquare,
  Plus,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Zap,
  Search,
  Menu,
  X
} from "lucide-react"
import { useAuth } from "@/lib/auth/supabase-auth-provider"
import { getAgentAvatarUrl } from '@/lib/dicebear-avatar'
import { supabase } from '@/lib/supabase/client'
import { Agent } from '@/lib/types'
import { ShadcnChatTrigger } from '@/components/chat/ShadcnChatTrigger'
import { LogoutButton } from '@/components/auth/logout-button'
import { TokenUsageBar } from '@/components/token-usage-bar'

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Navigation items with routes
const navigation = [
  { icon: LayoutDashboard, label: "Dashboard", route: "/dashboard" },
  { icon: Users, label: "Agents", route: "/agents" },
  { icon: CheckCircle, label: "Tasks", route: "/tasks" },
  { icon: FileText, label: "Knowledge", route: "/knowledge" },
  { icon: Activity, label: "Activity Log", route: "/activity-log" },
  { icon: Workflow, label: "Workflow Builder", route: "/workflow-builder" },
  { icon: BarChart3, label: "Analytics", route: "/analytics" },
  { icon: LayoutDashboard, label: "Integrations", route: "/integrations" },
  { icon: Settings, label: "Settings", route: "/settings" },
]

interface SharedLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

interface ActivityItem {
  id: string
  agent_name: string
  agent_role: string
  agent_avatar_url: string
  action: string
  description: string
  created_at: string
  type: 'success' | 'warning' | 'error' | 'info'
}

export function SharedLayout({ children, title, description }: SharedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(true)
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoadingAgents, setIsLoadingAgents] = useState(true)

  // supabase is already imported

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      console.log('🚫 SharedLayout: User not authenticated, redirecting to signin')
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  // Fetch agents for chat
  useEffect(() => {
    const fetchAgents = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('portal_agents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching agents:', error)
          return
        }

        setAgents(data || [])
      } catch (error) {
        console.error('Error fetching agents:', error)
      } finally {
        setIsLoadingAgents(false)
      }
    }

    fetchAgents()
  }, [user, supabase])

  // Fetch recent activities
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('portal_activity_log')
          .select(`
            id,
            action,
            description,
            created_at,
            portal_agents!inner(
              name,
              role,
              avatar_url
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) {
          console.error('Error fetching activities:', error)
          return
        }

        const formattedActivities: ActivityItem[] = (data || []).map((activity: any) => ({
          id: activity.id,
          agent_name: activity.portal_agents?.name || 'System',
          agent_role: activity.portal_agents?.role || 'System',
          agent_avatar_url: activity.portal_agents?.avatar_url || '',
          action: activity.action,
          description: activity.description,
          created_at: activity.created_at,
          type: getActivityType(activity.action)
        }))

        setActivities(formattedActivities)
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setIsLoadingActivities(false)
      }
    }

    fetchActivities()
  }, [user, supabase])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null
  }

  const getActivityType = (action: string): 'success' | 'warning' | 'error' | 'info' => {
    if (action.includes('completed') || action.includes('success')) return 'success'
    if (action.includes('failed') || action.includes('error')) return 'error'
    if (action.includes('warning') || action.includes('offline')) return 'warning'
    return 'info'
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="h-3 w-3 text-green-500" />
      case "warning": return <AlertCircle className="h-3 w-3 text-yellow-500" />
      case "error": return <XCircle className="h-3 w-3 text-red-500" />
      default: return <Clock className="h-3 w-3 text-gray-500" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hours ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} days ago`
  }



  return (
    <div className="h-screen bg-background overflow-hidden">
      <div className="flex h-full">
        {/* Left Icon Navigation */}
        <aside className="w-16 bg-background/50 flex flex-col flex-shrink-0 border-r">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b flex-shrink-0">
            <Link href="/dashboard">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary hover:bg-primary/90 transition-colors">
                <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
              </div>
            </Link>
          </div>

          {/* Search Icon */}
          <div className="p-3 border-b">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-full h-10">
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Search</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Navigation Icons */}
          <nav className="flex-1 p-3">
            <div className="space-y-2">
              {navigation.map((item) => (
                <TooltipProvider key={item.label}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={item.route}>
                        <Button 
                          variant={pathname === item.route ? "default" : "ghost"} 
                          size="icon" 
                          className="w-full h-10"
                        >
                          <item.icon className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </nav>

          {/* User Profile at Bottom */}
          <div className="p-3 border-t">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-full h-10">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {user?.email?.slice(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="end">
                      <DropdownMenuLabel>{user?.email || "User"}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/settings">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <LogoutButton variant="ghost" size="sm" />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent side="right">Profile</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header Bar */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
            <div className="flex h-16 items-center justify-between px-6">
              {/* Title */}
              <div className="flex-shrink-0 min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-semibold leading-none truncate">{title}</h1>
                  {description && (
                    <span className="text-xs text-muted-foreground leading-none truncate">• {description}</span>
                  )}
                </div>
              </div>

              {/* Center: Search */}
              <div className="flex-1 max-w-md mx-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search agents, tasks, or activities..."
                    className="pl-10 h-9"
                  />
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => window.location.reload()}>
                        <Zap className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9">
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                        3
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="space-y-2 p-2">
                      <div className="text-sm">
                        <div className="font-medium">Integration Hub Error</div>
                        <div className="text-muted-foreground text-xs">API sync failed - requires attention</div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Security Alert</div>
                        <div className="text-muted-foreground text-xs">Threat detected and blocked</div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <TokenUsageBar />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-background">
            <div className="h-full">
              <div className="p-6 h-full overflow-auto">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Floating Chat System */}
      {!isLoadingAgents && agents.length > 0 && (
        <ShadcnChatTrigger agents={agents} />
      )}
    </div>
  )
} 