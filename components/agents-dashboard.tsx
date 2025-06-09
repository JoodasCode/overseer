"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardOverview } from "@/components/dashboard-overview"
import { AgentPage } from "@/components/agent-page"
import { AnalyticsPage } from "@/components/analytics-page"
import { AutomationsPage } from "@/components/automations-page"
import { IntegrationHub } from "@/components/integration-hub"
import { SettingsPage } from "@/components/settings-page"
import { AgentProfile } from "@/components/agent-profile"
import { ErrorMonitoringDashboard } from "@/components/error-monitoring-dashboard"
import { AgentHealthMonitor } from "@/components/agent-health-monitor"
import { WorkflowBuilder } from "@/components/workflow-builder"
import { TemplateMarketplace } from "@/components/template-marketplace"
import { TopBar } from "@/components/top-bar"
import { HireAgentModal } from "@/components/hire-agent-modal"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth/supabase-auth-provider"
import { useAgents } from "@/lib/hooks/use-api"
import { useAgentUpdates } from "@/lib/hooks/use-websocket"
import type { Agent } from "@/lib/types"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AgentGridSkeleton } from "@/components/agent-card-skeleton"

// Production mode - using real data from Supabase only

export default function AgentsDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [showHireAgent, setShowHireAgent] = useState(false)
  const [justHiredAgent, setJustHiredAgent] = useState(false) // Prevent empty state flash
  const [hasMounted, setHasMounted] = useState(false)
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
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  // Only use API hooks when user is authenticated
  const { agents, loading, error, refetch: refetchAgents } = useAgents()
  
  // Subscribe to real-time agent updates
  // useAgentUpdates() // Temporarily disabled to debug

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const handleViewAgentProfile = (agent: Agent) => {
    setSelectedAgent(agent)
    setCurrentPage("agent-profile")
  }

  const handleHireAgent = () => {
    setShowHireAgent(true)
  }

  const renderCurrentPage = () => {
    // Debug logging
    console.log('🎯 Dashboard state:', {
      loading,
      error,
      agentsCount: agents?.length || 0,
      agents: agents,
      justHiredAgent,
      currentPage
    })

    if (loading) {
      // Show skeleton loading states based on current page
      switch (currentPage) {
        case "dashboard":
        case "agents":
          return (
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-96 bg-muted animate-pulse rounded" />
              </div>
              <AgentGridSkeleton count={6} />
            </div>
          )
        default:
          return (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="font-pixel text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          )
      }
    }

    if (error) {
      return (
        <div className="p-6">
          <Alert className="border-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-pixel text-sm">
              Failed to load agents: {error}. Please check your connection and try again.
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-pixel text-sm"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      )
    }

    // Use real agents data - no fallbacks in production mode
    const agentsData = agents || []

    // Show loading state if we just hired an agent and data is still loading
    if (justHiredAgent && agentsData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="font-pixel text-sm text-muted-foreground">Setting up your new agent...</p>
          </div>
        </div>
      )
    }

    // Show empty state if no agents exist (but not if we just hired an agent)
    if (!loading && !justHiredAgent && agentsData.length === 0 && (currentPage === "dashboard" || currentPage === "agents")) {
      return (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-4xl">🤖</span>
            </div>
            <div className="space-y-2">
              <h3 className="font-pixel text-xl font-semibold">No Agents Yet</h3>
              <p className="text-muted-foreground font-pixel text-sm">
                Get started by hiring your first AI agent to help automate your workflows.
              </p>
            </div>
            <button
              onClick={handleHireAgent}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-pixel text-sm"
            >
              <span>🚀</span>
              Hire Your First Agent
            </button>
          </div>
        </div>
      )
    }

    switch (currentPage) {
      case "dashboard":
        return <DashboardOverview agents={agentsData} onSelectAgent={handleViewAgentProfile} />
      case "agents":
        return <AgentPage agents={agentsData} selectedAgent={selectedAgent || agentsData[0]} onSelectAgent={setSelectedAgent} />
      case "analytics":
        return <AnalyticsPage agents={agentsData} />
      case "automations":
        return <AutomationsPage agents={agentsData} />
      case "integrations":
        return <IntegrationHub />
      case "settings":
        return <SettingsPage />
      case "agent-profile":
        return selectedAgent ? <AgentProfile agent={selectedAgent} onBack={() => setCurrentPage("agents")} /> : null
      case "monitoring":
        return <ErrorMonitoringDashboard />
      case "health":
        return <AgentHealthMonitor agents={agentsData} />
      case "workflows":
        return <WorkflowBuilder agents={agentsData} />
      case "templates":
        return <TemplateMarketplace />
      default:
        return <DashboardOverview agents={agentsData} onSelectAgent={handleViewAgentProfile} />
    }
  }

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar currentPage={currentPage} onPageChange={setCurrentPage} onHireAgent={handleHireAgent} />
          <SidebarInset className="flex-1 flex flex-col">
            <TopBar />
            <main className="flex-1 overflow-auto">
              {renderCurrentPage()}
            </main>
          </SidebarInset>
        </div>
        {hasMounted && (
          <HireAgentModal 
            isOpen={showHireAgent} 
            onClose={() => setShowHireAgent(false)}
            onAgentHired={async () => {
              setShowHireAgent(false)
              setJustHiredAgent(true) // Prevent empty state flash
              // Add a small delay to ensure database has been updated
              setTimeout(async () => {
                await refetchAgents()
                // Reset the flag after a longer delay to allow data to settle
                setTimeout(() => {
                  setJustHiredAgent(false)
                }, 1000)
              }, 500)
            }}
          />
        )}
      </SidebarProvider>
    </ProtectedRoute>
  )
}
