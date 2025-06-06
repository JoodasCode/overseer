"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { useRef } from "react"
import type { Agent } from "@/lib/types"

interface AgentTabsProps {
  agents: Agent[]
  selectedAgent: Agent
  onSelectAgent: (agent: Agent) => void
  onViewProfile: (agent: Agent) => void
}

export function AgentTabs({ agents, selectedAgent, onSelectAgent, onViewProfile }: AgentTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" })
    }
  }

  return (
    <div className="relative border-b border-pixel bg-background">
      {/* Scroll buttons */}
      {agents.length > 3 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Scrollable tabs container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide px-8"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`
              flex items-center space-x-2 px-3 py-3 border-b-2 transition-colors relative group flex-shrink-0 min-w-0
              ${
                selectedAgent.id === agent.id
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-transparent hover:bg-muted/50"
              }
            `}
          >
            <button onClick={() => onSelectAgent(agent)} className="flex items-center space-x-2 min-w-0">
              <span className="text-lg flex-shrink-0">{agent.avatar}</span>
              <div className="text-left min-w-0">
                <div className="font-pixel text-xs font-medium truncate max-w-[80px]">{agent.name}</div>
                <div className="text-xs text-muted-foreground font-clean truncate max-w-[100px]">{agent.role}</div>
              </div>
              <Badge
                variant={agent.status === "active" ? "default" : "secondary"}
                className="font-pixel text-xs flex-shrink-0"
              >
                {agent.status}
              </Badge>
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewProfile(agent)}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 h-6 w-6 p-0"
            >
              <Eye className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
