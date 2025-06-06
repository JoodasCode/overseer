"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Zap, Plus, Settings, Play, Pause, Users, Bell, Calendar, Mail, MessageSquare } from "lucide-react"
import type { Agent } from "@/lib/types"

interface AutomationsPageProps {
  agents: Agent[]
}

interface Automation {
  id: string
  name: string
  description: string
  trigger: string
  action: string
  agents: string[]
  status: "active" | "paused" | "draft"
  icon: React.ReactNode
  category: "notifications" | "workflows" | "integrations"
}

export function AutomationsPage({ agents }: AutomationsPageProps) {
  const [automations] = useState<Automation[]>([
    {
      id: "1",
      name: "PR → Marketing Sync",
      description: "When Mel publishes PR content, notify Jamie to create social posts",
      trigger: "PR content published",
      action: "Notify Marketing team",
      agents: ["mel", "jamie"],
      status: "active",
      icon: <Bell className="w-4 h-4" />,
      category: "notifications",
    },
    {
      id: "2",
      name: "Weekly Team Report",
      description: "Auto-generate and send weekly performance summary every Friday",
      trigger: "Every Friday 5PM",
      action: "Generate team report",
      agents: ["jamie", "mel", "tara"],
      status: "active",
      icon: <Calendar className="w-4 h-4" />,
      category: "workflows",
    },
    {
      id: "3",
      name: "New Hire Onboarding",
      description: "When Tara adds new hire, auto-setup accounts and send welcome email",
      trigger: "New hire added",
      action: "Setup accounts + welcome email",
      agents: ["tara"],
      status: "paused",
      icon: <Users className="w-4 h-4" />,
      category: "workflows",
    },
    {
      id: "4",
      name: "Email Campaign Sync",
      description: "Sync newsletter campaigns between marketing tools",
      trigger: "Newsletter scheduled",
      action: "Update all platforms",
      agents: ["jamie"],
      status: "active",
      icon: <Mail className="w-4 h-4" />,
      category: "integrations",
    },
    {
      id: "5",
      name: "Slack Status Updates",
      description: "Post daily agent activity summaries to team Slack",
      trigger: "Daily at 9AM",
      action: "Post to #team-updates",
      agents: ["jamie", "mel", "tara"],
      status: "draft",
      icon: <MessageSquare className="w-4 h-4" />,
      category: "notifications",
    },
  ])

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

  const activeAutomations = automations.filter((a) => a.status === "active").length
  const totalAutomations = automations.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-2xl">Automation Hub</h1>
          <p className="text-muted-foreground">Manage agent workflows and integrations</p>
        </div>
        <Button className="font-pixel text-xs">
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
            <div className="text-2xl font-pixel">47</div>
            <p className="text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>

        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Time Saved</CardTitle>
            <Play className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">12.5h</div>
            <p className="text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="font-pixel">
          <TabsTrigger value="all" className="text-xs">
            ALL
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">
            NOTIFICATIONS
          </TabsTrigger>
          <TabsTrigger value="workflows" className="text-xs">
            WORKFLOWS
          </TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs">
            INTEGRATIONS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {automations.map((automation) => (
              <Card key={automation.id} className="border-pixel">
                <CardHeader>
                  <CardTitle className="font-pixel text-sm flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {automation.icon}
                      <span>{automation.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(automation.status)} className="font-pixel text-xs">
                        {automation.status}
                      </Badge>
                      <Switch checked={automation.status === "active"} />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{automation.description}</p>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-pixel">Trigger:</span> {automation.trigger}
                    </div>
                    <div>
                      <span className="font-pixel">Action:</span> {automation.action}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-pixel">Agents:</span>
                      {automation.agents.map((agentId, index) => (
                        <span key={index} className="text-sm" title={getAgentName(agentId)}>
                          {getAgentAvatar(agentId)}
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Settings className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        {automation.status === "active" ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {["notifications", "workflows", "integrations"].map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {automations
                .filter((automation) => automation.category === category)
                .map((automation) => (
                  <Card key={automation.id} className="border-pixel">
                    <CardHeader>
                      <CardTitle className="font-pixel text-sm flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {automation.icon}
                          <span>{automation.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusColor(automation.status)} className="font-pixel text-xs">
                            {automation.status}
                          </Badge>
                          <Switch checked={automation.status === "active"} />
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{automation.description}</p>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-pixel">Trigger:</span> {automation.trigger}
                        </div>
                        <div>
                          <span className="font-pixel">Action:</span> {automation.action}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-pixel">Agents:</span>
                          {automation.agents.map((agentId, index) => (
                            <span key={index} className="text-sm" title={getAgentName(agentId)}>
                              {getAgentAvatar(agentId)}
                            </span>
                          ))}
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Settings className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            {automation.status === "active" ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
