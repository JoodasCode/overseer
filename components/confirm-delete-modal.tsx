"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2 } from "lucide-react"
import type { Agent } from "@/lib/types"

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  agent: Agent | null
  isDeleting?: boolean
}

export function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  agent, 
  isDeleting = false 
}: ConfirmDeleteModalProps) {
  if (!agent) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-pixel">
        <DialogHeader>
          <DialogTitle className="font-pixel text-center text-lg flex items-center justify-center text-destructive">
            <AlertTriangle className="w-5 h-5 mr-2" />
            CONFIRM DELETION
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent Info */}
          <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded border-pixel">
            <span className="text-2xl">{agent.avatar}</span>
            <div>
              <div className="font-pixel text-sm">{agent.name}</div>
              <div className="text-xs text-muted-foreground">{agent.role}</div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="space-y-3">
            <p className="font-pixel text-sm text-center">
              Are you sure you want to remove this agent?
            </p>
            <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
              <p className="text-xs text-destructive font-clean">
                ⚠️ This action cannot be undone. All agent data, tasks, and memory will be permanently deleted.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 font-pixel text-xs"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={onConfirm} 
              className="flex-1 font-pixel text-xs"
              disabled={isDeleting}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {isDeleting ? "Removing..." : "Remove Agent"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 