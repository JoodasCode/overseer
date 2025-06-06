"use client"

interface MainNavProps {
  activeTab: "AGENTS" | "TASKS"
  setActiveTab: (tab: "AGENTS" | "TASKS") => void
}

export default function MainNav({ activeTab, setActiveTab }: MainNavProps) {
  return (
    <div className="gameboy-nav">
      <button
        className={`gameboy-nav-button ${activeTab === "AGENTS" ? "active" : ""}`}
        onClick={() => setActiveTab("AGENTS")}
      >
        AGENTS
      </button>
      <button
        className={`gameboy-nav-button ${activeTab === "TASKS" ? "active" : ""}`}
        onClick={() => setActiveTab("TASKS")}
      >
        TASKS
      </button>
      <div className="gameboy-nav-spacer"></div>
      <button className="gameboy-nav-menu">≡</button>
    </div>
  )
}
