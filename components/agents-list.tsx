"use client"

import type { Agent } from "@/lib/types"
import PixelAvatar from "./pixel-avatar"

interface AgentsListProps {
  agents: Agent[]
  onSelectAgent: (agent: Agent) => void
}

export default function AgentsList({ agents, onSelectAgent }: AgentsListProps) {
  return (
    <div className="agents-grid">
      {agents.map((agent) => (
        <button key={agent.id} className="agent-card" onClick={() => onSelectAgent(agent)}>
          <PixelAvatar agent={agent} />
          <div className="agent-name">{agent.name}</div>
        </button>
      ))}
    </div>
  )
}
