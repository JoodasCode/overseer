'use client'

import React, { useEffect, useState } from 'react'
import { PortalSidebar } from '@/components/portal/portal-sidebar'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { NotificationContainer, useNotifications } from '@/components/portal/animated-notifications'
import { KeyboardShortcuts } from '@/components/portal/keyboard-shortcuts'
import { CollaborationIndicators, useCollaborationEvents } from '@/components/portal/collaboration-indicators'
import { useSoundSystem } from '@/lib/sound-system'
import { useRouter } from 'next/navigation'
import { 
  Home, 
  Users, 
  Building2, 
  CheckSquare, 
  BookOpen, 
  Puzzle, 
  Workflow, 
  Activity, 
  Settings,
  Heart,
  MessageCircle,
  Plus,
  Search,
  Bell
} from 'lucide-react'

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const { notifications, dismissNotification, success, info, celebrate } = useNotifications();
  const { events: collaborationEvents, startCollaboration, startThinking } = useCollaborationEvents();
  const { playButtonClick } = useSoundSystem();

  // Define keyboard shortcuts
  const shortcutActions = [
    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'View your agent overview and activity',
      icon: <Home className="w-4 h-4" />,
      keywords: ['dashboard', 'home', 'overview'],
      action: () => {
        router.push('/portal/dashboard');
        playButtonClick();
      },
      category: 'navigation' as const
    },
    {
      id: 'nav-agents',
      label: 'Go to Agents',
      description: 'Manage your AI agents',
      icon: <Users className="w-4 h-4" />,
      keywords: ['agents', 'ai', 'team'],
      action: () => {
        router.push('/portal/agents');
        playButtonClick();
      },
      category: 'navigation' as const
    },
    {
      id: 'nav-departments',
      label: 'Go to Departments',
      description: 'Browse agent departments',
      icon: <Building2 className="w-4 h-4" />,
      keywords: ['departments', 'teams', 'groups'],
      action: () => {
        router.push('/portal/departments');
        playButtonClick();
      },
      category: 'navigation' as const
    },
    {
      id: 'nav-tasks',
      label: 'Go to Tasks',
      description: 'View and manage tasks',
      icon: <CheckSquare className="w-4 h-4" />,
      keywords: ['tasks', 'todo', 'work'],
      action: () => {
        router.push('/portal/tasks');
        playButtonClick();
      },
      category: 'navigation' as const
    },
    {
      id: 'nav-workflow',
      label: 'Go to Workflow Builder',
      description: 'Create automated workflows',
      icon: <Workflow className="w-4 h-4" />,
      keywords: ['workflow', 'automation', 'builder'],
      action: () => {
        router.push('/portal/workflow-builder');
        playButtonClick();
      },
      category: 'navigation' as const
    },
    {
      id: 'nav-integrations',
      label: 'Go to Integrations',
      description: 'Manage tool integrations',
      icon: <Puzzle className="w-4 h-4" />,
      keywords: ['integrations', 'tools', 'plugins'],
      action: () => {
        router.push('/portal/integrations');
        playButtonClick();
      },
      category: 'navigation' as const
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      description: 'Configure your portal',
      icon: <Settings className="w-4 h-4" />,
      keywords: ['settings', 'config', 'preferences'],
      action: () => {
        router.push('/portal/settings');
        playButtonClick();
      },
      category: 'navigation' as const
    },

    // Agent Actions
    {
      id: 'create-agent',
      label: 'Create New Agent',
      description: 'Add a new AI agent to your team',
      icon: <Plus className="w-4 h-4" />,
      keywords: ['create', 'new', 'agent', 'add'],
      action: () => {
        router.push('/portal/agents?action=create');
        success('Agent Creation', 'Opening agent creation form...');
        playButtonClick();
      },
      category: 'agents' as const
    },
    {
      id: 'search-agents',
      label: 'Search Agents',
      description: 'Find specific agents in your team',
      icon: <Search className="w-4 h-4" />,
      keywords: ['search', 'find', 'agents'],
      action: () => {
        router.push('/portal/agents?focus=search');
        info('Search Mode', 'Focus on agent search...');
        playButtonClick();
      },
      category: 'agents' as const
    },

    // Actions
    {
      id: 'test-collaboration',
      label: 'Test Agent Collaboration',
      description: 'Simulate agent collaboration',
      icon: <MessageCircle className="w-4 h-4" />,
      keywords: ['test', 'collaboration', 'demo'],
      action: () => {
        startCollaboration(
          [
            { id: 'alex', name: 'Alex', avatar: '🧑‍💼' },
            { id: 'dana', name: 'Dana', avatar: '👽' }
          ],
          'Working on Q4 campaign strategy together',
          30
        );
        celebrate('Collaboration Started!', 'Alex and Dana are now working together');
        playButtonClick();
      },
      category: 'actions' as const
    },
    {
      id: 'test-thinking',
      label: 'Test Agent Thinking',
      description: 'Simulate agent thinking process',
      icon: <Activity className="w-4 h-4" />,
      keywords: ['test', 'thinking', 'demo'],
      action: () => {
        startThinking(
          [{ id: 'riley', name: 'Riley', avatar: '🤖' }],
          'Analyzing performance metrics and trends',
          20
        );
        info('Agent Thinking', 'Riley is analyzing data...');
        playButtonClick();
      },
      category: 'actions' as const
    },

    // Settings
    {
      id: 'toggle-sound',
      label: 'Toggle Sound Effects',
      description: 'Enable or disable audio feedback',
      icon: <Bell className="w-4 h-4" />,
      keywords: ['sound', 'audio', 'toggle', 'mute'],
      action: () => {
        // This would toggle sound in a real implementation
        success('Sound Settings', 'Audio feedback toggled');
        playButtonClick();
      },
      category: 'settings' as const
    }
  ];

  // Demo collaboration events on mount
  useEffect(() => {
    // Removed auto-demo collaboration events to prevent constant popups
    // Users can test collaboration via keyboard shortcuts instead
  }, [startCollaboration]);

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        {/* Persistent Sidebar */}
        <PortalSidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </main>

        {/* Phase 5 Enhancements */}
        <NotificationContainer 
          notifications={notifications} 
          onDismiss={dismissNotification} 
        />
        
        <KeyboardShortcuts 
          actions={shortcutActions}
          onNavigate={(path) => router.push(path)}
        />
        
        <CollaborationIndicators 
          events={collaborationEvents}
          className="bottom-20" // Offset to avoid keyboard shortcut hint
        />
      </div>
    </ProtectedRoute>
  )
} 