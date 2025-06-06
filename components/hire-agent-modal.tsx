"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmojiSelector } from "./emoji-selector"
import { Star, Users, ChevronLeft, ChevronRight } from "lucide-react"

interface HireAgentModalProps {
  isOpen: boolean
  onClose: () => void
}

const availableAgents = [
  {
    id: "alex",
    name: "Alex",
    role: "Content Creator",
    defaultAvatar: "✍️",
    persona: "Creative, storytelling-focused, brand-aware",
    tools: ["Figma", "Canva", "YouTube", "TikTok"],
    specialty: "Visual content & video editing",
    level: 1,
    description: "Alex turns ideas into viral content. Perfect for social media campaigns and brand storytelling.",
  },
  {
    id: "sam",
    name: "Sam",
    role: "Data Analyst",
    defaultAvatar: "📊",
    persona: "Analytical, detail-oriented, insight-driven",
    tools: ["Google Analytics", "Tableau", "SQL", "Python"],
    specialty: "Performance tracking & insights",
    level: 1,
    description: "Sam finds patterns in chaos. Turns your data into actionable business intelligence.",
  },
  {
    id: "riley",
    name: "Riley",
    role: "Customer Success",
    defaultAvatar: "🤝",
    persona: "Empathetic, solution-focused, relationship-builder",
    tools: ["Intercom", "Zendesk", "Slack", "HubSpot"],
    specialty: "Customer retention & support",
    level: 1,
    description: "Riley keeps customers happy and coming back. Your secret weapon for retention.",
  },
]

export function HireAgentModal({ isOpen, onClose }: HireAgentModalProps) {
  const [step, setStep] = useState<"select" | "customize">("select")
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [selectedEmoji, setSelectedEmoji] = useState<string>("")

  const currentAgent = availableAgents.find((a) => a.id === selectedAgent)

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgent(agentId)
    const agent = availableAgents.find((a) => a.id === agentId)
    if (agent) {
      setSelectedEmoji(agent.defaultAvatar)
    }
  }

  const handleNext = () => {
    if (selectedAgent) {
      setStep("customize")
    }
  }

  const handleBack = () => {
    setStep("select")
  }

  const handleHire = () => {
    if (selectedAgent && selectedEmoji) {
      console.log("Hiring agent:", {
        ...currentAgent,
        avatar: selectedEmoji,
      })
      // Reset state
      setStep("select")
      setSelectedAgent(null)
      setSelectedEmoji("")
      onClose()
    }
  }

  const handleClose = () => {
    setStep("select")
    setSelectedAgent(null)
    setSelectedEmoji("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl border-pixel">
        <DialogHeader>
          <DialogTitle className="font-pixel text-center text-lg">
            {step === "select" ? "CHOOSE YOUR AGENT" : "CUSTOMIZE YOUR AGENT"}
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground">
            {step === "select" ? "Select a new team member to join your crew" : "Personalize your agent's appearance"}
          </p>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4">
            {availableAgents.map((agent) => (
              <Card
                key={agent.id}
                className={`border-pixel cursor-pointer transition-all ${
                  selectedAgent === agent.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
                onClick={() => handleSelectAgent(agent.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{agent.defaultAvatar}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-pixel text-sm">{agent.name}</h3>
                          <p className="text-xs text-muted-foreground">{agent.role}</p>
                        </div>
                        <Badge variant="outline" className="font-pixel text-xs">
                          Level {agent.level}
                        </Badge>
                      </div>
                      <p className="text-sm">{agent.description}</p>
                      <div className="flex items-center space-x-2">
                        <Star className="w-3 h-3 text-primary" />
                        <span className="text-xs font-pixel">{agent.specialty}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {agent.tools.slice(0, 3).map((tool, index) => (
                          <Badge key={index} variant="secondary" className="font-pixel text-xs">
                            {tool}
                          </Badge>
                        ))}
                        {agent.tools.length > 3 && (
                          <Badge variant="secondary" className="font-pixel text-xs">
                            +{agent.tools.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleClose} className="flex-1 font-pixel text-xs">
                Cancel
              </Button>
              <Button onClick={handleNext} disabled={!selectedAgent} className="flex-1 font-pixel text-xs">
                <ChevronRight className="w-3 h-3 mr-1" />
                Customize
              </Button>
            </div>
          </div>
        )}

        {step === "customize" && currentAgent && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="font-pixel text-lg">{currentAgent.name}</h3>
              <p className="text-sm text-muted-foreground">{currentAgent.role}</p>
            </div>

            <EmojiSelector selectedEmoji={selectedEmoji} onEmojiSelect={setSelectedEmoji} />

            <div className="bg-muted/30 p-4 rounded border-pixel">
              <h4 className="font-pixel text-xs text-primary mb-2">AGENT PREVIEW</h4>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{selectedEmoji}</span>
                <div>
                  <div className="font-pixel text-sm">{currentAgent.name}</div>
                  <div className="text-xs text-muted-foreground">{currentAgent.role}</div>
                  <div className="text-xs mt-1">{currentAgent.specialty}</div>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleBack} className="flex-1 font-pixel text-xs">
                <ChevronLeft className="w-3 h-3 mr-1" />
                Back
              </Button>
              <Button onClick={handleHire} disabled={!selectedEmoji} className="flex-1 font-pixel text-xs">
                <Users className="w-3 h-3 mr-1" />
                Hire Agent
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
