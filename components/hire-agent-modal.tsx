"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmojiSelector } from "./emoji-selector"
import { Star, Users, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "@/lib/auth/supabase-auth-provider"
import { useToast } from "@/lib/hooks/use-toast"

interface HireAgentModalProps {
  isOpen: boolean
  onClose: () => void
  onAgentHired?: () => void
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

export function HireAgentModal({ isOpen, onClose, onAgentHired }: HireAgentModalProps) {
  const { session } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState<"select" | "customize">("select")
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [selectedEmoji, setSelectedEmoji] = useState<string>("")
  const [isHiring, setIsHiring] = useState(false)

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

  const handleHire = async () => {
    if (selectedAgent && selectedEmoji && currentAgent && session?.access_token) {
      setIsHiring(true);
      
      // Create optimistic agent data for immediate UI update
      const optimisticAgent = {
        id: `temp-${Date.now()}`, // Temporary ID
        name: currentAgent.name,
        role: currentAgent.role,
        avatar: selectedEmoji,
        persona: currentAgent.persona,
        tools: currentAgent.tools,
        level: currentAgent.level,
        status: "active" as const,
        lastActive: "just now",
        joinedDate: new Date().toISOString().split('T')[0],
        totalTasksCompleted: 0,
        favoriteTools: currentAgent.tools.slice(0, 2),
        tasks: [],
        memory: {
          weeklyGoals: "Getting started",
          recentLearnings: [],
          preferences: [currentAgent.persona],
          skillsUnlocked: [],
          memoryLogs: [],
        },
      };

      try {
        // Create the agent via API
        const response = await fetch('/api/agents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: currentAgent.name,
            description: currentAgent.description,
            avatar_url: selectedEmoji,
            tools: currentAgent.tools.reduce((acc, tool) => ({ ...acc, [tool.toLowerCase()]: true }), {}),
            preferences: {
              persona: currentAgent.persona,
              specialty: currentAgent.specialty,
              level: currentAgent.level
            },
            metadata: {
              role: currentAgent.role,
              defaultAvatar: currentAgent.defaultAvatar,
              hired_at: new Date().toISOString()
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log("✅ Agent hired successfully:", result.agent);
          
          // Show success toast notification
          toast({
            variant: "success",
            title: "🎉 Agent Hired Successfully!",
            description: `${currentAgent.name} has joined your team and is ready to work.`,
          });
          
          // Reset state
          setStep("select")
          setSelectedAgent(null)
          setSelectedEmoji("")
          
          // Call the callback to refetch agents and close modal
          if (onAgentHired) {
            // Add a small delay to ensure the database transaction is complete
            setTimeout(() => {
              onAgentHired()
            }, 300)
          } else {
            onClose()
            // Fallback to page refresh if no callback provided
            setTimeout(() => {
              window.location.reload()
            }, 300)
          }
        } else {
          const error = await response.json();
          console.error("❌ Failed to hire agent:", error);
          
          // Show error toast notification
          toast({
            variant: "destructive",
            title: "❌ Failed to Hire Agent",
            description: error.error || 'An unexpected error occurred. Please try again.',
          });
        }
      } catch (error) {
        console.error("❌ Error hiring agent:", error);
        
        // Show error toast notification
        toast({
          variant: "destructive",
          title: "❌ Network Error",
          description: "Failed to hire agent. Please check your connection and try again.",
        });
      } finally {
        setIsHiring(false);
      }
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
              <Button onClick={handleHire} disabled={!selectedEmoji || isHiring} className="flex-1 font-pixel text-xs">
                <Users className="w-3 h-3 mr-1" />
                {isHiring ? "Hiring..." : "Hire Agent"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
