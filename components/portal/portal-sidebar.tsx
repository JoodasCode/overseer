'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  CheckSquare, 
  BookOpen, 
  Puzzle, 
  Workflow, 
  Activity,
  Settings,
  AlertTriangle
} from 'lucide-react'

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/portal/dashboard',
    icon: LayoutDashboard,
    description: 'Agent status, team XP, needs attention'
  },
  {
    name: 'Agents',
    href: '/portal/agents',
    icon: Users,
    description: 'Agent directory and management'
  },
  {
    name: 'Departments',
    href: '/portal/departments',
    icon: Building2,
    description: 'Pre-grouped agent types (Comms, HR, Ops)'
  },
  {
    name: 'Tasks',
    href: '/portal/tasks',
    icon: CheckSquare,
    description: 'Task dashboard (assigned/to review/complete)'
  },
  {
    name: 'Knowledge',
    href: '/portal/knowledge',
    icon: BookOpen,
    description: 'Agent-shared documents and context memory'
  },
  {
    name: 'Integrations',
    href: '/portal/integrations',
    icon: Puzzle,
    description: 'Connected tools, token management'
  },
  {
    name: 'Workflow Builder',
    href: '/portal/workflow-builder',
    icon: Workflow,
    description: 'Node-based automation'
  },
  {
    name: 'Activity Log',
    href: '/portal/activity-log',
    icon: Activity,
    description: 'Full agent and system history'
  },
  {
    name: 'Settings',
    href: '/portal/settings',
    icon: Settings,
    description: 'Portal configuration'
  },
  {
    name: 'Agent Health',
    href: '/portal/health',
    icon: AlertTriangle,
    description: 'Error monitor and diagnostics'
  }
]

export function PortalSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Portal Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">AGENTS OS</h1>
            <p className="text-xs text-muted-foreground">Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p>Portal v2.0</p>
          <p>Internal Portal System</p>
        </div>
      </div>
    </div>
  )
} 