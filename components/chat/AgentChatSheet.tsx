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
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { config } from '@/lib/config'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages, isLoading, streamingMessage])

  // Auto-focus textarea when sheet opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Load messages when agent changes
  useEffect(() => {
    if (agent && isOpen) {
      loadMessages(agent.id)
    }
  }, [agent?.id, isOpen])

  const loadMessages = async (agentId: string) => {
    if (!config.ENABLE_DATABASE) {
      // Load from localStorage in mock mode
      const savedMessages = localStorage.getItem(`chat-messages-${agentId}`)
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages))
        } catch (error) {
          console.error('Error parsing saved messages:', error)
        }
      }
      return
    }

    setIsLoadingHistory(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        console.log('No authenticated user, skipping message load')
        return
      }

      const { data, error } = await supabase
        .from('portal_agent_logs')
        .select('*')
        .eq('agent_id', agentId)
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading messages:', error)
        // Fall back to localStorage
        const savedMessages = localStorage.getItem(`chat-messages-${agentId}`)
        if (savedMessages) {
          try {
            setMessages(JSON.parse(savedMessages))
          } catch (parseError) {
            console.error('Error parsing saved messages:', parseError)
          }
        }
        return
      }

      // Convert database messages to UI format
      const formattedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at).toISOString()
      }))

      setMessages(formattedMessages)
      
      // Also save to localStorage as backup
      localStorage.setItem(`chat-messages-${agentId}`, JSON.stringify(formattedMessages))

    } catch (error) {
      console.error('Error loading messages:', error)
      // Fall back to localStorage
      const savedMessages = localStorage.getItem(`chat-messages-${agentId}`)
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages))
        } catch (parseError) {
          console.error('Error parsing saved messages:', parseError)
        }
      }
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const saveMessages = (agentId: string, messages: Message[]) => {
    // Always save to localStorage as backup
    localStorage.setItem(`chat-messages-${agentId}`, JSON.stringify(messages))
  }

  const clearChat = async () => {
    if (!agent) return
    
    setMessages([])
    saveMessages(agent.id, [])
    
    // Also clear from database if enabled
    if (config.ENABLE_DATABASE) {
      try {
        const { data: user } = await supabase.auth.getUser()
        if (user.user) {
          await supabase
            .from('portal_agent_logs')
            .delete()
            .eq('agent_id', agent.id)
            .eq('user_id', user.user.id)
        }
      } catch (error) {
        console.error('Error clearing database messages:', error)
      }
    }
  }

  // Stream response word by word
  const streamResponse = (fullResponse: string) => {
    const words = fullResponse.split(' ')
    let currentIndex = 0
    setStreamingMessage('')
    setIsStreaming(true)

    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setStreamingMessage(prev => {
          const newContent = prev + (prev ? ' ' : '') + words[currentIndex]
          currentIndex++
          return newContent
        })
      } else {
        clearInterval(interval)
        setIsStreaming(false)
        
        // Add the complete message
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date().toISOString()
        }
        
        setMessages(prev => {
          const newMessages = [...prev, assistantMessage]
          if (agent) saveMessages(agent.id, newMessages)
          return newMessages
        })
        setStreamingMessage('')
      }
    }, 100) // Adjust speed (100ms per word)
  }

  const sendMessage = async () => {
    if (!input.trim() || !agent || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    saveMessages(agent.id, updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      // Add Bearer token if available
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch(`/api/agents/${agent.id}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMessage.content
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      
      if (data.success && data.message) {
        // Start streaming the response
        streamResponse(data.message)
      } else {
        throw new Error(data.error || 'No response received')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Remove the user message on error
      setMessages(messages)
      saveMessages(agent.id, messages)
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  if (!agent) return null

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
                {isLoadingHistory ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading chat history...</span>
                    </div>
                  </div>
                ) : messages.length === 0 && !isStreaming ? (
                  <div className="text-center text-muted-foreground py-12">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <MessageCircle className="w-10 h-10 text-primary" />
                    </div>
                    <p className="text-xl font-medium mb-3">Start a conversation</p>
                    <p className="text-base">
                      Ask {agent.name} anything! They specialize in {agent.role.toLowerCase()}.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
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
                        <div className="markdown-content whitespace-pre-wrap break-words leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>p]:my-2 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:my-3 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:my-2 [&>h3]:text-base [&>h3]:font-bold [&>h3]:my-2 [&>strong]:font-bold [&>em]:italic [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>li]:my-1 [&>code]:bg-black/10 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>pre]:bg-black/10 [&>pre]:p-3 [&>pre]:rounded [&>pre]:overflow-x-auto [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <span>{children}</span>,
                              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              code: ({ children }) => <code className="bg-black/10 px-1 py-0.5 rounded text-sm">{children}</code>,
                              ul: ({ children }) => <ul className="list-disc pl-6 my-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-6 my-2">{children}</ol>,
                              li: ({ children }) => <li className="my-1">{children}</li>,
                              h1: ({ children }) => <h1 className="text-xl font-bold my-3">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-lg font-bold my-2">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-base font-bold my-2">{children}</h3>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        <p className="text-xs opacity-70 mt-2">
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                {/* Streaming message */}
                {isStreaming && streamingMessage && (
                  <div className="flex gap-4 max-w-[90%]">
                    <Avatar className="w-10 h-10 mt-1 flex-shrink-0">
                      <AvatarImage src={agent.avatar_url} alt={agent.name} />
                      <AvatarFallback className="bg-muted">
                        {agent.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-xl px-4 py-3 text-base">
                      <div className="markdown-content whitespace-pre-wrap break-words leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>p]:my-2 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:my-3 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:my-2 [&>h3]:text-base [&>h3]:font-bold [&>h3]:my-2 [&>strong]:font-bold [&>em]:italic [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>li]:my-1 [&>code]:bg-black/10 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>pre]:bg-black/10 [&>pre]:p-3 [&>pre]:rounded [&>pre]:overflow-x-auto [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <span>{children}</span>,
                            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            code: ({ children }) => <code className="bg-black/10 px-1 py-0.5 rounded text-sm">{children}</code>,
                            ul: ({ children }) => <ul className="list-disc pl-6 my-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-6 my-2">{children}</ol>,
                            li: ({ children }) => <li className="my-1">{children}</li>,
                            h1: ({ children }) => <h1 className="text-xl font-bold my-3">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-lg font-bold my-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base font-bold my-2">{children}</h3>,
                          }}
                        >
                          {streamingMessage}
                        </ReactMarkdown>
                        <span className="animate-pulse">|</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {isLoading && !isStreaming && (
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
                  disabled={isLoading || isStreaming}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading || isStreaming}
                  className="self-end px-4 py-3"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
} 