"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth/supabase-auth-provider"
import { Zap, Clock, Webhook, User, Bell, Mail, MessageSquare, Calendar, Users, Loader2 } from "lucide-react"
import type { Agent } from "@/lib/types"

interface NewAutomationModalProps {
  isOpen: boolean
  onClose: () => void
  onAutomationCreated: () => void
  agents: Agent[]
}

interface AutomationFormData {
  name: string
  description: string
  trigger_type: string
  trigger_config: Record<string, any>
  action_type: string
  action_config: Record<string, any>
  agents: string[]
  category: 'notifications' | 'workflows' | 'integrations'
  status: 'draft' | 'active' | 'paused'
}

const triggerTypes = [
  { id: 'time', label: 'Time-based', icon: <Clock className="w-4 h-4" />, description: 'Run on a schedule' },
  { id: 'event', label: 'Event-triggered', icon: <Zap className="w-4 h-4" />, description: 'React to agent actions' },
  { id: 'webhook', label: 'Webhook', icon: <Webhook className="w-4 h-4" />, description: 'External API calls' },
  { id: 'manual', label: 'Manual', icon: <User className="w-4 h-4" />, description: 'Run manually' },
]

const actionTypes = [
  { id: 'notification', label: 'Send Notification', icon: <Bell className="w-4 h-4" />, category: 'notifications' },
  { id: 'email', label: 'Send Email', icon: <Mail className="w-4 h-4" />, category: 'notifications' },
  { id: 'slack_message', label: 'Slack Message', icon: <MessageSquare className="w-4 h-4" />, category: 'integrations' },
  { id: 'create_task', label: 'Create Task', icon: <Calendar className="w-4 h-4" />, category: 'workflows' },
  { id: 'agent_collaboration', label: 'Agent Collaboration', icon: <Users className="w-4 h-4" />, category: 'workflows' },
]

export function NewAutomationModal({ isOpen, onClose, onAutomationCreated, agents }: NewAutomationModalProps) {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<AutomationFormData>({
    name: '',
    description: '',
    trigger_type: '',
    trigger_config: {},
    action_type: '',
    action_config: {},
    agents: [],
    category: 'workflows',
    status: 'draft'
  })

  const handleInputChange = (field: keyof AutomationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTriggerConfigChange = (config: Record<string, any>) => {
    setFormData(prev => ({ ...prev, trigger_config: config }))
  }

  const handleActionConfigChange = (config: Record<string, any>) => {
    setFormData(prev => ({ ...prev, action_config: config }))
  }

  const handleAgentToggle = (agentId: string, checked: boolean) => {
    const updatedAgents = checked 
      ? [...formData.agents, agentId]
      : formData.agents.filter(id => id !== agentId)
    handleInputChange('agents', updatedAgents)
  }

  const handleSubmit = async () => {
    if (!session?.access_token) {
      console.error('No session token')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onAutomationCreated()
        onClose()
        resetForm()
      } else {
        const error = await response.json()
        console.error('Failed to create automation:', error)
      }
    } catch (error) {
      console.error('Error creating automation:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setFormData({
      name: '',
      description: '',
      trigger_type: '',
      trigger_config: {},
      action_type: '',
      action_config: {},
      agents: [],
      category: 'workflows',
      status: 'draft'
    })
  }

  const selectedTrigger = triggerTypes.find(t => t.id === formData.trigger_type)
  const selectedAction = actionTypes.find(a => a.id === formData.action_type)

  const canProceedToStep2 = formData.name && formData.trigger_type
  const canProceedToStep3 = canProceedToStep2 && formData.action_type
  const canSubmit = canProceedToStep3 && formData.agents.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto border-pixel">
        <DialogHeader>
          <DialogTitle className="font-pixel text-center text-lg">CREATE NEW AUTOMATION</DialogTitle>
          <div className="flex justify-center space-x-4 mt-4">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className={`w-8 h-8 rounded-full flex items-center justify-center font-pixel text-xs ${
                step >= stepNum ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {stepNum}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-6 p-4">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-pixel text-lg">Basic Information</h3>
                <p className="text-sm text-muted-foreground">Give your automation a name and description</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="font-pixel text-xs">Automation Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Daily Status Updates"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="font-pixel text-xs">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what this automation does..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="font-pixel text-xs">Trigger Type</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {triggerTypes.map((trigger) => (
                      <Card
                        key={trigger.id}
                        className={`cursor-pointer transition-colors ${
                          formData.trigger_type === trigger.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => handleInputChange('trigger_type', trigger.id)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="font-pixel text-sm flex items-center space-x-2">
                            {trigger.icon}
                            <span>{trigger.label}</span>
                          </CardTitle>
                          <CardDescription className="text-xs">{trigger.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Trigger Configuration */}
          {step === 2 && selectedTrigger && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-pixel text-lg">Configure Trigger</h3>
                <p className="text-sm text-muted-foreground">Set up when your automation should run</p>
              </div>

              {formData.trigger_type === 'time' && (
                <div className="space-y-4">
                  <div>
                    <Label className="font-pixel text-xs">Schedule</Label>
                    <Select onValueChange={(value) => handleTriggerConfigChange({ schedule: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily at 9:00 AM</SelectItem>
                        <SelectItem value="weekly">Weekly on Monday</SelectItem>
                        <SelectItem value="hourly">Every hour</SelectItem>
                        <SelectItem value="custom">Custom schedule</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {formData.trigger_type === 'event' && (
                <div className="space-y-4">
                  <div>
                    <Label className="font-pixel text-xs">Event Type</Label>
                    <Select onValueChange={(value) => handleTriggerConfigChange({ event_type: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="task_completed">Task Completed</SelectItem>
                        <SelectItem value="agent_idle">Agent Idle</SelectItem>
                        <SelectItem value="error_occurred">Error Occurred</SelectItem>
                        <SelectItem value="goal_achieved">Goal Achieved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {formData.trigger_type === 'webhook' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhook_url" className="font-pixel text-xs">Webhook URL</Label>
                    <Input
                      id="webhook_url"
                      placeholder="https://your-webhook-url.com"
                      onChange={(e) => handleTriggerConfigChange({ webhook_url: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {formData.trigger_type === 'manual' && (
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    This automation will run manually when you trigger it.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Action Configuration */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-pixel text-lg">Choose Action</h3>
                <p className="text-sm text-muted-foreground">What should happen when triggered?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {actionTypes.map((action) => (
                  <Card
                    key={action.id}
                    className={`cursor-pointer transition-colors ${
                      formData.action_type === action.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => {
                      handleInputChange('action_type', action.id)
                      handleInputChange('category', action.category)
                    }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="font-pixel text-sm flex items-center space-x-2">
                        {action.icon}
                        <span>{action.label}</span>
                      </CardTitle>
                      <Badge variant="secondary" className="w-fit font-pixel text-xs">
                        {action.category}
                      </Badge>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {selectedAction && (
                <div className="mt-6 space-y-4">
                  {formData.action_type === 'notification' && (
                    <div>
                      <Label htmlFor="notification_message" className="font-pixel text-xs">Message</Label>
                      <Textarea
                        id="notification_message"
                        placeholder="Your notification message..."
                        onChange={(e) => handleActionConfigChange({ message: e.target.value })}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  )}

                  {formData.action_type === 'email' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email_subject" className="font-pixel text-xs">Subject</Label>
                        <Input
                          id="email_subject"
                          placeholder="Email subject..."
                          onChange={(e) => handleActionConfigChange({ 
                            ...formData.action_config, 
                            subject: e.target.value 
                          })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email_body" className="font-pixel text-xs">Body</Label>
                        <Textarea
                          id="email_body"
                          placeholder="Email body..."
                          onChange={(e) => handleActionConfigChange({ 
                            ...formData.action_config, 
                            body: e.target.value 
                          })}
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                    </div>
                  )}

                  {formData.action_type === 'slack_message' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="slack_channel" className="font-pixel text-xs">Channel</Label>
                        <Input
                          id="slack_channel"
                          placeholder="#general"
                          onChange={(e) => handleActionConfigChange({ 
                            ...formData.action_config, 
                            channel: e.target.value 
                          })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="slack_message" className="font-pixel text-xs">Message</Label>
                        <Textarea
                          id="slack_message"
                          placeholder="Slack message..."
                          onChange={(e) => handleActionConfigChange({ 
                            ...formData.action_config, 
                            message: e.target.value 
                          })}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  {formData.action_type === 'create_task' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="task_title" className="font-pixel text-xs">Task Title</Label>
                        <Input
                          id="task_title"
                          placeholder="Task title..."
                          onChange={(e) => handleActionConfigChange({ 
                            ...formData.action_config, 
                            title: e.target.value 
                          })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="task_details" className="font-pixel text-xs">Task Details</Label>
                        <Textarea
                          id="task_details"
                          placeholder="Task details..."
                          onChange={(e) => handleActionConfigChange({ 
                            ...formData.action_config, 
                            details: e.target.value 
                          })}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Agent Selection */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-pixel text-lg">Select Agents</h3>
                <p className="text-sm text-muted-foreground">Choose which agents will be involved</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map((agent) => (
                  <Card key={agent.id} className="border-pixel">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={agent.id}
                          checked={formData.agents.includes(agent.id)}
                          onCheckedChange={(checked) => handleAgentToggle(agent.id, checked as boolean)}
                        />
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{agent.avatar}</span>
                          <div>
                            <Label htmlFor={agent.id} className="font-pixel text-sm cursor-pointer">
                              {agent.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">{agent.role}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {formData.agents.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Select at least one agent to continue
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              className="font-pixel text-xs"
            >
              {step > 1 ? 'Back' : 'Cancel'}
            </Button>

            <div className="flex space-x-2">
              {step < 4 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !canProceedToStep2) ||
                    (step === 2 && !canProceedToStep3)
                  }
                  className="font-pixel text-xs"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || loading}
                  className="font-pixel text-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Automation'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 