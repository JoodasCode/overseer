"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Send,
  Bot,
  User,
  Sparkles,
  Mail,
  MessageSquare,
  Calendar,
  Database,
  Globe,
  Users,
  CheckCircle,
  ArrowRight,
  Edit,
  RefreshCw,
  Play,
  Save
} from 'lucide-react'
import type { Agent } from '@/lib/types'

interface ConversationalMessage {
  id: string
  type: 'user' | 'assistant' | 'system' | 'options'
  content: string
  timestamp: Date
  options?: WorkflowOption[]
  metadata?: any
}

interface WorkflowOption {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  value: any
}

interface WorkflowStep {
  step: number
  type: 'trigger' | 'agent' | 'action' | 'destination'
  title: string
  completed: boolean
  data?: any
}

interface ConversationalWorkflowBuilderProps {
  agents: Agent[]
  onWorkflowCreated: (workflow: any) => void
  onSwitchToVisual: (workflow: any) => void
}

const TRIGGER_OPTIONS: WorkflowOption[] = [
  {
    id: 'gmail_new_email',
    label: 'New Email in Gmail',
    description: 'Triggers when a new email is received',
    icon: <Mail className="w-4 h-4" />,
    value: { type: 'gmail', event: 'new_email' }
  },
  {
    id: 'slack_new_message',
    label: 'New Message in Slack',
    description: 'Triggers when a message is posted to a channel',
    icon: <MessageSquare className="w-4 h-4" />,
    value: { type: 'slack', event: 'new_message' }
  },
  {
    id: 'notion_new_page',
    label: 'New Page in Notion',
    description: 'Triggers when a new page is created',
    icon: <Database className="w-4 h-4" />,
    value: { type: 'notion', event: 'new_page' }
  },
  {
    id: 'schedule',
    label: 'Schedule-based Trigger',
    description: 'Triggers at specific times or intervals',
    icon: <Calendar className="w-4 h-4" />,
    value: { type: 'schedule', event: 'time_based' }
  },
  {
    id: 'manual',
    label: 'Manual Trigger',
    description: 'Start workflow manually when needed',
    icon: <User className="w-4 h-4" />,
    value: { type: 'manual', event: 'button_click' }
  }
]

const ACTION_OPTIONS: WorkflowOption[] = [
  {
    id: 'send_email',
    label: 'Send Email via Gmail',
    description: 'Send an email to specified recipients',
    icon: <Mail className="w-4 h-4" />,
    value: { type: 'gmail', action: 'send_email' }
  },
  {
    id: 'post_slack',
    label: 'Post to Slack',
    description: 'Send a message to a Slack channel',
    icon: <MessageSquare className="w-4 h-4" />,
    value: { type: 'slack', action: 'send_message' }
  },
  {
    id: 'create_notion_page',
    label: 'Create Notion Page',
    description: 'Create a new page in Notion',
    icon: <Database className="w-4 h-4" />,
    value: { type: 'notion', action: 'create_page' }
  },
  {
    id: 'summarize',
    label: 'Summarize Content',
    description: 'Let your agent summarize or analyze content',
    icon: <Sparkles className="w-4 h-4" />,
    value: { type: 'agent', action: 'summarize' }
  }
]

export function ConversationalWorkflowBuilder({ 
  agents, 
  onWorkflowCreated, 
  onSwitchToVisual 
}: ConversationalWorkflowBuilderProps) {
  const [messages, setMessages] = useState<ConversationalMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm here to help you create a new workflow. Let's start by understanding what should trigger your automation. What event should start this workflow?",
      timestamp: new Date(),
      options: TRIGGER_OPTIONS
    }
  ])
  
  const [currentStep, setCurrentStep] = useState(1)
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    { step: 1, type: 'trigger', title: 'Select Trigger', completed: false },
    { step: 2, type: 'agent', title: 'Choose Agent', completed: false },
    { step: 3, type: 'action', title: 'Define Action', completed: false },
    { step: 4, type: 'destination', title: 'Set Destination', completed: false }
  ])
  
  const [workflowData, setWorkflowData] = useState<any>({
    name: '',
    trigger: null,
    agent: null,
    action: null,
    destination: null
  })
  
  const [inputValue, setInputValue] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Deduplicate agents by name and prioritize most recent
  const uniqueAgents = agents.reduce((acc, agent) => {
    const existingAgent = acc.find(a => a.name === agent.name);
    if (!existingAgent) {
      acc.push(agent);
    } else {
      if (agent.id > existingAgent.id) {
        const index = acc.findIndex(a => a.name === agent.name);
        acc[index] = agent;
      }
    }
    return acc;
  }, [] as Agent[]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = (message: Omit<ConversationalMessage, 'id' | 'timestamp'>) => {
    const newMessage: ConversationalMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const markStepCompleted = (stepNumber: number, data?: any) => {
    setWorkflowSteps(prev => prev.map(step => 
      step.step === stepNumber 
        ? { ...step, completed: true, data } 
        : step
    ))
  }

  const handleOptionSelect = (option: WorkflowOption) => {
    // Add user selection message
    addMessage({
      type: 'user',
      content: option.label
    })

    switch (currentStep) {
      case 1: // Trigger selection
        handleTriggerSelection(option)
        break
      case 2: // Agent selection
        handleAgentSelection(option)
        break
      case 3: // Action selection
        handleActionSelection(option)
        break
      case 4: // Destination selection
        handleDestinationSelection(option)
        break
    }
  }

  const handleTriggerSelection = (option: WorkflowOption) => {
    setWorkflowData(prev => ({ ...prev, trigger: option.value }))
    markStepCompleted(1, option.value)
    setCurrentStep(2)

    // Show agent selection
    const agentOptions: WorkflowOption[] = uniqueAgents.map(agent => ({
      id: agent.id.toString(),
      label: agent.name,
      description: `${agent.role} - ${agent.description || 'Available to help'}`,
      icon: <span className="text-lg">{agent.avatar}</span>,
      value: { id: agent.id, name: agent.name, role: agent.role }
    }))

    setTimeout(() => {
      addMessage({
        type: 'assistant',
        content: `Great! You've selected "${option.label}" as your trigger. Now, which agent should handle this workflow?`,
        options: agentOptions
      })
    }, 500)
  }

  const handleAgentSelection = (option: WorkflowOption) => {
    setWorkflowData(prev => ({ ...prev, agent: option.value }))
    markStepCompleted(2, option.value)
    setCurrentStep(3)

    // Show action selection based on trigger context
    const contextualActions = getContextualActions(workflowData.trigger)

    setTimeout(() => {
      addMessage({
        type: 'assistant',
        content: `Perfect! ${option.label} will handle this workflow. What should the agent do when the trigger fires?`,
        options: contextualActions
      })
    }, 500)
  }

  const handleActionSelection = (option: WorkflowOption) => {
    setWorkflowData(prev => ({ ...prev, action: option.value }))
    markStepCompleted(3, option.value)
    setCurrentStep(4)

    // Show destination options
    const destinationOptions = getDestinationOptions(option.value)

    setTimeout(() => {
      addMessage({
        type: 'assistant',
        content: `Excellent choice! Now, where should the result be sent or stored?`,
        options: destinationOptions
      })
    }, 500)
  }

  const handleDestinationSelection = (option: WorkflowOption) => {
    setWorkflowData(prev => ({ ...prev, destination: option.value }))
    markStepCompleted(4, option.value)

    // Generate workflow name
    const generatedName = generateWorkflowName(workflowData.trigger, workflowData.action, option.value)
    setWorkflowData(prev => ({ ...prev, name: generatedName }))

    setTimeout(() => {
      showWorkflowSummary(generatedName)
    }, 500)
  }

  const getContextualActions = (trigger: any): WorkflowOption[] => {
    const baseActions = [...ACTION_OPTIONS]
    
    // Add contextual actions based on trigger
    if (trigger?.type === 'gmail') {
      baseActions.unshift({
        id: 'reply_email',
        label: 'Reply to Email',
        description: 'Send an automated reply to the incoming email',
        icon: <Mail className="w-4 h-4" />,
        value: { type: 'gmail', action: 'reply' }
      })
    }
    
    return baseActions
  }

  const getDestinationOptions = (action: any): WorkflowOption[] => {
    const destinations: WorkflowOption[] = []
    
    if (action.type !== 'slack') {
      destinations.push({
        id: 'slack_channel',
        label: 'Slack Channel',
        description: 'Send to a specific Slack channel',
        icon: <MessageSquare className="w-4 h-4" />,
        value: { type: 'slack', target: 'channel' }
      })
    }
    
    if (action.type !== 'gmail') {
      destinations.push({
        id: 'email',
        label: 'Email Address',
        description: 'Send via email to specific recipients',
        icon: <Mail className="w-4 h-4" />,
        value: { type: 'gmail', target: 'email' }
      })
    }
    
    if (action.type !== 'notion') {
      destinations.push({
        id: 'notion_page',
        label: 'Notion Page',
        description: 'Save to a Notion page or database',
        icon: <Database className="w-4 h-4" />,
        value: { type: 'notion', target: 'page' }
      })
    }
    
    return destinations
  }

  const generateWorkflowName = (trigger: any, action: any, destination: any): string => {
    const triggerName = trigger.type === 'gmail' ? 'Gmail' : 
                       trigger.type === 'slack' ? 'Slack' : 
                       trigger.type === 'notion' ? 'Notion' : 'Scheduled'
    
    const actionName = action.action === 'summarize' ? 'Summarize' :
                      action.action === 'send_email' ? 'Email' :
                      action.action === 'send_message' ? 'Message' : 'Process'
    
    const destName = destination.type === 'slack' ? 'Slack' :
                    destination.type === 'gmail' ? 'Email' :
                    destination.type === 'notion' ? 'Notion' : 'Output'
    
    return `${triggerName} → ${actionName} → ${destName}`
  }

  const showWorkflowSummary = (workflowName: string) => {
    addMessage({
      type: 'assistant',
      content: `🎉 Perfect! I've created your workflow: "${workflowName}"`
    })

    setTimeout(() => {
      addMessage({
        type: 'system',
        content: 'workflow_summary',
        metadata: { workflowData: { ...workflowData, name: workflowName } }
      })
    }, 1000)
  }

  const handleCreateWorkflow = () => {
    const workflow = {
      id: Date.now().toString(),
      name: workflowData.name,
      description: `Automated workflow: ${workflowData.name}`,
      trigger: workflowData.trigger,
      agent: workflowData.agent,
      steps: [
        { action: workflowData.action.action, target: workflowData.destination }
      ],
      status: 'draft',
      nodes: [], // Will be populated by visual editor
      runCount: 0,
      successRate: 0
    }
    
    onWorkflowCreated(workflow)
  }

  const handleSwitchToVisual = () => {
    const workflow = {
      id: Date.now().toString(),
      name: workflowData.name,
      description: `Automated workflow: ${workflowData.name}`,
      trigger: workflowData.trigger,
      agent: workflowData.agent,
      steps: [
        { action: workflowData.action.action, target: workflowData.destination }
      ],
      status: 'draft',
      nodes: [],
      runCount: 0,
      successRate: 0
    }
    
    onSwitchToVisual(workflow)
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    addMessage({
      type: 'user',
      content: inputValue.trim()
    })

    // Simple AI response for custom messages
    setTimeout(() => {
      addMessage({
        type: 'assistant',
        content: "I understand! If you'd like to modify any part of the workflow, just let me know what you'd like to change. Otherwise, you can continue with the options above."
      })
    }, 1000)

    setInputValue('')
  }

  const renderMessage = (message: ConversationalMessage) => {
    if (message.type === 'system' && message.content === 'workflow_summary') {
      const data = message.metadata?.workflowData
      return (
        <div className="mb-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="font-pixel text-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Workflow Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-pixel text-xs text-primary mb-2">{data?.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="w-16 text-muted-foreground">Trigger:</span>
                    <span>{TRIGGER_OPTIONS.find(opt => opt.value.type === data?.trigger?.type)?.label}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-16 text-muted-foreground">Agent:</span>
                    <span>{data?.agent?.name} ({data?.agent?.role})</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-16 text-muted-foreground">Action:</span>
                    <span>{ACTION_OPTIONS.find(opt => opt.value.action === data?.action?.action)?.label}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-16 text-muted-foreground">Output:</span>
                    <span>{data?.destination?.type === 'slack' ? 'Slack Channel' : 
                          data?.destination?.type === 'gmail' ? 'Email' : 'Notion Page'}</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex space-x-2">
                <Button onClick={handleCreateWorkflow} className="font-pixel text-xs">
                  <Save className="w-3 h-3 mr-1" />
                  Create Workflow
                </Button>
                <Button variant="outline" onClick={handleSwitchToVisual} className="font-pixel text-xs">
                  <Edit className="w-3 h-3 mr-1" />
                  Edit Visually
                </Button>
                <Button variant="ghost" className="font-pixel text-xs">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Start Over
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          <Avatar className="w-8 h-8">
            {message.type === 'user' ? (
              <>
                <AvatarImage src="/placeholder-user.png" />
                <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
              </>
            ) : (
              <>
                <AvatarImage src="/placeholder-assistant.png" />
                <AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback>
              </>
            )}
          </Avatar>
          
          <div className={`mx-3 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-3 rounded-lg ${
              message.type === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              <p className="text-sm">{message.content}</p>
            </div>
            
            {message.options && (
              <div className="mt-3 space-y-2">
                {message.options.map((option) => (
                  <Button
                    key={option.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleOptionSelect(option)}
                    className="w-full justify-start font-clean text-xs h-auto p-3"
                  >
                    <div className="flex items-center space-x-3">
                      {option.icon}
                      <div className="text-left">
                        <div className="font-medium">{option.label}</div>
                        {option.description && (
                          <div className="text-muted-foreground text-xs mt-1">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mt-1">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-pixel p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-pixel text-lg text-primary">Create New Workflow</h2>
            <p className="text-sm text-muted-foreground">Build automation through conversation</p>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-2">
            {workflowSteps.map((step, index) => (
              <div key={step.step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-pixel ${
                  step.completed 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.step 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step.completed ? <CheckCircle className="w-4 h-4" /> : step.step}
                </div>
                {index < workflowSteps.length - 1 && (
                  <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex">
        <div className="flex-1">
          <ScrollArea ref={scrollAreaRef} className="h-full p-4">
            {messages.map((message) => renderMessage(message))}
          </ScrollArea>
          
          {/* Input Area */}
          <div className="border-t border-pixel p-4">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message or use the options above..."
                className="flex-1 font-clean border-pixel"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="font-pixel text-xs"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 