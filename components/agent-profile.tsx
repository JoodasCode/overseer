"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Trophy, Zap, Brain, Clock, Star } from "lucide-react"
import type { Agent } from "@/lib/types"

interface AgentProfileProps {
  agent: Agent
  onBack: () => void
}

export function AgentProfile({ agent, onBack }: AgentProfileProps) {
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
          <span className="text-6xl">{agent.avatar}</span>
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="font-pixel text-2xl text-primary">{agent.name}</h1>
              <p className="text-lg text-muted-foreground font-clean">{agent.role}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-pixel text-foreground">{agent.level}</div>
                <div className="text-xs text-muted-foreground font-clean">Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-pixel text-foreground">{agent.totalTasksCompleted}</div>
                <div className="text-xs text-muted-foreground font-clean">Tasks Done</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-pixel text-foreground">{(agent.memory?.skillsUnlocked || []).length}</div>
                <div className="text-xs text-muted-foreground font-clean">Skills</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-pixel text-foreground">{agent.level * 250}</div>
                <div className="text-xs text-muted-foreground font-clean">Total XP</div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm font-clean">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Joined {agent.joinedDate}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Last active {agent.lastActive}</span>
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
              <h3 className="font-pixel text-sm text-primary">Favorite Tools</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {agent.favoriteTools.map((tool, index) => (
                <Badge key={index} variant="outline" className="font-clean text-xs">
                  {tool}
                </Badge>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="font-pixel text-xs text-muted-foreground mb-2">All Tools</h4>
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
            <div className="space-y-2">
              <div>
                <span className="font-pixel text-xs text-muted-foreground">Core Persona:</span>
                <p className="font-clean text-sm mt-1">{agent.persona}</p>
              </div>
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
