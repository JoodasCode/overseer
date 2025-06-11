"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Agent {
  id: string
  name: string
  role: string
  description: string
  avatar_url: string
  status: 'active' | 'idle' | 'offline' | 'collaborating'
  personality: string
  tools: string[]
  stats: {
    total_tasks_completed?: number
    efficiency_score?: number
    last_active?: string
  }
}

interface Message {
  id: string
  content: string
  sender: 'user' | 'agent'
  timestamp: Date
}

interface AgentChatDialogProps {
  agent: Agent | null
  isOpen: boolean
  onClose: () => void
}

export function AgentChatDialog({ agent, isOpen, onClose }: AgentChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Initialize with welcome message when agent changes
  useEffect(() => {
    if (agent && isOpen) {
      const welcomeMessage = getWelcomeMessage(agent.name)
      setMessages([{
        id: 'welcome',
        content: welcomeMessage,
        sender: 'agent',
        timestamp: new Date()
      }])
    }
  }, [agent, isOpen])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages, isTyping])

  // Focus textarea when dialog opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  const getWelcomeMessage = (agentName?: string): string => {
    const name = agentName?.toLowerCase()
    switch (name) {
      case 'alex':
        return "👋 Hello! I'm Alex, your Strategic Coordinator. I'm here to help you develop strategic plans, coordinate projects, and think through long-term goals systematically. What challenge can we tackle together today?"
      case 'dana':
        return "🎨 Hey there! I'm Dana, your Creative Assistant! ✨ I'm super excited to help you bring ideas to life through visual creativity and innovative thinking! What creative magic shall we create today? 🚀"
      case 'jamie':
        return "🤝 Hi! I'm Jamie, your Team Coordinator. I'm passionate about fostering great collaboration and team harmony. How can I support your team today?"
      case 'riley':
        return "📊 Hello. I'm Riley, your Data Analyst. I approach challenges through the lens of data, metrics, and measurable outcomes. What data or analysis do you need today?"
      case 'toby':
        return "⚡ Hi there! I'm Toby, your Support Coordinator. I'm always ready to help with urgent issues and rapid response. What can I help you coordinate or resolve today?"
      default:
        return `👋 Hello! I'm ${agentName || 'your AI assistant'}. How can I help you today?`
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isTyping || !agent) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      // Call the real API endpoint
      const response = await fetch(`/api/agents/${agent.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          messages: messages.slice(-5).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.message,
          sender: 'agent',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Chat error:', error)
      // Fallback message on error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I'm having trouble connecting right now. Please try again in a moment.`,
        sender: 'agent',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!agent) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={`https://api.dicebear.com/9.x/croodles/svg?seed=${agent.name?.toLowerCase()}&size=100`} 
                  alt={agent.name} 
                />
                <AvatarFallback>
                  <Bot className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background"></div>
            </div>
            
            <div className="flex-1">
              <DialogTitle className="text-xl">{agent.name}</DialogTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {agent.role}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4 max-w-[85%]",
                    message.sender === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                    {message.sender === 'agent' ? (
                      <>
                        <AvatarImage 
                          src={`https://api.dicebear.com/9.x/croodles/svg?seed=${agent.name?.toLowerCase()}&size=100`} 
                          alt={agent.name} 
                        />
                        <AvatarFallback>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="flex-1 space-y-1">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm",
                        message.sender === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    </div>
                    <div className={cn(
                      "text-xs text-muted-foreground px-1",
                      message.sender === 'user' ? "text-right" : ""
                    )}>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-4 max-w-[85%]">
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage 
                      src={`https://api.dicebear.com/9.x/croodles/svg?seed=${agent.name?.toLowerCase()}&size=100`} 
                      alt={agent.name} 
                    />
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl px-4 py-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-muted-foreground">{agent.name} is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator />

          {/* Input */}
          <div className="p-6 pt-4">
            <div className="flex space-x-3">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${agent.name}...`}
                className="min-h-[60px] max-h-[120px] resize-none flex-1 text-sm"
                rows={2}
              />
              <Button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="icon"
                className="h-[60px] w-12 self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 