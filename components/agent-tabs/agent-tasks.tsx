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

  const handleCreateTask = async (taskData: {
    title: string
    details: string
    priority: "low" | "medium" | "high"
    agentId: string
    xpReward: number
    category: string
  }) => {
    try {
      console.log("Creating task:", taskData)

      // Get auth token from Supabase
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert("You must be logged in to create tasks")
        return
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }

      const { task } = await response.json()
      alert(`Task created successfully: ${task.title}`)
      
    } catch (error) {
      console.error("Error creating task:", error)
      alert(error instanceof Error ? error.message : "Failed to create task")
    }
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
