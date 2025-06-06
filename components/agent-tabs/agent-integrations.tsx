import type { Agent } from "@/lib/types"

interface AgentIntegrationsProps {
  agent: Agent
}

export default function AgentIntegrations({ agent }: AgentIntegrationsProps) {
  return (
    <div className="agent-integrations">
      <h3 className="pixel-heading">Integrations</h3>
      <div className="integrations-list">
        {agent.tools.map((tool, index) => (
          <div key={index} className="integration-item">
            <div className="integration-icon">{tool.charAt(0)}</div>
            <div className="integration-name">{tool}</div>
            <div className="integration-status connected">●</div>
          </div>
        ))}
      </div>
      <button className="pixel-button">+ Add Tool</button>
    </div>
  )
}
