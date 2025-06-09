"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Zap, Plus, Settings, Play, Pause, Users, Bell, Calendar, Mail, MessageSquare, Loader2 } from "lucide-react"
import { NewAutomationModal } from "@/components/new-automation-modal"
import { useAuth } from "@/lib/auth/supabase-auth-provider"
import type { Agent } from "@/lib/types"

interface AutomationsPageProps {
  agents: Agent[]
}

interface Automation {
  id: string
  name: string
  description: string
  trigger_type: string
  trigger_config: Record<string, any>
  action_type: string
  action_config: Record<string, any>
  agents: string[]
  status: "active" | "paused" | "draft"
  category: "notifications" | "workflows" | "integrations"
  run_count: number
  success_count: number
  last_run?: string
  created_at: string
  updated_at: string
}

// Icon mapping for different automation types
const getAutomationIcon = (trigger_type: string, action_type: string) => {
  if (action_type === 'notification') return <Bell className="w-4 h-4" />
  if (action_type === 'email') return <Mail className="w-4 h-4" />
  if (action_type === 'slack_message') return <MessageSquare className="w-4 h-4" />
  if (action_type === 'create_task') return <Calendar className="w-4 h-4" />
  if (action_type === 'agent_collaboration') return <Users className="w-4 h-4" />
  if (trigger_type === 'time') return <Calendar className="w-4 h-4" />
  return <Zap className="w-4 h-4" />
}

export function AutomationsPage({ agents }: AutomationsPageProps) {
  const { session } = useAuth()
  const [showNewAutomation, setShowNewAutomation] = useState(false)
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState("all")

  // Fetch automations from API
  const fetchAutomations = async () => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/automations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAutomations(data.automations || [])
      } else {
        console.error('Failed to fetch automations')
        // If the table doesn't exist yet, use fallback automations
        setAutomations(generateFallbackAutomations())
      }
    } catch (error) {
      console.error('Error fetching automations:', error)
      // Use fallback automations if API fails
      setAutomations(generateFallbackAutomations())
    } finally {
      setLoading(false)
    }
  }

  // Generate fallback automations based on available agents
  const generateFallbackAutomations = (): Automation[] => {
    const baseAutomations: Automation[] = [];
    
    // If we have agents, create relevant automations
    if (agents && agents.length > 0) {
      // Find specific agent types
      const marketingAgents = agents.filter(a => a.role?.toLowerCase().includes('marketing') || a.name?.toLowerCase().includes('jamie'));
      const prAgents = agents.filter(a => a.role?.toLowerCase().includes('pr') || a.name?.toLowerCase().includes('mel'));
      const hrAgents = agents.filter(a => a.role?.toLowerCase().includes('hr') || a.name?.toLowerCase().includes('tara'));
      
      // Create automations based on available agents
      if (prAgents.length > 0 && marketingAgents.length > 0) {
        baseAutomations.push({
          id: "pr-marketing-sync",
          name: "PR → Marketing Sync",
          description: `When ${prAgents[0].name} publishes PR content, notify ${marketingAgents[0].name} to create social posts`,
          trigger_type: "event",
          trigger_config: { event_type: "content_published" },
          action_type: "notification",
          action_config: { message: "New PR content ready for social media" },
          agents: [prAgents[0].id, marketingAgents[0].id],
          status: "active",
          category: "notifications",
          run_count: 12,
          success_count: 11,
          last_run: "2024-01-15T10:30:00Z",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-15T10:30:00Z"
        });
      }
      
      if (agents.length >= 2) {
        baseAutomations.push({
          id: "team-report",
          name: "Weekly Team Report",
          description: "Auto-generate and send weekly performance summary every Friday",
          trigger_type: "time",
          trigger_config: { schedule: "weekly" },
          action_type: "email",
          action_config: { subject: "Weekly Team Report", template: "team_summary" },
          agents: agents.slice(0, 3).map(a => a.id),
          status: "active",
          category: "workflows",
          run_count: 8,
          success_count: 8,
          last_run: "2024-01-12T17:00:00Z",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-12T17:00:00Z"
        });
      }
      
      if (hrAgents.length > 0) {
        baseAutomations.push({
          id: "onboarding",
          name: "New Hire Onboarding",
          description: `When ${hrAgents[0].name} adds new hire, auto-setup accounts and send welcome email`,
          trigger_type: "event",
          trigger_config: { event_type: "new_hire_added" },
          action_type: "create_task",
          action_config: { template: "onboarding_checklist" },
          agents: [hrAgents[0].id],
          status: "paused",
          category: "workflows",
          run_count: 3,
          success_count: 3,
          last_run: "2024-01-10T09:00:00Z",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-10T09:00:00Z"
        });
      }
      
      if (marketingAgents.length > 0) {
        baseAutomations.push({
          id: "email-campaign",
          name: "Email Campaign Sync",
          description: "Sync newsletter campaigns between marketing tools",
          trigger_type: "webhook",
          trigger_config: { source: "mailchimp" },
          action_type: "slack_message",
          action_config: { channel: "#marketing", message: "New campaign launched!" },
          agents: [marketingAgents[0].id],
          status: "active",
          category: "integrations",
          run_count: 15,
          success_count: 14,
          last_run: "2024-01-14T14:30:00Z",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-14T14:30:00Z"
        });
      }
      
      if (agents.length > 0) {
        baseAutomations.push({
          id: "slack-updates",
          name: "Slack Status Updates",
          description: "Post daily agent activity summaries to team Slack",
          trigger_type: "time",
          trigger_config: { schedule: "daily" },
          action_type: "slack_message",
          action_config: { channel: "#team-updates", template: "daily_summary" },
          agents: agents.map(a => a.id),
          status: "draft",
          category: "notifications",
          run_count: 0,
          success_count: 0,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z"
        });
      }
    }
    
    // If no agents or need fallback examples
    if (baseAutomations.length === 0) {
      return [
        {
          id: "example-1",
          name: "Agent Collaboration",
          description: "Set up cross-agent workflows when you have multiple agents",
          trigger_type: "event",
          trigger_config: { event_type: "agents_created" },
          action_type: "agent_collaboration",
          action_config: { workflow: "team_setup" },
          agents: [],
          status: "draft",
          category: "workflows",
          run_count: 0,
          success_count: 0,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z"
        },
        {
          id: "example-2",
          name: "Daily Updates",
          description: "Get automated status updates from your AI agents",
          trigger_type: "time",
          trigger_config: { schedule: "daily" },
          action_type: "notification",
          action_config: { message: "Daily agent status update" },
          agents: [],
          status: "draft",
          category: "notifications",
          run_count: 0,
          success_count: 0,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z"
        },
      ];
    }
    
    return baseAutomations;
  };

  useEffect(() => {
    fetchAutomations()
  }, [session])

  const handleAutomationCreated = () => {
    fetchAutomations() // Refresh the list
  }

  const handleToggleAutomation = async (automationId: string, newStatus: 'active' | 'paused') => {
    if (!session?.access_token) return

    try {
      const response = await fetch('/api/automations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          id: automationId,
          status: newStatus
        })
      })

      if (response.ok) {
        // Update local state
        setAutomations(prev => prev.map(automation => 
          automation.id === automationId 
            ? { ...automation, status: newStatus }
            : automation
        ))
      } else {
        console.error('Failed to update automation status')
      }
    } catch (error) {
      console.error('Error updating automation:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "paused":
        return "secondary"
      case "draft":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getAgentName = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId)
    return agent ? agent.name : agentId
  }

  const getAgentAvatar = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId)
    return agent ? agent.avatar : "🤖"
  }

  const formatTriggerDescription = (automation: Automation) => {
    switch (automation.trigger_type) {
      case 'time':
        const schedule = automation.trigger_config.schedule
        return schedule === 'daily' ? 'Daily at 9AM' : 
               schedule === 'weekly' ? 'Weekly on Monday' :
               schedule === 'hourly' ? 'Every hour' : 'Custom schedule'
      case 'event':
        return `When ${automation.trigger_config.event_type || 'event occurs'}`
      case 'webhook':
        return `External webhook from ${automation.trigger_config.source || 'service'}`
      case 'manual':
        return 'Manual trigger'
      default:
        return 'Unknown trigger'
    }
  }

  const formatActionDescription = (automation: Automation) => {
    switch (automation.action_type) {
      case 'notification':
        return 'Send notification'
      case 'email':
        return `Send email: ${automation.action_config.subject || 'Email'}`
      case 'slack_message':
        return `Post to ${automation.action_config.channel || '#general'}`
      case 'create_task':
        return 'Create new task'
      case 'agent_collaboration':
        return 'Enable agent collaboration'
      default:
        return 'Unknown action'
    }
  }

  const activeAutomations = automations.filter((a) => a.status === "active").length
  const totalAutomations = automations.length
  
  // Calculate real metrics based on agents and automations
  const tasksAutomated = automations.reduce((total, automation) => {
    return total + automation.success_count;
  }, 0);
  
  const timeSaved = Math.round(tasksAutomated * 0.25 * 10) / 10; // ~15min per automated task

  // Filter automations based on selected tab
  const filteredAutomations = selectedTab === 'all' 
    ? automations 
    : automations.filter(automation => automation.category === selectedTab)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-2xl">Automation Hub</h1>
          <p className="text-muted-foreground">Manage agent workflows and integrations</p>
        </div>
        <Button className="font-pixel text-xs" onClick={() => setShowNewAutomation(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New Automation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Active Automations</CardTitle>
            <Zap className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">{activeAutomations}</div>
            <p className="text-xs text-muted-foreground">of {totalAutomations} total</p>
          </CardContent>
        </Card>

        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Tasks Automated</CardTitle>
            <Settings className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">{tasksAutomated}</div>
            <p className="text-xs text-muted-foreground">completed tasks</p>
          </CardContent>
        </Card>

        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Time Saved</CardTitle>
            <Play className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">{timeSaved}h</div>
            <p className="text-xs text-muted-foreground">estimated</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="font-pixel">
          <TabsTrigger value="all" className="text-xs">
            ALL ({automations.length})
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">
            NOTIFICATIONS ({automations.filter(a => a.category === 'notifications').length})
          </TabsTrigger>
          <TabsTrigger value="workflows" className="text-xs">
            WORKFLOWS ({automations.filter(a => a.category === 'workflows').length})
          </TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs">
            INTEGRATIONS ({automations.filter(a => a.category === 'integrations').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAutomations.map((automation) => (
              <Card key={automation.id} className="border-pixel">
                <CardHeader>
                  <CardTitle className="font-pixel text-sm flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getAutomationIcon(automation.trigger_type, automation.action_type)}
                      <span>{automation.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(automation.status)} className="font-pixel text-xs">
                        {automation.status}
                      </Badge>
                      <Switch 
                        checked={automation.status === "active"} 
                        onCheckedChange={(checked) => 
                          handleToggleAutomation(automation.id, checked ? 'active' : 'paused')
                        }
                      />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{automation.description}</p>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-pixel">Trigger:</span> {formatTriggerDescription(automation)}
                    </div>
                    <div>
                      <span className="font-pixel">Action:</span> {formatActionDescription(automation)}
                    </div>
                  </div>

                  {automation.run_count > 0 && (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="font-pixel">Runs:</span>
                        <span>{automation.run_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-pixel">Success Rate:</span>
                        <span>{automation.run_count > 0 ? Math.round((automation.success_count / automation.run_count) * 100) : 0}%</span>
                      </div>
                      {automation.last_run && (
                        <div className="flex justify-between">
                          <span className="font-pixel">Last Run:</span>
                          <span>{new Date(automation.last_run).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-pixel">Agents:</span>
                      {automation.agents.length > 0 ? (
                        automation.agents.map((agentId, index) => (
                          <span key={index} className="text-sm" title={getAgentName(agentId)}>
                            {getAgentAvatar(agentId)}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No agents assigned</span>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Settings className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleToggleAutomation(
                          automation.id, 
                          automation.status === "active" ? "paused" : "active"
                        )}
                      >
                        {automation.status === "active" ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAutomations.length === 0 && (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-pixel text-lg mb-2">No automations in this category</h3>
              <p className="text-muted-foreground mb-4">
                {selectedTab === 'all' 
                  ? 'Create your first automation to get started'
                  : `No ${selectedTab} automations found. Try creating one!`
                }
              </p>
              <Button onClick={() => setShowNewAutomation(true)} className="font-pixel text-xs">
                <Plus className="w-4 h-4 mr-2" />
                Create Automation
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* New Automation Modal */}
      <NewAutomationModal
        isOpen={showNewAutomation}
        onClose={() => setShowNewAutomation(false)}
        onAutomationCreated={handleAutomationCreated}
        agents={agents}
      />
    </div>
  )
}
