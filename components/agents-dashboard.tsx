"use client"

import { useState } from "react"
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
import type { Agent } from "@/lib/types"

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
  const [selectedAgent, setSelectedAgent] = useState<Agent>(initialAgents[0])
  const [agents] = useState<Agent[]>(initialAgents)

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

  const renderCurrentPage = () => {
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
        <AppSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        <SidebarInset className="flex flex-col">
          <TopBar />
          <div className="flex-1 p-6 overflow-hidden">{renderCurrentPage()}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
