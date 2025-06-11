"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Search, 
  Bell, 
  Settings, 
  Home,
  UserCircle,
  RefreshCw,
  Users,
  BarChart3,
  GitMerge,
  Brain,
  Plus,
  Zap,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  FileText,
  Activity,
  Workflow
} from "lucide-react"
import { useAuth } from "@/lib/auth/supabase-auth-provider"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Navigation items with routes
const navigation = [
  { icon: Home, label: "Dashboard", route: "/dashboard" },
  { icon: Users, label: "Agents", route: "/agents" },
  { icon: CheckCircle, label: "Tasks", route: "/tasks" },
  { icon: FileText, label: "Knowledge", route: "/knowledge" },
  { icon: Activity, label: "Activity Log", route: "/activity-log" },
  { icon: Workflow, label: "Workflow Builder", route: "/workflow-builder" },
  { icon: BarChart3, label: "Analytics", route: "/analytics" },
  { icon: GitMerge, label: "Integrations", route: "/integrations" },
  { icon: Settings, label: "Settings", route: "/settings" },
]

// Mock activities data (could be passed as props or fetched)
const activities = [
  {
    id: 1,
    agent: "Alex",
    action: "Completed quarterly report analysis",
    time: "2 minutes ago",
    type: "success",
    avatar: "🧑‍💼",
    avatarUrl: "/avatars/alex.jpg"
  },
  {
    id: 2,
    agent: "Jamie", 
    action: "Detected and blocked security threat",
    time: "5 minutes ago",
    type: "warning",
    avatar: "🛡️",
    avatarUrl: "/avatars/jamie.jpg"
  },
  {
    id: 3,
    agent: "Toby",
    action: "Resolved customer inquiry #4829",
    time: "8 minutes ago",
    type: "success",
    avatar: "👨‍💻",
    avatarUrl: "/avatars/toby.jpg"
  },
  {
    id: 4,
    agent: "Dana",
    action: "Failed to sync with external API",
    time: "15 minutes ago",
    type: "error",
    avatar: "⚙️",
    avatarUrl: "/avatars/dana.jpg"
  },
  {
    id: 5,
    agent: "Riley",
    action: "Generated 5 blog post drafts",
    time: "1 hour ago",
    type: "success",
    avatar: "✍️",
    avatarUrl: "/avatars/riley.jpg"
  }
]

const getActivityIcon = (type: string) => {
  switch (type) {
    case "success": return <CheckCircle className="h-3 w-3 text-green-500" />
    case "warning": return <AlertCircle className="h-3 w-3 text-yellow-500" />
    case "error": return <XCircle className="h-3 w-3 text-red-500" />
    default: return <Clock className="h-3 w-3 text-gray-500" />
  }
}

interface SharedLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function SharedLayout({ children, title, description }: SharedLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
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
                <Brain className="h-4 w-4 text-primary-foreground" />
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
                          <UserCircle className="mr-2 h-4 w-4" />
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
                      <DropdownMenuItem onClick={handleSignOut}>
                        Sign Out
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9">
                      <Bell className="h-4 w-4" />
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
              </div>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-background">
              <div className="h-full">
                <div className="p-6 h-full overflow-auto">
                  {children}
                </div>
              </div>
            </main>

            {/* Right Activity Sidebar */}
            <aside className="w-72 border-l bg-background/50 flex-shrink-0 overflow-auto">
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex gap-3 p-3 rounded-lg border bg-card">
                          <div className="flex items-start gap-2">
                            <Avatar className="h-7 w-7 mt-0.5">
                              <AvatarImage src={activity.avatarUrl} alt={activity.agent} />
                              <AvatarFallback className="text-xs">
                                {activity.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div className="mt-0.5">
                              {getActivityIcon(activity.type)}
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="text-sm font-medium">
                              {activity.agent}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {activity.action}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {activity.time}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-sm h-9">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Agent
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-sm h-9">
                      <Zap className="mr-2 h-4 w-4" />
                      Run Diagnostics
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-sm h-9" asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        System Settings
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
} 