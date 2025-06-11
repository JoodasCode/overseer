"use client"

import { SharedLayout } from '@/components/shared/SharedLayout'
import { Plus, Search, Settings, RefreshCw, ExternalLink, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const integrations = [
  {
    id: 1,
    name: "Slack",
    description: "Team communication and collaboration platform",
    category: "Communication",
    status: "Connected",
    icon: "💬",
    lastSync: "2 minutes ago",
    agents: 3
  },
  {
    id: 2,
    name: "Google Drive",
    description: "Cloud storage and document management",
    category: "Storage",
    status: "Connected",
    icon: "📁",
    lastSync: "5 minutes ago",
    agents: 2
  },
  {
    id: 3,
    name: "Notion",
    description: "All-in-one workspace for notes and collaboration",
    category: "Productivity",
    status: "Connected",
    icon: "📝",
    lastSync: "1 hour ago",
    agents: 4
  },
  {
    id: 4,
    name: "GitHub",
    description: "Version control and code collaboration",
    category: "Development",
    status: "Disconnected",
    icon: "🔧",
    lastSync: "Never",
    agents: 0
  },
  {
    id: 5,
    name: "Trello",
    description: "Project management and task tracking",
    category: "Productivity",
    status: "Error",
    icon: "📋",
    lastSync: "3 hours ago",
    agents: 1
  },
  {
    id: 6,
    name: "Gmail",
    description: "Email management and automation",
    category: "Communication",
    status: "Connected",
    icon: "📧",
    lastSync: "10 minutes ago",
    agents: 2
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Connected": return "bg-green-500/10 text-green-600 border-green-500/20"
    case "Disconnected": return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    case "Error": return "bg-red-500/10 text-red-600 border-red-500/20"
    default: return "bg-gray-500/10 text-gray-600 border-gray-500/20"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Connected": return <Check className="h-4 w-4" />
    case "Disconnected": return <X className="h-4 w-4" />
    case "Error": return <X className="h-4 w-4" />
    default: return <X className="h-4 w-4" />
  }
}

export default function IntegrationsPage() {
  const connectedCount = integrations.filter(i => i.status === "Connected").length
  const totalIntegrations = integrations.length

  return (
    <SharedLayout title="Integrations" description="Connect and manage your external services">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalIntegrations}</div>
              <p className="text-xs text-muted-foreground">Available services</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectedCount}</div>
              <p className="text-xs text-muted-foreground">Active connections</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">Connection reliability</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                className="pl-10"
              />
            </div>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="productivity">Productivity</SelectItem>
                <SelectItem value="development">Development</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="disconnected">Disconnected</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>

        {/* Integrations Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <span className="text-lg">{integration.icon}</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription>{integration.category}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(integration.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(integration.status)}
                      {integration.status}
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {integration.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Connected agents</span>
                    <span className="font-medium">{integration.agents}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last sync</span>
                    <span className="font-medium">{integration.lastSync}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {integration.status === "Connected" ? (
                      <>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="flex-1">
                        Connect
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SharedLayout>
  )
} 