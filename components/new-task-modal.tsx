"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Target, User, Brain } from "lucide-react"
import type { Agent } from "@/lib/types"

interface NewTaskModalProps {
  isOpen: boolean
  onClose: () => void
  agents: Agent[]
  selectedAgentId?: string
  onCreateTask: (task: {
    title: string
    details: string
    priority: "low" | "medium" | "high"
    agentId: string
    xpReward: number
    category: string
  }) => void
}

const taskCategories = [
  "Marketing",
  "PR & Communications",
  "Sales",
  "HR & Recruiting",
  "Operations",
  "Content Creation",
  "Analytics",
  "Customer Support",
  "Development",
  "General",
]

const priorityConfig = {
  low: { color: "bg-green-500", label: "Low Priority", xp: 20 },
  medium: { color: "bg-yellow-500", label: "Medium Priority", xp: 35 },
  high: { color: "bg-red-500", label: "High Priority", xp: 50 },
}

export function NewTaskModal({ isOpen, onClose, agents, selectedAgentId, onCreateTask }: NewTaskModalProps) {
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [agentId, setAgentId] = useState(selectedAgentId || "")
  const [category, setCategory] = useState("General")

  const selectedAgent = agents.find((a) => a.id === agentId)
  const calculatedXP = priorityConfig[priority].xp

  const handleSubmit = () => {
    if (!title.trim() || !agentId) return

    onCreateTask({
      title: title.trim(),
      details: details.trim(),
      priority,
      agentId,
      xpReward: calculatedXP,
      category,
    })

    // Reset form
    setTitle("")
    setDetails("")
    setPriority("medium")
    setAgentId(selectedAgentId || "")
    setCategory("General")
    onClose()
  }

  const isValid = title.trim() && agentId

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-pixel">
        <DialogHeader>
          <DialogTitle className="font-pixel text-lg text-primary flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            CREATE NEW TASK
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title" className="font-pixel text-xs text-primary">
              TASK TITLE *
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="font-clean text-sm border-pixel"
              maxLength={100}
            />
            <div className="text-xs text-muted-foreground font-clean text-right">{title.length}/100</div>
          </div>

          {/* Task Details */}
          <div className="space-y-2">
            <Label htmlFor="task-details" className="font-pixel text-xs text-primary">
              DETAILS & CONTEXT
            </Label>
            <Textarea
              id="task-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide context, requirements, or additional information..."
              className="font-clean text-sm border-pixel min-h-[80px]"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground font-clean text-right">{details.length}/500</div>
          </div>

          <div className="space-y-4">
            {/* Agent Assignment */}
            <div className="space-y-2">
              <Label className="font-pixel text-xs text-primary flex items-center">
                <User className="w-3 h-3 mr-1" />
                ASSIGN TO AGENT *
              </Label>
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger className="border-pixel font-clean">
                  <SelectValue placeholder="Choose an agent..." />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center space-x-2 w-full">
                        <span>{agent.avatar}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-pixel text-xs truncate">{agent.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{agent.role}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAgent && (
                <div className="bg-muted/50 p-2 rounded border-pixel">
                  <div className="text-xs font-clean">
                    <span className="font-pixel">Specialties:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedAgent.memory.preferences.slice(0, 3).map((pref, index) => (
                        <Badge key={index} variant="outline" className="font-pixel text-xs">
                          {pref}
                        </Badge>
                      ))}
                      {selectedAgent.memory.preferences.length > 3 && (
                        <Badge variant="outline" className="font-pixel text-xs">
                          +{selectedAgent.memory.preferences.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="font-pixel text-xs text-primary flex items-center">
                <Target className="w-3 h-3 mr-1" />
                CATEGORY
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border-pixel font-clean">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {taskCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority Selection */}
          <div className="space-y-3">
            <Label className="font-pixel text-xs text-primary">PRIORITY LEVEL</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(priorityConfig) as Array<keyof typeof priorityConfig>).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`
                    p-2 border-2 rounded transition-all font-clean text-sm
                    ${
                      priority === p
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-pixel hover:border-primary/50"
                    }
                  `}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <div className={`w-3 h-3 rounded-full ${priorityConfig[p].color}`} />
                    <span className="font-pixel text-xs">{p.toUpperCase()}</span>
                    <div className="text-xs text-muted-foreground">+{priorityConfig[p].xp}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* XP Display */}
          <div className="bg-primary/10 p-4 rounded border-pixel">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="w-4 h-4 text-primary" />
              <span className="font-pixel text-xs text-primary">SMART XP CALCULATION</span>
            </div>
            <p className="text-sm font-clean text-muted-foreground">
              XP will be automatically calculated based on task complexity and priority level.
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <Badge variant="default" className="font-pixel text-xs">
                +{calculatedXP} XP on completion
              </Badge>
              <span className="text-xs font-clean text-muted-foreground">
                Fair progression for {selectedAgent?.name || "agent"}
              </span>
            </div>
          </div>

          {/* Task Preview */}
          {isValid && (
            <div className="bg-muted/30 p-3 rounded border-pixel">
              <h4 className="font-pixel text-xs text-primary mb-2">TASK PREVIEW</h4>
              <div className="space-y-2">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="font-clean text-sm font-medium flex-1 pr-2">{title}</span>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Badge variant="outline" className="font-pixel text-xs">
                        {priority}
                      </Badge>
                      <Badge variant="default" className="font-pixel text-xs">
                        +{calculatedXP}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-clean text-muted-foreground">
                    <span>{selectedAgent?.avatar}</span>
                    <span className="truncate">{selectedAgent?.name}</span>
                    <span>•</span>
                    <span className="truncate">{category}</span>
                  </div>
                </div>
                {details && <p className="text-sm font-clean text-muted-foreground mt-2 line-clamp-2">{details}</p>}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1 font-pixel text-xs">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid} className="flex-1 font-pixel text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Create Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
