import type { Agent } from "@/lib/types"

interface AgentMemoryProps {
  agent: Agent
}

export default function AgentMemory({ agent }: AgentMemoryProps) {
  return (
    <div className="agent-memory">
      <h3 className="pixel-heading">Memory</h3>
      <div className="memory-stats">
        <div className="memory-stat">
          <div className="stat-label">Level</div>
          <div className="stat-value">{agent.level}</div>
        </div>
        <div className="memory-stat">
          <div className="stat-label">Experience</div>
          <div className="stat-value">
            <div className="xp-bar">
              <div className="xp-progress" style={{ width: `${agent.level * 20}%` }}></div>
            </div>
          </div>
        </div>
      </div>
      <div className="memory-items">
        <div className="memory-item">
          <div className="memory-title">Weekly Goals</div>
          <div className="memory-content">{agent.name === "Jamie" ? "3 posts, 1 newsletter" : "Set goals..."}</div>
        </div>
        <div className="memory-item">
          <div className="memory-title">Persona</div>
          <div className="memory-content">{agent.persona}</div>
        </div>
      </div>
      <button className="pixel-button">Train Memory</button>
    </div>
  )
}
