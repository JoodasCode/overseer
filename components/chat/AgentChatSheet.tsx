"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, User, Loader2, MessageCircle, Trash2 } from 'lucide-react'
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
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface AgentChatSheetProps {
  agent: Agent | null
  isOpen: boolean
  onClose: () => void
}

export function AgentChatSheet({ agent, isOpen, onClose }: AgentChatSheetProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  // Focus textarea when sheet opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Load messages when agent changes
  useEffect(() => {
    if (agent) {
      loadMessages(agent.id)
    }
  }, [agent?.id])

  const loadMessages = (agentId: string) => {
    try {
      const stored = localStorage.getItem(`chat-${agentId}`)
      if (stored) {
        const parsedMessages = JSON.parse(stored)
        setMessages(parsedMessages)
      } else {
        setMessages([])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessages([])
    }
  }

  const saveMessages = (agentId: string, messages: Message[]) => {
    try {
      localStorage.setItem(`chat-${agentId}`, JSON.stringify(messages))
    } catch (error) {
      console.error('Error saving messages:', error)
    }
  }

  const clearChat = () => {
    if (agent) {
      setMessages([])
      localStorage.removeItem(`chat-${agent.id}`)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !agent) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message
    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }
    
    const updatedMessages = [...messages, newUserMessage]
    setMessages(updatedMessages)
    saveMessages(agent.id, updatedMessages)

    try {
      const response = await fetch(`/api/agents/${agent.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          messages: messages.slice(-5).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      }
      
      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)
      saveMessages(agent.id, finalMessages)
      
    } catch (error) {
      console.error('Error sending message:', error)
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }
      const finalMessages = [...updatedMessages, errorMessage]
      setMessages(finalMessages)
      saveMessages(agent.id, finalMessages)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-500'
      case 'collaborating': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[45vw] min-w-[600px] max-w-[1000px] p-0 flex flex-col">
        {agent && (
          <>
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={agent.avatar_url} alt={agent.name} />
                    <AvatarFallback>{agent.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background", getStatusColor(agent.status))} />
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-left text-lg">{agent.name}</SheetTitle>
                  <p className="text-sm text-muted-foreground truncate">{agent.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="ml-auto">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Chat
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearChat}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-left">
                {agent.description}
              </p>
            </SheetHeader>

            {/* Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
              <div className="space-y-6">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <MessageCircle className="w-10 h-10 text-primary" />
                    </div>
                    <p className="text-xl font-medium mb-3">Start a conversation</p>
                    <p className="text-base">
                      Ask {agent.name} anything! They specialize in {agent.role.toLowerCase()}.
                    </p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-4 max-w-[90%]",
                      message.role === 'user' ? "ml-auto flex-row-reverse" : ""
                    )}
                  >
                    <Avatar className="w-10 h-10 mt-1 flex-shrink-0">
                      {message.role === 'user' ? (
                        <>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarImage src={agent.avatar_url} alt={agent.name} />
                          <AvatarFallback className="bg-muted">
                            {agent.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <div
                      className={cn(
                        "rounded-xl px-4 py-3 text-base max-w-full",
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                      <p className="text-xs opacity-70 mt-2">
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-4 max-w-[90%]">
                    <Avatar className="w-10 h-10 mt-1 flex-shrink-0">
                      <AvatarImage src={agent.avatar_url} alt={agent.name} />
                      <AvatarFallback className="bg-muted">
                        {agent.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-xl px-4 py-3 text-base">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-muted-foreground">{agent.name} is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-6 border-t bg-background">
              <div className="flex gap-3">
                <Textarea
                  ref={textareaRef}
                  placeholder={`Message ${agent.name}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="min-h-[50px] max-h-40 resize-none flex-1 text-base"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="lg"
                  className="h-[50px] w-[50px] shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <div className="flex justify-between items-center mt-3">
                <p className="text-sm text-muted-foreground">
                  Press Enter to send, Shift+Enter for new line
                </p>
                {messages.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {messages.length} messages • Auto-saved
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
} 