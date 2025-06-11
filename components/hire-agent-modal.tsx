"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Users } from "lucide-react"
import { useAuth } from "@/lib/auth/supabase-auth-provider"
import { useToast } from "@/lib/hooks/use-toast"

interface HireAgentModalProps {
  isOpen: boolean
  onClose: () => void
  onAgentHired?: () => void
}

const availableAgents = [
  // Core Communications Department Templates Only
  {
    id: "alex-comms",
    name: "Alex",
    role: "Strategic Coordinator",
    template: "alex",
    persona: "Calm, articulate, and tactically creative. Thinks long-term. Speaks with clarity and structure.",
    tools: ["Notion", "Gmail", "Google Calendar", "Slack"],
    specialty: "Campaign planning & strategic coordination",
    level: 1,
    description: "Strategic communications leader who coordinates campaigns and delegates tasks with calm authority.",
    department: "communications",
  },
  {
    id: "dana-comms",
    name: "Dana",
    role: "Visual Assistant",
    template: "dana",
    persona: "Quirky, visual, expressive. Uses emojis and fast, enthusiastic language.",
    tools: ["Canva", "Figma", "Slack"],
    specialty: "Visual content creation & design",
    level: 1,
    description: "Creative visual assistant who designs engaging content with quirky, expressive energy.",
    department: "communications",
  },
  {
    id: "jamie-comms",
    name: "Jamie",
    role: "Internal Liaison",
    template: "jamie",
    persona: "Friendly, empathetic, diplomatic. Prioritizes team morale and clarity.",
    tools: ["Slack", "Gmail", "Notion"],
    specialty: "Internal communications & team morale",
    level: 1,
    description: "Internal liaison who maintains team morale and clarity with empathetic, diplomatic communication.",
    department: "communications",
  },
  {
    id: "riley-comms",
    name: "Riley",
    role: "Data Analyst",
    template: "riley",
    persona: "Analytical, precise, neutral tone. Speaks with graphs and impact metrics.",
    tools: ["Google Sheets", "Analytics"],
    specialty: "PR analytics & performance tracking",
    level: 1,
    description: "Analytical expert who tracks metrics and performance with data-driven precision.",
    department: "communications",
  },
  {
    id: "toby-comms",
    name: "Toby",
    role: "Support Coordinator",
    template: "toby",
    persona: "Quick-thinking, slightly anxious but extremely thorough. Speaks fast but factually.",
    tools: ["Slack", "Gmail", "Discord"],
    specialty: "Crisis management & rapid response",
    level: 1,
    description: "Rapid response coordinator for crisis management who thinks quickly and responds thoroughly.",
    department: "communications",
  },
]

export function HireAgentModal({ isOpen, onClose, onAgentHired }: HireAgentModalProps) {
  const { session } = useAuth()
  const { toast } = useToast()
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [isHiring, setIsHiring] = useState(false)

  const currentAgent = availableAgents.find((a) => a.id === selectedAgent)

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgent(agentId)
  }

  const handleHire = async () => {
    if (selectedAgent && currentAgent && session?.access_token) {
      setIsHiring(true);

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
            avatar_url: `https://api.dicebear.com/9.x/croodles/svg?seed=${currentAgent.name.toLowerCase()}&size=100`,
            role: currentAgent.role,
            personality: currentAgent.persona,
            tools: currentAgent.tools,
            preferences: {
              persona: currentAgent.persona,
              specialty: currentAgent.specialty,
              level: currentAgent.level
            },
            metadata: {
              template: currentAgent.template,
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
          setSelectedAgent(null)
          
          // Call the callback to refetch agents and close modal
          if (onAgentHired) {
            onAgentHired()
          }
          onClose()
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
          description: 'Failed to connect to the server. Please try again.',
        });
      } finally {
        setIsHiring(false);
      }
    }
  }

  const handleClose = () => {
    setSelectedAgent(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Hire Your Agent</DialogTitle>
          <p className="text-muted-foreground">Select a new team member to join your crew</p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {availableAgents.map((agent) => (
            <Card
              key={agent.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedAgent === agent.id ? "ring-2 ring-primary border-primary bg-primary/5" : "border-border"
              }`}
              onClick={() => handleSelectAgent(agent.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-12 h-12 border-2 border-background">
                    <AvatarImage 
                      src={`https://api.dicebear.com/9.x/croodles/svg?seed=${agent.name.toLowerCase()}&size=100`} 
                      alt={agent.name} 
                    />
                    <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{agent.name}</h3>
                        <p className="text-sm text-muted-foreground">{agent.role}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Level {agent.level}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {agent.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Star className="h-3 w-3" />
                      <span>{agent.specialty}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {agent.tools.map((tool) => (
                        <Badge key={tool} variant="outline" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isHiring}>
            Cancel
          </Button>
          <Button 
            onClick={handleHire} 
            disabled={!selectedAgent || isHiring}
            className="min-w-[120px]"
          >
            {isHiring ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Hiring...
              </div>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Hire Agent
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
