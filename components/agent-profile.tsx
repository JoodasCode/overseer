"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Trophy, Zap, Brain, Clock, Star, MessageSquare, Settings, Users, BarChart3 } from "lucide-react"
import type { Agent } from "@/lib/types"

interface AgentProfileProps {
  agent: Agent
  onBack: () => void
}

// Department colors and icons
const DEPARTMENT_INFO = {
  communications: {
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: MessageSquare,
    label: "Communications"
  },
  hr: {
    color: "bg-green-500/10 text-green-600 border-green-500/20", 
    icon: Users,
    label: "Human Resources"
  },
  finance: {
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    icon: BarChart3, 
    label: "Finance"
  },
  product: {
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    icon: Settings,
    label: "Product"
  }
}

export function AgentProfile({ agent, onBack }: AgentProfileProps) {
  // Get department info from metadata or preferences
  const department = agent.metadata?.department || agent.preferences?.department || 'communications'
  const deptInfo = DEPARTMENT_INFO[department as keyof typeof DEPARTMENT_INFO] || DEPARTMENT_INFO.communications
  const DeptIcon = deptInfo.icon
  
  // Get computed values from the new schema
  const role = agent.preferences?.role || agent.role || 'Agent'
  const avatar = agent.avatar_url || agent.avatar || '🤖'
  const tone = agent.preferences?.tone || agent.tone || null
  const voice_style = agent.preferences?.voice_style || agent.voice_style || null
  const level = agent.level || 1
  const totalTasksCompleted = agent.totalTasksCompleted || 0
  const joinedDate = new Date(agent.created_at).toLocaleDateString() || agent.joinedDate
  const lastActive = new Date(agent.updated_at).toLocaleDateString() || agent.lastActive
  const tools_preferred = agent.preferences?.tools_preferred || agent.tools_preferred || agent.tools || []
  const favoriteTools = agent.favoriteTools || agent.tools?.slice(0, 3) || []
  const memory = agent.memory || { skillsUnlocked: [], recentLearnings: [], preferences: [], memoryLogs: [] }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack} className="font-clean">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Workspace
        </Button>
      </div>

      {/* Agent Header */}
      <div className="pixel-card p-6">
        <div className="flex items-start space-x-6">
          <span className="text-6xl">{avatar}</span>
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h1 className="font-pixel text-2xl text-primary">{agent.name}</h1>
                <Badge className={`font-pixel text-xs ${deptInfo.color}`}>
                  <DeptIcon className="w-3 h-3 mr-1" />
                  {deptInfo.label}
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground font-clean">{role}</p>
              {(tone || voice_style) && (
                <div className="flex items-center space-x-4 text-sm">
                  {tone && (
                    <Badge variant="outline" className="font-clean text-xs">
                      Tone: {tone}
                    </Badge>
                  )}
                  {voice_style && (
                    <Badge variant="outline" className="font-clean text-xs">
                      Style: {voice_style}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-pixel text-foreground">{level}</div>
                <div className="text-xs text-muted-foreground font-clean">Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-pixel text-foreground">{totalTasksCompleted}</div>
                <div className="text-xs text-muted-foreground font-clean">Tasks Done</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-pixel text-foreground">{memory.skillsUnlocked.length}</div>
                <div className="text-xs text-muted-foreground font-clean">Skills</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-pixel text-foreground">{level * 250}</div>
                <div className="text-xs text-muted-foreground font-clean">Total XP</div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm font-clean">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Joined {joinedDate}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Last active {lastActive}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills & Achievements */}
        <div className="space-y-6">
          <div className="pixel-card p-6">
            <div className="flex items-center mb-4">
              <Trophy className="w-4 h-4 mr-2 text-primary" />
              <h3 className="font-pixel text-sm text-primary">Skills Unlocked</h3>
            </div>
            <div className="space-y-2">
              {(agent.memory?.skillsUnlocked || []).map((skill, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span className="font-clean text-sm">{skill}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pixel-card p-6">
            <div className="flex items-center mb-4">
              <Zap className="w-4 h-4 mr-2 text-primary" />
              <h3 className="font-pixel text-sm text-primary">Tool Preferences</h3>
            </div>
            
            {tools_preferred && tools_preferred.length > 0 && (
              <div className="mb-4">
                <h4 className="font-pixel text-xs text-muted-foreground mb-2">Preferred Tools</h4>
                <div className="flex flex-wrap gap-2">
                  {tools_preferred.map((tool: string, index: number) => (
                    <Badge key={index} variant="default" className="font-clean text-xs">
                      ⭐ {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <h4 className="font-pixel text-xs text-muted-foreground mb-2">Favorite Tools</h4>
              <div className="flex flex-wrap gap-2">
                {favoriteTools.map((tool: string, index: number) => (
                  <Badge key={index} variant="outline" className="font-clean text-xs">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-pixel text-xs text-muted-foreground mb-2">All Available Tools</h4>
              <div className="flex flex-wrap gap-1">
                {agent.tools.map((tool, index) => (
                  <Badge key={index} variant="secondary" className="font-clean text-xs">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Memory & Learning */}
        <div className="space-y-6">
          <div className="pixel-card p-6">
            <div className="flex items-center mb-4">
              <Brain className="w-4 h-4 mr-2 text-primary" />
              <h3 className="font-pixel text-sm text-primary">Memory Logs</h3>
            </div>
            <div className="space-y-3">
              {agent.memory.memoryLogs.map((log) => (
                <div key={log.id} className="border-l-2 border-primary/30 pl-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant={log.type === "achievement" ? "default" : "outline"} className="font-pixel text-xs">
                      {log.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-clean">{log.timestamp}</span>
                  </div>
                  <p className="text-sm font-clean">{log.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pixel-card p-6">
            <h3 className="font-pixel text-sm text-primary mb-4">Recent Learnings</h3>
            <div className="space-y-2">
              {agent.memory.recentLearnings.map((learning, index) => (
                <div key={index} className="flex items-start text-sm font-clean">
                  <span className="text-primary mr-2">•</span>
                  <span>{learning}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pixel-card p-6">
            <h3 className="font-pixel text-sm text-primary mb-4">Personality Traits</h3>
            <div className="space-y-4">
              <div>
                <span className="font-pixel text-xs text-muted-foreground">Core Persona:</span>
                <p className="font-clean text-sm mt-1">{agent.persona}</p>
              </div>
              
              {agent.system_prompt && (
                <div>
                  <span className="font-pixel text-xs text-muted-foreground">System Directive:</span>
                  <p className="font-clean text-sm mt-1 text-muted-foreground italic">
                    {agent.system_prompt.length > 150 
                      ? `${agent.system_prompt.substring(0, 150)}...` 
                      : agent.system_prompt}
                  </p>
                </div>
              )}

              {agent.personality_config && Object.keys(agent.personality_config).length > 0 && (
                <div>
                  <span className="font-pixel text-xs text-muted-foreground">Personality Config:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(agent.personality_config).map(([key, value], index) => (
                      <Badge key={index} variant="outline" className="font-clean text-xs">
                        {key}: {String(value)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <span className="font-pixel text-xs text-muted-foreground">Preferences:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {agent.memory.preferences.map((pref, index) => (
                    <Badge key={index} variant="outline" className="font-clean text-xs">
                      {pref}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
