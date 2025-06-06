"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Zap, TrendingUp } from "lucide-react"
import type { Agent } from "@/lib/types"

interface LevelUpModalProps {
  isOpen: boolean
  onClose: () => void
  agent: Agent
  newSkill: string
}

export function LevelUpModal({ isOpen, onClose, agent, newSkill }: LevelUpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-pixel">
        <DialogHeader>
          <DialogTitle className="font-pixel text-center text-lg">LEVEL UP!</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="relative">
              <span className="text-6xl">{agent.avatar}</span>
              <div className="absolute -top-2 -right-2 animate-bounce">
                <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-pixel text-xl text-primary">{agent.name}</h3>
            <p className="text-sm text-muted-foreground">{agent.role}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="outline" className="font-pixel">
                Level {agent.level}
              </Badge>
              <TrendingUp className="w-4 h-4 text-primary" />
              <Badge variant="default" className="font-pixel">
                Level {agent.level + 1}
              </Badge>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-pixel text-sm text-primary">NEW SKILL UNLOCKED</span>
            </div>
            <p className="font-pixel text-xs">{newSkill}</p>
          </div>

          <div className="space-y-2 text-xs">
            <p>🎯 Improved task efficiency</p>
            <p>🧠 Enhanced memory capacity</p>
            <p>⚡ New automation options</p>
          </div>

          <Button onClick={onClose} className="w-full font-pixel">
            Continue Adventure
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
