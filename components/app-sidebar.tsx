"use client"

import {
  Home,
  Users,
  Settings,
  BarChart3,
  Zap,
  Plus,
  Puzzle,
  AlertTriangle,
  Activity,
  GitBranch,
  Store,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

interface AppSidebarProps {
  currentPage: string
  onPageChange: (
    page:
      | "dashboard"
      | "agents"
      | "analytics"
      | "automations"
      | "integrations"
      | "monitoring"
      | "health"
      | "workflows"
      | "templates"
      | "settings",
  ) => void
}

const menuItems = [
  { title: "Dashboard", icon: Home, page: "dashboard" as const },
  { title: "Agents", icon: Users, page: "agents" as const },
  { title: "Analytics", icon: BarChart3, page: "analytics" as const },
  { title: "Automations", icon: Zap, page: "automations" as const },
  { title: "Integrations", icon: Puzzle, page: "integrations" as const },
  { title: "Settings", icon: Settings, page: "settings" as const },
]

const monitoringItems = [
  { title: "Error Monitor", icon: AlertTriangle, page: "monitoring" as const },
  { title: "Agent Health", icon: Activity, page: "health" as const },
]

const workflowItems = [
  { title: "Workflow Builder", icon: GitBranch, page: "workflows" as const },
  { title: "Template Store", icon: Store, page: "templates" as const },
]

export function AppSidebar({ currentPage, onPageChange }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-pixel">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
            <span className="text-primary-foreground font-pixel text-xs">A</span>
          </div>
          <div>
            <h1 className="font-pixel text-sm">AGENTS OS</h1>
            <p className="text-xs text-muted-foreground">v1.0.0</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-pixel text-xs">WORKSPACE</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => onPageChange(item.page)}
                    isActive={currentPage === item.page}
                    className="font-pixel text-xs"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-pixel text-xs">WORKFLOWS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workflowItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => onPageChange(item.page)}
                    isActive={currentPage === item.page}
                    className="font-pixel text-xs"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-pixel text-xs">MONITORING</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {monitoringItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => onPageChange(item.page)}
                    isActive={currentPage === item.page}
                    className="font-pixel text-xs"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-pixel text-xs">QUICK ACTIONS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="font-pixel text-xs">
                  <Plus className="w-4 h-4" />
                  <span>Hire Agent</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground font-pixel">Acme Corp</div>
      </SidebarFooter>
    </Sidebar>
  )
}
