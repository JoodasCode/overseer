"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AgentPage } from "@/components/agent-page"
import { AgentProfile } from "@/components/agent-profile"
import { DashboardOverview } from "@/components/dashboard-overview"
import { AnalyticsPage } from "@/components/analytics-page"
import { AutomationsPage } from "@/components/automations-page"
import { SettingsPage } from "@/components/settings-page"
import { IntegrationHub } from "@/components/integration-hub"
import { ErrorMonitoringDashboard } from "@/components/error-monitoring-dashboard"
import { AgentHealthMonitor } from "@/components/agent-health-monitor"
import { WorkflowBuilder } from "@/components/workflow-builder"
import { TemplateMarketplace } from "@/components/template-marketplace"
import { TopBar } from "@/components/top-bar"
import { HireAgentModal } from "@/components/hire-agent-modal"
import { useAgents } from "@/lib/hooks/use-api"
import { useAgentUpdates } from "@/lib/hooks/use-websocket"
import type { Agent } from "@/lib/types"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Enhanced sample data with custom emojis
const initialAgents: Agent[] = [
  {
    id: "jamie",
    name: "Jamie",
    role: "Marketing Coordinator",
    avatar: "🚀", // User-selected emoji
    persona: "Witty, professional, emoji-lite",
    tools: ["Gmail", "Notion", "LinkedIn", "Mailchimp", "Slack"],
    level: 3,
    status: "active",
    lastActive: "2 min ago",
    joinedDate: "2024-01-15",
    totalTasksCompleted: 127,
    favoriteTools: ["Mailchimp", "LinkedIn"],
    tasks: [
      {
        id: "1",
        title: "Schedule 3 tweets",
        status: "waiting",
        details: "Waiting on event deck",
        priority: "medium",
        xpReward: 25,
      },
      {
        id: "2",
        title: "Draft newsletter",
        status: "completed",
        details: "Q2 product drop newsletter",
        priority: "high",
        xpReward: 50,
      },
      {
        id: "3",
        title: "Update social calendar",
        status: "pending",
        details: "Plan content for next month",
        priority: "low",
        xpReward: 30,
      },
    ],
    memory: {
      weeklyGoals: "3 posts, 1 newsletter",
      recentLearnings: ["Increased CTR by 15% with emoji-free subject lines", "Best posting time: 2-4pm EST"],
      preferences: ["Casual tone", "Data-driven decisions", "Visual content focus"],
      skillsUnlocked: ["Advanced Analytics", "A/B Testing", "Content Automation"],
      memoryLogs: [
        {
          id: "1",
          timestamp: "2024-01-20 14:30",
          type: "learning",
          content: "Learned that Tuesday posts get 23% more engagement",
        },
        {
          id: "2",
          timestamp: "2024-01-19 09:15",
          type: "skill",
          content: "Unlocked Advanced Analytics skill",
        },
      ],
    },
  },
  {
    id: "mel",
    name: "Mel",
    role: "PR Manager",
    avatar: "🐺", // User-selected emoji
    persona: "Strategic, articulate, relationship-focused",
    tools: ["Gmail", "HubSpot", "Google Drive", "DocuSign"],
    level: 4,
    status: "active",
    lastActive: "5 min ago",
    joinedDate: "2024-01-10",
    totalTasksCompleted: 89,
    favoriteTools: ["HubSpot", "DocuSign"],
    tasks: [
      {
        id: "1",
        title: "Draft press release",
        status: "completed",
        details: "Product launch announcement",
        priority: "high",
        xpReward: 75,
      },
      {
        id: "2",
        title: "Media outreach",
        status: "in-progress",
        details: "Contacting tech journalists",
        priority: "high",
        xpReward: 60,
      },
    ],
    memory: {
      weeklyGoals: "2 press releases, 5 media contacts",
      recentLearnings: ["TechCrunch prefers exclusive angles", "Follow up within 48 hours"],
      preferences: ["Professional tone", "Relationship building", "Exclusive angles"],
      skillsUnlocked: ["Media Relations", "Crisis Communication", "Executive Briefing"],
      memoryLogs: [
        {
          id: "1",
          timestamp: "2024-01-18 16:45",
          type: "achievement",
          content: "Successfully placed story in TechCrunch",
        },
      ],
    },
  },
  {
    id: "tara",
    name: "Tara",
    role: "HR Manager",
    avatar: "🐼", // User-selected emoji
    persona: "Supportive, organized, people-first",
    tools: ["BambooHR", "GCal", "Notion", "Slack"],
    level: 2,
    status: "idle",
    lastActive: "1 hour ago",
    joinedDate: "2024-01-20",
    totalTasksCompleted: 45,
    favoriteTools: ["BambooHR", "Slack"],
    tasks: [
      {
        id: "1",
        title: "Onboard new hire",
        status: "completed",
        details: "Sent handbook and setup accounts",
        priority: "high",
        xpReward: 40,
      },
      {
        id: "2",
        title: "Schedule interviews",
        status: "pending",
        details: "For senior developer position",
        priority: "medium",
        xpReward: 35,
      },
    ],
    memory: {
      weeklyGoals: "2 interviews, 1 onboarding",
      recentLearnings: ["Candidates prefer async interviews", "Handbook needs updating"],
      preferences: ["Empathetic communication", "Clear processes", "Inclusive language"],
      skillsUnlocked: ["Onboarding Automation", "Interview Scheduling"],
      memoryLogs: [
        {
          id: "1",
          timestamp: "2024-01-19 11:20",
          type: "learning",
          content: "Discovered 67% of candidates prefer video over phone interviews",
        },
      ],
    },
  },
  {
    id: "devon",
    name: "Devon",
    role: "Sales Associate",
    avatar: "⚡", // User-selected emoji
    persona: "Persuasive, data-driven, relationship-focused",
    tools: ["Gmail", "HubSpot", "Zoom", "Calendly", "LinkedIn Sales Navigator"],
    level: 2,
    status: "active",
    lastActive: "15 min ago",
    joinedDate: "2024-01-25",
    totalTasksCompleted: 34,
    favoriteTools: ["HubSpot", "LinkedIn Sales Navigator"],
    tasks: [
      {
        id: "1",
        title: "Follow up with warm leads",
        status: "in-progress",
        details: "5 prospects from last week's demo",
        priority: "high",
        xpReward: 45,
      },
      {
        id: "2",
        title: "Prepare demo deck",
        status: "pending",
        details: "Customize for enterprise client",
        priority: "medium",
        xpReward: 30,
      },
    ],
    memory: {
      weeklyGoals: "10 calls, 3 demos, 1 close",
      recentLearnings: ["Enterprise clients prefer ROI-focused messaging", "Demo requests spike on Tuesdays"],
      preferences: ["Consultative selling", "ROI focus", "Follow-up automation"],
      skillsUnlocked: ["Lead Qualification", "Demo Automation"],
      memoryLogs: [
        {
          id: "1",
          timestamp: "2024-01-24 13:30",
          type: "achievement",
          content: "Closed $50k enterprise deal",
        },
      ],
    },
  },
  {
    id: "mira",
    name: "Mira",
    role: "Operations Assistant",
    avatar: "🤖", // User-selected emoji
    persona: "Detail-oriented, efficient, process-focused",
    tools: ["Google Calendar", "Slack", "Notion", "Zapier", "Airtable"],
    level: 1,
    status: "active",
    lastActive: "30 min ago",
    joinedDate: "2024-02-01",
    totalTasksCompleted: 18,
    favoriteTools: ["Zapier", "Notion"],
    tasks: [
      {
        id: "1",
        title: "Automate expense reports",
        status: "in-progress",
        details: "Set up Zapier workflow",
        priority: "medium",
        xpReward: 35,
      },
      {
        id: "2",
        title: "Update team directory",
        status: "pending",
        details: "Add new hires to Notion",
        priority: "low",
        xpReward: 20,
      },
    ],
    memory: {
      weeklyGoals: "3 process improvements, 2 automations",
      recentLearnings: ["Zapier saves 2 hours per workflow", "Team prefers Slack over email"],
      preferences: ["Automation-first", "Clear documentation", "Efficiency metrics"],
      skillsUnlocked: ["Process Automation"],
      memoryLogs: [
        {
          id: "1",
          timestamp: "2024-02-01 10:15",
          type: "learning",
          content: "Identified 5 manual processes that can be automated",
        },
      ],
    },
  },
]

export default function AgentsDashboard() {
  const [showHireAgent, setShowHireAgent] = useState(false)
  const [currentPage, setCurrentPage] = useState<
    | "dashboard"
    | "agents"
    | "analytics"
    | "automations"
    | "settings"
    | "agent-profile"
    | "integrations"
    | "monitoring"
    | "health"
    | "workflows"
    | "templates"
  >("dashboard")
  
  // 🚀 REAL API INTEGRATION - Replace sample data with live backend data!
  const { data: apiAgents, loading, error, refetch } = useAgents()
  const { agentUpdates, isConnected } = useAgentUpdates()
  
  // Use API data if available, fallback to sample data for demo
  const agents = apiAgents && apiAgents.length > 0 ? apiAgents : initialAgents
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  // Set initial selected agent when agents load
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0])
    }
  }, [agents, selectedAgent])

  // Handle real-time agent updates
  useEffect(() => {
    if (agentUpdates.length > 0) {
      console.log('🔄 Real-time agent updates received:', agentUpdates)
      // Refetch agents when updates come in
      refetch()
    }
  }, [agentUpdates, refetch])

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    if (currentPage === "dashboard") {
      setCurrentPage("agents")
    }
  }

  const handleViewAgentProfile = (agent: Agent) => {
    setSelectedAgent(agent)
    setCurrentPage("agent-profile")
  }

  const handleHireAgent = () => {
    setShowHireAgent(true)
  }

  const renderCurrentPage = () => {
    // Show loading state only on initial load
    if (loading && !agents.length) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Loading agents from backend...</p>
            <p className="text-sm text-muted-foreground">
              WebSocket: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </p>
          </div>
        </div>
      )
    }

    // Only show error state for non-auth errors
    if (error && !error.includes('Unauthorized') && !agents.length) {
      return (
        <div className="flex items-center justify-center h-full">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load agents: {error}
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                Using sample data for demo. Check your backend connection.
              </span>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // Ensure we have a selected agent
    if (!selectedAgent && agents.length > 0) {
      setSelectedAgent(agents[0])
      return null
    }

    if (!selectedAgent) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No agents available</p>
        </div>
      )
    }

    switch (currentPage) {
      case "dashboard":
        return <DashboardOverview agents={agents} onSelectAgent={handleSelectAgent} />
      case "agents":
        return <AgentPage agents={agents} selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} />
      case "agent-profile":
        return <AgentProfile agent={selectedAgent} onBack={() => setCurrentPage("agents")} />
      case "analytics":
        return <AnalyticsPage agents={agents} />
      case "automations":
        return <AutomationsPage agents={agents} />
      case "integrations":
        return <IntegrationHub />
      case "monitoring":
        return <ErrorMonitoringDashboard />
      case "health":
        return <AgentHealthMonitor agents={agents} />
      case "workflows":
        return <WorkflowBuilder agents={agents} />
      case "templates":
        return <TemplateMarketplace />
      case "settings":
        return <SettingsPage />
      default:
        return <DashboardOverview agents={agents} onSelectAgent={handleSelectAgent} />
    }
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar currentPage={currentPage} onPageChange={setCurrentPage} onHireAgent={handleHireAgent} />
        <SidebarInset className="flex flex-col">
          <TopBar />
          {/* 🚀 API Status Indicator */}
          <div className="px-6 py-2 bg-muted/50 border-b">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${apiAgents && apiAgents.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-muted-foreground">
                  {apiAgents && apiAgents.length > 0 
                    ? `🎉 Live Backend Data (${agents.length} agents)` 
                    : '🎭 Sample Data (Backend connecting...)'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>WebSocket: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</span>
                {agentUpdates.length > 0 && (
                  <span>Updates: {agentUpdates.length}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 p-6 overflow-hidden">{renderCurrentPage()}</div>
        </SidebarInset>
      </div>
      <HireAgentModal isOpen={showHireAgent} onClose={() => setShowHireAgent(false)} />
    </SidebarProvider>
  )
}
