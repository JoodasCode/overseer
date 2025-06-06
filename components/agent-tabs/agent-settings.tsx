import type { Agent } from "@/lib/types"

interface AgentSettingsProps {
  agent: Agent
}

export default function AgentSettings({ agent }: AgentSettingsProps) {
  return (
    <div className="agent-settings">
      <h3 className="pixel-heading">Settings</h3>
      <div className="settings-list">
        <div className="setting-item">
          <div className="setting-label">Personality</div>
          <div className="setting-value">{agent.persona}</div>
          <button className="setting-edit">Edit</button>
        </div>
        <div className="setting-item">
          <div className="setting-label">Activity Hours</div>
          <div className="setting-value">9am - 5pm</div>
          <button className="setting-edit">Edit</button>
        </div>
        <div className="setting-item">
          <div className="setting-label">Autonomy Level</div>
          <div className="setting-value">Medium</div>
          <button className="setting-edit">Edit</button>
        </div>
      </div>
    </div>
  )
}
