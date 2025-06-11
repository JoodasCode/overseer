"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Agent } from '@/lib/types'
import { ShadcnChat } from './ShadcnChat'

interface ShadcnChatTriggerProps {
  agents: Agent[]
}

export function ShadcnChatTrigger({ agents }: ShadcnChatTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showAgentList, setShowAgentList] = useState(false)

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent)
    setShowAgentList(false)
    setIsOpen(true)
  }

  const handleToggle = () => {
    if (selectedAgent) {
      setIsOpen(!isOpen)
    } else {
      setShowAgentList(!showAgentList)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setSelectedAgent(null)
    setShowAgentList(false)
  }

  return (
    <>
      {/* Agent Selection Card */}
      {showAgentList && (
        <Card className="fixed right-6 bottom-20 w-[320px] shadow-xl z-40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Choose an Agent</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowAgentList(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              {agents.map((agent) => (
                <Button
                  key={agent.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => handleAgentSelect(agent)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={`https://api.dicebear.com/9.x/croodles/svg?seed=${agent.name?.toLowerCase()}&size=100`} 
                        alt={agent.name} 
                      />
                      <AvatarFallback>
                        {agent.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="font-medium text-sm">{agent.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {agent.role || 'Assistant'}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating Chat Button */}
      <Button
        onClick={handleToggle}
        className={cn(
          "fixed right-6 bottom-6 h-14 w-14 rounded-full shadow-lg z-50 transition-all duration-200",
          selectedAgent && "bg-primary"
        )}
        size="icon"
      >
        {selectedAgent ? (
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={`https://api.dicebear.com/9.x/croodles/svg?seed=${selectedAgent.name?.toLowerCase()}&size=100`} 
              alt={selectedAgent.name} 
            />
            <AvatarFallback>
              {selectedAgent.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {/* Chat Interface */}
      {selectedAgent && (
        <ShadcnChat
          agent={selectedAgent}
          isOpen={isOpen}
          onClose={handleClose}
        />
      )}
    </>
  )
} 