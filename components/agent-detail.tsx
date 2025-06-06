"use client"

import type { Agent } from "@/lib/types"
import PixelAvatar from "./pixel-avatar"
import AgentTasks from "./agent-tabs/agent-tasks"
import AgentMemory from "./agent-tabs/agent-memory"
import AgentIntegrations from "./agent-tabs/agent-integrations"
import AgentSettings from "./agent-tabs/agent-settings"

interface AgentDetailProps {
  agent: Agent
  onBack: () => void
  activeTab: "TASKS" | "MEMORY" | "INTEGRATIONS" | "SETTINGS"
  setActiveTab: (tab: "TASKS" | "MEMORY" | "INTEGRATIONS" | "SETTINGS") => void
}

export default function AgentDetail({ agent, onBack, activeTab, setActiveTab }: AgentDetailProps) {
  return (
    <div className="agent-detail">
      <div className="agent-header">
        <div className="agent-header-content">
          <PixelAvatar agent={agent} size="large" />
          <div className="agent-info">
            <h2 className="agent-name">{agent.name}</h2>
            <p className="agent-role">{agent.role}</p>
          </div>
        </div>
      </div>

      <div className="agent-tabs">
        <button className={`agent-tab ${activeTab === "TASKS" ? "active" : ""}`} onClick={() => setActiveTab("TASKS")}>
          TASKS
        </button>
        <button
          className={`agent-tab ${activeTab === "MEMORY" ? "active" : ""}`}
          onClick={() => setActiveTab("MEMORY")}
        >
          MEMORY
        </button>
        <button
          className={`agent-tab ${activeTab === "INTEGRATIONS" ? "active" : ""}`}
          onClick={() => setActiveTab("INTEGRATIONS")}
        >
          INTEGRATIONS
        </button>
      </div>

      <div className="agent-content">
        <div className="agent-content-tabs">
          <button
            className={`agent-content-tab ${activeTab === "TASKS" ? "active" : ""}`}
            onClick={() => setActiveTab("TASKS")}
          >
            TASKS
          </button>
          <button
            className={`agent-content-tab ${activeTab === "MEMORY" ? "active" : ""}`}
            onClick={() => setActiveTab("MEMORY")}
          >
            MEMORY
          </button>
          <button
            className={`agent-content-tab ${activeTab === "SETTINGS" ? "active" : ""}`}
            onClick={() => setActiveTab("SETTINGS")}
          >
            SETTINGS
          </button>
        </div>

        <div className="agent-content-body">
          {activeTab === "TASKS" && <AgentTasks agent={agent} />}
          {activeTab === "MEMORY" && <AgentMemory agent={agent} />}
          {activeTab === "INTEGRATIONS" && <AgentIntegrations agent={agent} />}
          {activeTab === "SETTINGS" && <AgentSettings agent={agent} />}
        </div>
      </div>

      <button className="back-button" onClick={onBack}>
        ← Back
      </button>
    </div>
  )
}
