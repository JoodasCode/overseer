"use client"

import { useState } from "react"
import { NewTaskModal } from "../new-task-modal"
import type { Agent } from "@/lib/types"

interface AgentTasksProps {
  agent: Agent
  agents?: Agent[]
}

export default function AgentTasks({ agent, agents = [agent] }: AgentTasksProps) {
  const [showNewTask, setShowNewTask] = useState(false)

  const handleCreateTask = (taskData: {
    title: string
    details: string
    priority: "low" | "medium" | "high"
    agentId: string
    xpReward: number
    category: string
  }) => {
    console.log("Creating task:", taskData)
  }

  return (
    <div className="agent-tasks">
      <h3 className="pixel-heading">Tasks</h3>
      <div className="tasks-list">
        {agent.tasks.map((task) => (
          <div key={task.id} className={`task-item task-${task.status}`}>
            <div className="task-title">{task.title}</div>
            <div className="task-status">{task.status}</div>
            <div className="task-details">{task.details}</div>
          </div>
        ))}
      </div>
      <button className="pixel-button" onClick={() => setShowNewTask(true)}>
        + New Task
      </button>

      <NewTaskModal
        isOpen={showNewTask}
        onClose={() => setShowNewTask(false)}
        agents={agents}
        selectedAgentId={agent.id}
        onCreateTask={handleCreateTask}
      />
    </div>
  )
}
