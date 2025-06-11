"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Send, Bot, User, X, Minimize2, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Agent } from '@/lib/types'

interface Message {
  id: string
  content: string
  sender: 'user' | 'agent'
  timestamp: Date
}

interface ShadcnChatProps {
  agent: Agent
  isOpen: boolean
  onClose: () => void
}

export function ShadcnChat({ agent, isOpen, onClose }: ShadcnChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = getWelcomeMessage(agent.name)
      setMessages([{
        id: 'welcome',
        content: welcomeMessage,
        sender: 'agent',
        timestamp: new Date()
      }])
    }
  }, [isOpen, agent.name])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

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

  const generateResponse = (userMessage: string): string => {
    const name = agent.name?.toLowerCase()
    switch (name) {
      case 'alex':
        return `I understand you need help with "${userMessage}". Let me break this down strategically and create a systematic approach. Here are the key considerations and next steps we should take...`
      case 'dana':
        return `Ooh, I love this! 🎨 "${userMessage}" sounds like an exciting creative challenge! ✨ Let me brainstorm some innovative approaches and visual solutions that could really make this pop! 🚀`
      case 'jamie':
        return `Thanks for sharing that with me. I want to make sure I understand "${userMessage}" fully so I can help coordinate the best approach. Let me think about how we can align everyone on this...`
      case 'riley':
        return `I've analyzed your request regarding "${userMessage}". Based on the data patterns and metrics I'm seeing, here are the evidence-based insights and recommendations...`
      case 'toby':
        return `Got it! "${userMessage}" - I'm on it right away. Let me quickly assess the situation and coordinate the most efficient response protocol to get this resolved fast...`
      default:
        return `I understand you need help with "${userMessage}". Let me assist you with that right away.`
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

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
      // Fallback to mock response on error
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I'm having trouble connecting right now. ${generateResponse(userMessage.content)}`,
        sender: 'agent',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
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

  if (!isOpen) return null

  return (
    <Card className={cn(
      "fixed right-6 bottom-6 w-[400px] h-[600px] shadow-xl z-50 flex flex-col transition-all duration-200",
      isMinimized && "h-[60px]"
    )}>
      <CardHeader className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={`https://api.dicebear.com/9.x/croodles/svg?seed=${agent.name?.toLowerCase()}&size=100`} 
                alt={agent.name} 
              />
              <AvatarFallback>
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm">{agent.name}</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {agent.role || 'Assistant'}
                </Badge>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.sender === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.sender === 'agent' && (
                      <Avatar className="h-6 w-6 mt-1">
                        <AvatarImage 
                          src={`https://api.dicebear.com/9.x/croodles/svg?seed=${agent.name?.toLowerCase()}&size=100`} 
                          alt={agent.name} 
                        />
                        <AvatarFallback>
                          <Bot className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        message.sender === 'user'
                          ? "bg-primary text-primary-foreground ml-9"
                          : "bg-muted"
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">{message.content}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>

                    {message.sender === 'user' && (
                      <Avatar className="h-6 w-6 mt-1">
                        <AvatarFallback>
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="h-6 w-6 mt-1">
                      <AvatarImage 
                        src={`https://api.dicebear.com/9.x/croodles/svg?seed=${agent.name?.toLowerCase()}&size=100`} 
                        alt={agent.name} 
                      />
                      <AvatarFallback>
                        <Bot className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <Separator />

          <div className="p-4 flex-shrink-0">
            <div className="flex space-x-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${agent.name}...`}
                className="min-h-[40px] max-h-[120px] resize-none flex-1"
                rows={1}
              />
              <Button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="icon"
                className="h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  )
} 