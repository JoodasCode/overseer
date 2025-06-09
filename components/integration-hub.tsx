"use client"

import React, { useState } from "react"
import { useUserIntegrations } from "@/lib/hooks/use-api"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  Zap,
  Shield,
  Activity,
} from "lucide-react"

interface Integration {
  id: string
  name: string
  icon: string
  category: "communication" | "productivity" | "analytics" | "crm" | "social"
  status: "connected" | "error" | "disconnected" | "syncing"
  lastSync?: string
  error?: string
  hasApiKey?: boolean
  hasOAuth?: boolean
  description: string
  permissions?: string[]
}

const availableIntegrations: Integration[] = [
  {
    id: "gmail",
    name: "Gmail",
    icon: "📧",
    category: "communication",
    status: "connected",
    lastSync: "2 min ago",
    hasOAuth: true,
    description: "Send emails and manage inbox",
    permissions: ["Read emails", "Send emails", "Manage labels"],
  },
  {
    id: "slack",
    name: "Slack",
    icon: "💬",
    category: "communication",
    status: "connected",
    lastSync: "5 min ago",
    hasOAuth: true,
    description: "Send messages and notifications",
    permissions: ["Send messages", "Read channels", "Manage notifications"],
  },
  {
    id: "notion",
    name: "Notion",
    icon: "📝",
    category: "productivity",
    status: "error",
    error: "API key expired",
    hasApiKey: true,
    description: "Manage documents and databases",
    permissions: ["Read pages", "Create pages", "Update databases"],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    icon: "🎯",
    category: "crm",
    status: "syncing",
    hasOAuth: true,
    description: "Manage contacts and deals",
    permissions: ["Read contacts", "Create deals", "Update properties"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    category: "social",
    status: "disconnected",
    hasOAuth: true,
    description: "Post content and manage connections",
    permissions: ["Post updates", "Read profile", "Manage connections"],
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    icon: "📊",
    category: "analytics",
    status: "disconnected",
    hasOAuth: true,
    description: "Track website performance",
    permissions: ["Read analytics data", "Create reports"],
  },
]

export function IntegrationHub() {
  // All hooks must be called in the same order every time - NO CONDITIONAL HOOKS!
  const { integrations: userIntegrations, loading, error } = useUserIntegrations();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // Update integrations when userIntegrations change
  React.useEffect(() => {
    if (userIntegrations && userIntegrations.length > 0) {
      setIntegrations(userIntegrations);
    }
  }, [userIntegrations]);

  // Use real integrations or fallback to availableIntegrations for demo
  const displayIntegrations = userIntegrations && userIntegrations.length > 0 ? userIntegrations : availableIntegrations;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-pixel text-2xl text-primary">Integration Hub</h1>
          <p className="text-muted-foreground">Connect your tools and services</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="font-pixel text-sm text-muted-foreground">Loading integrations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-pixel text-2xl text-primary">Integration Hub</h1>
          <p className="text-muted-foreground">Connect your tools and services</p>
        </div>
        <div className="text-center p-8">
          <p className="text-red-500 font-pixel">Error loading integrations: {error}</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "syncing":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "default"
      case "error":
        return "destructive"
      case "syncing":
        return "secondary"
      default:
        return "outline"
    }
  }

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration)
    setShowSetupModal(true)
  }

  const handleOAuthConnect = () => {
    if (!selectedIntegration) return

    // Simulate OAuth flow
    console.log(`Starting OAuth for ${selectedIntegration.name}`)

    // Update status to syncing
    setIntegrations((prev) =>
      prev.map((int) => (int.id === selectedIntegration.id ? { ...int, status: "syncing" as const } : int)),
    )

    // Simulate successful connection after delay
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((int) =>
          int.id === selectedIntegration.id ? { ...int, status: "connected" as const, lastSync: "Just now" } : int,
        ),
      )
    }, 2000)

    setShowSetupModal(false)
  }

  const handleApiKeyConnect = () => {
    if (!selectedIntegration || !apiKey.trim()) return

    // Simulate API key validation
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === selectedIntegration.id
          ? { ...int, status: "connected" as const, lastSync: "Just now", error: undefined }
          : int,
      ),
    )

    setApiKey("")
    setShowSetupModal(false)
  }

  const handleTestConnection = (integration: Integration) => {
    setIntegrations((prev) =>
      prev.map((int) => (int.id === integration.id ? { ...int, status: "syncing" as const } : int)),
    )

    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((int) =>
          int.id === integration.id ? { ...int, status: "connected" as const, lastSync: "Just now" } : int,
        ),
      )
    }, 1500)
  }

  const handleDisconnect = (integration: Integration) => {
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === integration.id
          ? { ...int, status: "disconnected" as const, lastSync: undefined, error: undefined }
          : int,
      ),
    )
  }

  const connectedCount = displayIntegrations.filter((int) => int.status === "connected").length
  const errorCount = displayIntegrations.filter((int) => int.status === "error").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-2xl text-primary">Integration Hub</h1>
          <p className="text-muted-foreground">Connect your tools and services</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-pixel text-green-600">{connectedCount}</span> connected
            {errorCount > 0 && (
              <>
                <span className="mx-2">•</span>
                <span className="font-pixel text-red-600">{errorCount}</span> errors
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Connected</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">{connectedCount}</div>
            <p className="text-xs text-muted-foreground">Active integrations</p>
          </CardContent>
        </Card>

        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Sync Status</CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">{displayIntegrations.filter((int) => int.lastSync).length}</div>
            <p className="text-xs text-muted-foreground">Recently synced</p>
          </CardContent>
        </Card>

        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Health</CardTitle>
            <Shield className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">{Math.round((connectedCount / displayIntegrations.length) * 100)}%</div>
            <p className="text-xs text-muted-foreground">System health</p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Categories */}
      <Tabs defaultValue="all">
        <TabsList className="font-pixel">
          <TabsTrigger value="all" className="text-xs">
            ALL
          </TabsTrigger>
          <TabsTrigger value="communication" className="text-xs">
            COMMUNICATION
          </TabsTrigger>
          <TabsTrigger value="productivity" className="text-xs">
            PRODUCTIVITY
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">
            ANALYTICS
          </TabsTrigger>
          <TabsTrigger value="crm" className="text-xs">
            CRM
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayIntegrations.map((integration) => (
              <Card key={integration.id} className="border-pixel">
                <CardHeader>
                  <CardTitle className="font-pixel text-sm flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{integration.icon}</span>
                      <span>{integration.name}</span>
                    </div>
                    {getStatusIcon(integration.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{integration.description}</p>

                  <div className="flex items-center justify-between">
                    <Badge variant={getStatusColor(integration.status)} className="font-pixel text-xs">
                      {integration.status}
                    </Badge>
                    {integration.lastSync && (
                      <span className="text-xs text-muted-foreground">Last sync: {integration.lastSync}</span>
                    )}
                  </div>

                  {integration.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-xs text-red-600">{integration.error}</p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {integration.status === "disconnected" || integration.status === "error" ? (
                      <Button onClick={() => handleConnect(integration)} className="flex-1 font-pixel text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        Connect
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleTestConnection(integration)}
                          className="flex-1 font-pixel text-xs"
                          disabled={integration.status === "syncing"}
                        >
                          <RefreshCw
                            className={`w-3 h-3 mr-1 ${integration.status === "syncing" ? "animate-spin" : ""}`}
                          />
                          Test
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDisconnect(integration)}
                          className="font-pixel text-xs"
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {["communication", "productivity", "analytics", "crm"].map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayIntegrations
                .filter((integration) => integration.category === category)
                .map((integration) => (
                  <Card key={integration.id} className="border-pixel">
                    <CardHeader>
                      <CardTitle className="font-pixel text-sm flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{integration.icon}</span>
                          <span>{integration.name}</span>
                        </div>
                        {getStatusIcon(integration.status)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{integration.description}</p>

                      <div className="flex items-center justify-between">
                        <Badge variant={getStatusColor(integration.status)} className="font-pixel text-xs">
                          {integration.status}
                        </Badge>
                        {integration.lastSync && (
                          <span className="text-xs text-muted-foreground">Last sync: {integration.lastSync}</span>
                        )}
                      </div>

                      {integration.error && (
                        <div className="bg-red-50 border border-red-200 rounded p-2">
                          <p className="text-xs text-red-600">{integration.error}</p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        {integration.status === "disconnected" || integration.status === "error" ? (
                          <Button onClick={() => handleConnect(integration)} className="flex-1 font-pixel text-xs">
                            <Plus className="w-3 h-3 mr-1" />
                            Connect
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => handleTestConnection(integration)}
                              className="flex-1 font-pixel text-xs"
                              disabled={integration.status === "syncing"}
                            >
                              <RefreshCw
                                className={`w-3 h-3 mr-1 ${integration.status === "syncing" ? "animate-spin" : ""}`}
                              />
                              Test
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDisconnect(integration)}
                              className="font-pixel text-xs"
                            >
                              <Settings className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Setup Modal */}
      <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
        <DialogContent className="max-w-md border-pixel">
          <DialogHeader>
            <DialogTitle className="font-pixel text-lg flex items-center">
              <span className="text-2xl mr-2">{selectedIntegration?.icon}</span>
              Connect {selectedIntegration?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedIntegration && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-4">{selectedIntegration.description}</p>

                {selectedIntegration.permissions && (
                  <div className="bg-muted/50 p-3 rounded border-pixel">
                    <h4 className="font-pixel text-xs mb-2">PERMISSIONS REQUIRED</h4>
                    <ul className="space-y-1">
                      {selectedIntegration.permissions.map((permission, index) => (
                        <li key={index} className="text-xs flex items-center">
                          <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                          {permission}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {selectedIntegration.hasOAuth ? (
                <div className="space-y-4">
                  <Button onClick={handleOAuthConnect} className="w-full font-pixel text-xs">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect with OAuth
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    You'll be redirected to {selectedIntegration.name} to authorize access
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key" className="font-pixel text-xs">
                      API Key
                    </Label>
                    <div className="relative">
                      <Input
                        id="api-key"
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key..."
                        className="font-clean text-sm border-pixel pr-10"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      >
                        {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleApiKeyConnect} disabled={!apiKey.trim()} className="w-full font-pixel text-xs">
                    <Zap className="w-4 h-4 mr-2" />
                    Connect with API Key
                  </Button>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSetupModal(false)}
                  className="flex-1 font-pixel text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
