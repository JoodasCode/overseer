"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Zap,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Volume2,
  Brain,
  DollarSign,
} from "lucide-react"
import type { LLMProvider } from "@/lib/types"

const llmProviders: LLMProvider[] = [
  { id: "openai-gpt4", name: "OpenAI GPT-4", model: "gpt-4", status: "active", costPer1k: 0.03 },
  { id: "openai-gpt35", name: "OpenAI GPT-3.5", model: "gpt-3.5-turbo", status: "inactive", costPer1k: 0.002 },
  { id: "anthropic-claude", name: "Anthropic Claude", model: "claude-3", status: "inactive", costPer1k: 0.025 },
  { id: "mistral-large", name: "Mistral Large", model: "mistral-large", status: "inactive", costPer1k: 0.02 },
]

export function SettingsPage() {
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [autoLevelUp, setAutoLevelUp] = useState(true)
  const [smartAssignment, setSmartAssignment] = useState(true)
  const [gameboyTheme, setGameboyTheme] = useState(true)
  const [pixelAnimations, setPixelAnimations] = useState(true)
  const [selectedLLM, setSelectedLLM] = useState("openai-gpt4")

  const handleToggle = (setter: (value: boolean) => void, currentValue: boolean) => {
    setter(!currentValue)
    // Add success animation
    const element = document.activeElement as HTMLElement
    if (element) {
      element.classList.add("toggle-success")
      setTimeout(() => element.classList.remove("toggle-success"), 300)
    }
  }

  const currentProvider = llmProviders.find((p) => p.id === selectedLLM)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-pixel text-2xl text-primary">System Settings</h1>
        <p className="text-muted-foreground font-clean">Configure your AGENTS OS workspace</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="font-pixel">
          <TabsTrigger value="general" className="text-xs">
            GENERAL
          </TabsTrigger>
          <TabsTrigger value="agents" className="text-xs">
            AGENTS
          </TabsTrigger>
          <TabsTrigger value="llm" className="text-xs">
            LLM
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">
            NOTIFICATIONS
          </TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs">
            INTEGRATIONS
          </TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">
            ADVANCED
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="pixel-card p-6">
              <div className="flex items-center mb-4">
                <User className="w-4 h-4 mr-2 text-primary" />
                <h3 className="font-pixel text-sm text-primary">Organization Profile</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name" className="font-pixel text-xs">
                    Organization Name
                  </Label>
                  <Input id="org-name" defaultValue="Acme Corp" className="font-clean text-sm border-pixel" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-email" className="font-pixel text-xs">
                    Contact Email
                  </Label>
                  <Input id="org-email" defaultValue="admin@acme.com" className="font-clean text-sm border-pixel" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="font-pixel text-xs">
                    Timezone
                  </Label>
                  <Input id="timezone" defaultValue="UTC-8 (Pacific)" className="font-clean text-sm border-pixel" />
                </div>
                <button className="pixel-button font-pixel text-xs px-4 py-2">Save Changes</button>
              </div>
            </div>

            <div className="pixel-card p-6">
              <div className="flex items-center mb-4">
                <Palette className="w-4 h-4 mr-2 text-primary" />
                <h3 className="font-pixel text-sm text-primary">Appearance</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-pixel text-xs">GameBoy Theme</Label>
                    <p className="text-xs text-muted-foreground font-clean">Classic green pixel aesthetic</p>
                  </div>
                  <Switch
                    checked={gameboyTheme}
                    onCheckedChange={() => handleToggle(setGameboyTheme, gameboyTheme)}
                    className="switch-enhanced"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-pixel text-xs">Pixel Animations</Label>
                    <p className="text-xs text-muted-foreground font-clean">Level-up and achievement effects</p>
                  </div>
                  <Switch
                    checked={pixelAnimations}
                    onCheckedChange={() => handleToggle(setPixelAnimations, pixelAnimations)}
                    className="switch-enhanced"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-pixel text-xs">Sound Effects</Label>
                    <p className="text-xs text-muted-foreground font-clean">Audio feedback for actions</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={soundEnabled}
                      onCheckedChange={() => handleToggle(setSoundEnabled, soundEnabled)}
                      className="switch-enhanced"
                    />
                    {soundEnabled && <Volume2 className="w-3 h-3 text-primary pixel-bounce" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="pixel-card p-6">
              <div className="flex items-center mb-4">
                <Settings className="w-4 h-4 mr-2 text-primary" />
                <h3 className="font-pixel text-sm text-primary">Default Agent Settings</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-pixel text-xs">Auto-Level Up</Label>
                    <p className="text-xs text-muted-foreground font-clean">
                      Automatically level up agents when XP threshold is reached
                    </p>
                  </div>
                  <Switch
                    checked={autoLevelUp}
                    onCheckedChange={() => handleToggle(setAutoLevelUp, autoLevelUp)}
                    className="switch-enhanced"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-pixel text-xs">Smart Task Assignment</Label>
                    <p className="text-xs text-muted-foreground font-clean">AI suggests optimal agent for new tasks</p>
                  </div>
                  <Switch
                    checked={smartAssignment}
                    onCheckedChange={() => handleToggle(setSmartAssignment, smartAssignment)}
                    className="switch-enhanced"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-pixel text-xs">Default Autonomy Level</Label>
                  <div className="flex space-x-2">
                    <Badge
                      variant="outline"
                      className="font-pixel text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    >
                      Low
                    </Badge>
                    <Badge variant="default" className="font-pixel text-xs">
                      Medium
                    </Badge>
                    <Badge
                      variant="outline"
                      className="font-pixel text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    >
                      High
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="pixel-card p-6">
              <div className="flex items-center mb-4">
                <Zap className="w-4 h-4 mr-2 text-primary" />
                <h3 className="font-pixel text-sm text-primary">Performance Settings</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-pixel text-xs">Max Concurrent Tasks per Agent</Label>
                  <Input defaultValue="5" className="font-clean text-sm border-pixel" />
                </div>
                <div className="space-y-2">
                  <Label className="font-pixel text-xs">Task Timeout (hours)</Label>
                  <Input defaultValue="24" className="font-clean text-sm border-pixel" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-pixel text-xs">Memory Optimization</Label>
                    <p className="text-xs text-muted-foreground font-clean">Automatically clean old memories</p>
                  </div>
                  <Switch defaultChecked className="switch-enhanced" />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="llm" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="pixel-card p-6">
              <div className="flex items-center mb-4">
                <Brain className="w-4 h-4 mr-2 text-primary" />
                <h3 className="font-pixel text-sm text-primary">LLM Provider</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-pixel text-xs">Active Model</Label>
                  <Select value={selectedLLM} onValueChange={setSelectedLLM}>
                    <SelectTrigger className="border-pixel font-clean">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {llmProviders.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{provider.name}</span>
                            <Badge variant="outline" className="ml-2 font-pixel text-xs">
                              ${provider.costPer1k}/1k
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentProvider && (
                  <div className="bg-muted/50 p-3 rounded border-pixel">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-pixel text-xs">Current: {currentProvider.name}</span>
                      <Badge variant="default" className="font-pixel text-xs">
                        {currentProvider.status}
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs font-clean text-muted-foreground">
                      <DollarSign className="w-3 h-3 mr-1" />${currentProvider.costPer1k} per 1,000 tokens
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pixel-card p-6">
              <div className="flex items-center mb-4">
                <Zap className="w-4 h-4 mr-2 text-primary" />
                <h3 className="font-pixel text-sm text-primary">Model Configuration</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-pixel text-xs">Temperature</Label>
                  <Input defaultValue="0.7" className="font-clean text-sm border-pixel" />
                  <p className="text-xs text-muted-foreground font-clean">Controls creativity (0.0 - 1.0)</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-pixel text-xs">Max Tokens</Label>
                  <Input defaultValue="2048" className="font-clean text-sm border-pixel" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-pixel text-xs">Streaming Responses</Label>
                    <p className="text-xs text-muted-foreground font-clean">Real-time response generation</p>
                  </div>
                  <Switch defaultChecked className="switch-enhanced" />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="pixel-card p-6">
            <div className="flex items-center mb-4">
              <Bell className="w-4 h-4 mr-2 text-primary" />
              <h3 className="font-pixel text-sm text-primary">Notification Preferences</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-pixel text-xs text-primary">Agent Activity</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-clean">Task completions</Label>
                    <Switch defaultChecked className="switch-enhanced" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-clean">Level ups</Label>
                    <Switch defaultChecked className="switch-enhanced" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-clean">Skill unlocks</Label>
                    <Switch defaultChecked className="switch-enhanced" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-clean">Error alerts</Label>
                    <Switch defaultChecked className="switch-enhanced" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-pixel text-xs text-primary">System Updates</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-clean">Weekly reports</Label>
                    <Switch defaultChecked className="switch-enhanced" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-clean">Feature updates</Label>
                    <Switch className="switch-enhanced" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-clean">Maintenance alerts</Label>
                    <Switch defaultChecked className="switch-enhanced" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-clean">Security notifications</Label>
                    <Switch defaultChecked className="switch-enhanced" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Gmail", status: "connected", icon: "📧" },
              { name: "Notion", status: "connected", icon: "📝" },
              { name: "Slack", status: "connected", icon: "💬" },
              { name: "LinkedIn", status: "connected", icon: "💼" },
              { name: "HubSpot", status: "connected", icon: "🎯" },
              { name: "Mailchimp", status: "connected", icon: "📮" },
              { name: "Zoom", status: "connected", icon: "📹" },
              { name: "Calendly", status: "disconnected", icon: "📅" },
              { name: "Zapier", status: "connected", icon: "⚡" },
            ].map((integration) => (
              <div key={integration.name} className="pixel-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <h4 className="font-pixel text-sm text-primary">{integration.name}</h4>
                      <p className="text-xs text-muted-foreground font-clean capitalize">{integration.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${integration.status === "connected" ? "status-active" : "status-offline"}`}
                    />
                    <Button variant="ghost" size="sm">
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="pixel-card p-6">
              <div className="flex items-center mb-4">
                <Database className="w-4 h-4 mr-2 text-primary" />
                <h3 className="font-pixel text-sm text-primary">Data Management</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-pixel text-xs">Data Retention (days)</Label>
                  <Input defaultValue="90" className="font-clean text-sm border-pixel" />
                </div>
                <div className="flex space-x-2">
                  <button className="pixel-button font-pixel text-xs px-3 py-2">
                    <Download className="w-3 h-3 mr-1" />
                    Export Data
                  </button>
                  <button className="pixel-button font-pixel text-xs px-3 py-2">
                    <Upload className="w-3 h-3 mr-1" />
                    Import Data
                  </button>
                </div>
              </div>
            </div>

            <div className="pixel-card p-6">
              <div className="flex items-center mb-4">
                <Shield className="w-4 h-4 mr-2 text-primary" />
                <h3 className="font-pixel text-sm text-primary">Security & Memory Control</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-pixel text-xs">Two-Factor Authentication</Label>
                    <p className="text-xs text-muted-foreground font-clean">Extra security for your account</p>
                  </div>
                  <Switch className="switch-enhanced" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-pixel text-xs">API Access</Label>
                    <p className="text-xs text-muted-foreground font-clean">Allow external API connections</p>
                  </div>
                  <Switch defaultChecked className="switch-enhanced" />
                </div>
                <button className="pixel-button font-pixel text-xs px-4 py-2 mb-4">Generate API Key</button>

                {/* Panic Button Section */}
                <div className="border-t border-pixel pt-4">
                  <h4 className="font-pixel text-xs text-destructive mb-3">🧠 Memory Controls</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      <button className="panic-button text-xs px-3 py-2">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Wipe Agent Memory
                      </button>
                      <button className="panic-button text-xs px-3 py-2">
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Reset to Job Description
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground font-clean">
                      Emergency controls for agent memory management
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
